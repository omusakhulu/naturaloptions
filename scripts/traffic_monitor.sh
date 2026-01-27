#!/bin/bash
# Traffic Monitoring Script - Detects and responds to DDoS attacks
# Place in /usr/local/bin/traffic_monitor.sh and add to cron

# Configuration
THRESHOLD_MBPS=100
INTERFACE="eth0"
ALERT_EMAIL="admin@example.com"
LOG_DIR="/var/log/traffic_monitor"
LOCKFILE="/var/run/traffic_monitor.lock"

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Prevent multiple instances
if [ -f "$LOCKFILE" ]; then
    echo "Another instance is already running."
    exit 1
fi
touch "$LOCKFILE"
trap "rm -f $LOCKFILE" EXIT

# Function to get current bandwidth
get_bandwidth() {
    # Using /proc/net/dev for more reliable readings
    local rx_bytes_before=$(cat /proc/net/dev | grep $INTERFACE | awk '{print $2}')
    local tx_bytes_before=$(cat /proc/net/dev | grep $INTERFACE | awk '{print $10}')
    
    sleep 5
    
    local rx_bytes_after=$(cat /proc/net/dev | grep $INTERFACE | awk '{print $2}')
    local tx_bytes_after=$(cat /proc/net/dev | grep $INTERFACE | awk '{print $10}')
    
    # Calculate Mbps
    local rx_mbps=$(( ($rx_bytes_after - $rx_bytes_before) * 8 / 5 / 1000000 ))
    local tx_mbps=$(( ($tx_bytes_after - $tx_bytes_before) * 8 / 5 / 1000000 ))
    
    echo "$tx_mbps"
}

# Function to check for suspicious connections
check_suspicious_connections() {
    # Check for high number of connections to single port
    netstat -ntu | awk '{print $5}' | cut -d: -f2 | sort | uniq -c | sort -rn | head -10 > "$LOG_DIR/top_ports_$(date +%Y%m%d_%H%M%S).log"
    
    # Check for connections to known DDoS ports
    local suspicious_ports="19 53 123 161 389 1900 5353 11211 5817"
    for port in $suspicious_ports; do
        local count=$(netstat -ntu | grep ":$port " | wc -l)
        if [ $count -gt 10 ]; then
            echo "WARNING: $count connections to port $port detected" >> "$LOG_DIR/suspicious_$(date +%Y%m%d_%H%M%S).log"
        fi
    done
}

# Function to block outbound DDoS traffic
emergency_block() {
    echo "$(date): Emergency DDoS mitigation activated" >> "$LOG_DIR/emergency.log"
    
    # Save current iptables rules
    iptables-save > "$LOG_DIR/iptables_backup_$(date +%Y%m%d_%H%M%S).rules"
    
    # Block all NEW outbound connections except essential services
    iptables -I OUTPUT 1 -m state --state NEW -p tcp --dport 22 -j ACCEPT
    iptables -I OUTPUT 2 -m state --state NEW -p tcp --dport 80 -j ACCEPT
    iptables -I OUTPUT 3 -m state --state NEW -p tcp --dport 443 -j ACCEPT
    iptables -I OUTPUT 4 -m state --state NEW -p tcp --dport 25 -j ACCEPT
    iptables -I OUTPUT 5 -m state --state NEW -j DROP
    
    # Rate limit all UDP traffic
    iptables -I OUTPUT 1 -p udp -m limit --limit 10/second --limit-burst 20 -j ACCEPT
    iptables -I OUTPUT 2 -p udp -j DROP
    
    # Log all blocked packets
    iptables -I OUTPUT 6 -j LOG --log-prefix "DDoS-Blocked: " --log-level 4
}

# Main monitoring logic
main() {
    local current_bandwidth=$(get_bandwidth)
    
    echo "$(date): Current outbound bandwidth: ${current_bandwidth} Mbps" >> "$LOG_DIR/bandwidth.log"
    
    if [ $current_bandwidth -gt $THRESHOLD_MBPS ]; then
        echo "$(date): HIGH TRAFFIC ALERT - ${current_bandwidth} Mbps exceeds threshold of ${THRESHOLD_MBPS} Mbps" >> "$LOG_DIR/alerts.log"
        
        # Capture current state
        netstat -tupn > "$LOG_DIR/connections_$(date +%Y%m%d_%H%M%S).log"
        ps auxf > "$LOG_DIR/processes_$(date +%Y%m%d_%H%M%S).log"
        top -b -n 1 > "$LOG_DIR/top_$(date +%Y%m%d_%H%M%S).log"
        ss -tupn > "$LOG_DIR/sockets_$(date +%Y%m%d_%H%M%S).log"
        
        # Check for suspicious activity
        check_suspicious_connections
        
        # Check if emergency block is already active
        if ! iptables -L OUTPUT -n | grep -q "DDoS-Blocked"; then
            emergency_block
            
            # Send alert
            {
                echo "Subject: DDoS Attack Detected on $(hostname)"
                echo ""
                echo "High outbound traffic detected: ${current_bandwidth} Mbps"
                echo "Threshold: ${THRESHOLD_MBPS} Mbps"
                echo "Time: $(date)"
                echo "Emergency blocking rules have been applied."
                echo ""
                echo "Top connections:"
                netstat -ntu | awk '{print $5}' | cut -d: -f1 | sort | uniq -c | sort -rn | head -10
                echo ""
                echo "Check logs in $LOG_DIR for details"
            } | sendmail "$ALERT_EMAIL" 2>/dev/null || echo "Failed to send email alert"
        fi
    else
        # If traffic is normal and emergency block is active, consider removing it
        if iptables -L OUTPUT -n | grep -q "DDoS-Blocked"; then
            # Check if traffic has been normal for at least 15 minutes
            local last_alert=$(grep "HIGH TRAFFIC ALERT" "$LOG_DIR/alerts.log" | tail -1 | cut -d: -f1-3)
            if [ ! -z "$last_alert" ]; then
                local last_alert_epoch=$(date -d "$last_alert" +%s 2>/dev/null || echo 0)
                local current_epoch=$(date +%s)
                local diff=$(( $current_epoch - $last_alert_epoch ))
                
                if [ $diff -gt 900 ]; then  # 15 minutes
                    echo "$(date): Traffic normalized, removing emergency blocks" >> "$LOG_DIR/alerts.log"
                    # Remove only our emergency rules
                    iptables -D OUTPUT -j LOG --log-prefix "DDoS-Blocked: " --log-level 4 2>/dev/null
                    iptables -D OUTPUT -m state --state NEW -j DROP 2>/dev/null
                    iptables -D OUTPUT -p udp -j DROP 2>/dev/null
                    iptables -D OUTPUT -p udp -m limit --limit 10/second --limit-burst 20 -j ACCEPT 2>/dev/null
                fi
            fi
        fi
    fi
}

# Run main function
main

# Cleanup
rm -f "$LOCKFILE"
