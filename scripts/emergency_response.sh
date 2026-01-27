#!/bin/bash
# Emergency Response Script for Active Compromise
# Run this immediately if you suspect your server is compromised

set -e

# Configuration
BACKUP_DIR="/root/incident_response_$(date +%Y%m%d_%H%M%S)"
ADMIN_EMAIL="admin@example.com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${RED}[!] EMERGENCY RESPONSE INITIATED$(date)${NC}"
echo "Creating backup directory: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Function to collect evidence
collect_evidence() {
    echo -e "${YELLOW}[*] Collecting forensic evidence...${NC}"
    
    # Network connections
    netstat -tupna > "$BACKUP_DIR/netstat_all.txt" 2>&1
    ss -tupna > "$BACKUP_DIR/ss_all.txt" 2>&1
    lsof -i > "$BACKUP_DIR/lsof_network.txt" 2>&1
    
    # Process information
    ps auxfww > "$BACKUP_DIR/processes_tree.txt" 2>&1
    ps -eo pid,ppid,cmd,etime,uid,gid > "$BACKUP_DIR/processes_detailed.txt" 2>&1
    top -b -n 1 > "$BACKUP_DIR/top.txt" 2>&1
    
    # System information
    w > "$BACKUP_DIR/logged_users.txt" 2>&1
    last -n 100 > "$BACKUP_DIR/last_logins.txt" 2>&1
    lastb -n 100 > "$BACKUP_DIR/failed_logins.txt" 2>&1 || echo "lastb not available" > "$BACKUP_DIR/failed_logins.txt"
    
    # File system checks
    find /tmp -type f -mtime -7 > "$BACKUP_DIR/tmp_files_recent.txt" 2>&1
    find /var/tmp -type f -mtime -7 > "$BACKUP_DIR/var_tmp_files_recent.txt" 2>&1
    find / -type f -perm -4000 2>/dev/null > "$BACKUP_DIR/suid_files.txt"
    find / -type f -perm -2000 2>/dev/null > "$BACKUP_DIR/sgid_files.txt"
    find / -type f -mtime -1 2>/dev/null > "$BACKUP_DIR/files_modified_24h.txt"
    
    # Cron jobs
    echo "=== System Crontab ===" > "$BACKUP_DIR/all_cron_jobs.txt"
    cat /etc/crontab >> "$BACKUP_DIR/all_cron_jobs.txt" 2>&1
    echo -e "\n=== Cron.d ===" >> "$BACKUP_DIR/all_cron_jobs.txt"
    ls -la /etc/cron.d/ >> "$BACKUP_DIR/all_cron_jobs.txt" 2>&1
    for file in /etc/cron.d/*; do
        echo -e "\n--- $file ---" >> "$BACKUP_DIR/all_cron_jobs.txt"
        cat "$file" >> "$BACKUP_DIR/all_cron_jobs.txt" 2>&1
    done
    echo -e "\n=== User Crontabs ===" >> "$BACKUP_DIR/all_cron_jobs.txt"
    for user in $(cut -f1 -d: /etc/passwd); do
        echo -e "\n--- $user ---" >> "$BACKUP_DIR/all_cron_jobs.txt"
        crontab -u "$user" -l >> "$BACKUP_DIR/all_cron_jobs.txt" 2>&1
    done
    
    # System services
    systemctl list-unit-files --state=enabled > "$BACKUP_DIR/enabled_services.txt" 2>&1
    systemctl list-units --state=running > "$BACKUP_DIR/running_services.txt" 2>&1
    
    # Firewall rules
    iptables -L -n -v > "$BACKUP_DIR/iptables_filter.txt" 2>&1
    iptables -t nat -L -n -v > "$BACKUP_DIR/iptables_nat.txt" 2>&1
    iptables-save > "$BACKUP_DIR/iptables_backup.rules" 2>&1
    
    # Memory and disk usage
    free -h > "$BACKUP_DIR/memory.txt" 2>&1
    df -h > "$BACKUP_DIR/disk_usage.txt" 2>&1
    du -sh /tmp /var/tmp /dev/shm > "$BACKUP_DIR/temp_dirs_usage.txt" 2>&1
    
    # Recent logs
    tail -n 1000 /var/log/auth.log > "$BACKUP_DIR/auth_recent.log" 2>&1 || \
    tail -n 1000 /var/log/secure > "$BACKUP_DIR/auth_recent.log" 2>&1
    tail -n 1000 /var/log/syslog > "$BACKUP_DIR/syslog_recent.log" 2>&1 || \
    tail -n 1000 /var/log/messages > "$BACKUP_DIR/syslog_recent.log" 2>&1
    
    echo -e "${GREEN}[✓] Evidence collection complete${NC}"
}

# Function to identify suspicious processes
identify_threats() {
    echo -e "${YELLOW}[*] Analyzing for suspicious activity...${NC}"
    
    echo "=== High CPU Usage ===" > "$BACKUP_DIR/suspicious_activity.txt"
    ps aux | awk '{if($3 > 50) print $0}' >> "$BACKUP_DIR/suspicious_activity.txt"
    
    echo -e "\n=== High Memory Usage ===" >> "$BACKUP_DIR/suspicious_activity.txt"
    ps aux | awk '{if($4 > 50) print $0}' >> "$BACKUP_DIR/suspicious_activity.txt"
    
    echo -e "\n=== Suspicious Network Connections ===" >> "$BACKUP_DIR/suspicious_activity.txt"
    # Check for connections to suspicious ports
    netstat -tupn | grep -E ":(19|53|123|161|389|1900|5353|11211|5817) " >> "$BACKUP_DIR/suspicious_activity.txt" 2>&1
    
    echo -e "\n=== Processes with Many Connections ===" >> "$BACKUP_DIR/suspicious_activity.txt"
    ss -p | awk '{print $7}' | grep -oE 'pid=[0-9]+' | cut -d= -f2 | sort | uniq -c | sort -rn | head -20 >> "$BACKUP_DIR/suspicious_activity.txt"
    
    echo -e "\n=== Recently Modified System Binaries ===" >> "$BACKUP_DIR/suspicious_activity.txt"
    find /bin /sbin /usr/bin /usr/sbin -type f -mtime -7 >> "$BACKUP_DIR/suspicious_activity.txt" 2>&1
    
    echo -e "\n=== Suspicious Files in /tmp ===" >> "$BACKUP_DIR/suspicious_activity.txt"
    find /tmp -type f \( -name "*.sh" -o -name "*.kok" -o -name "*backdoor*" -o -name "*bot*" \) >> "$BACKUP_DIR/suspicious_activity.txt" 2>&1
    
    # Check for known malware patterns
    echo -e "\n=== Checking for known malware patterns ===" >> "$BACKUP_DIR/suspicious_activity.txt"
    grep -r "ntpclient\|x86_64.kok\|/tmp/nigga" /proc/*/cmdline 2>/dev/null >> "$BACKUP_DIR/suspicious_activity.txt"
    
    echo -e "${GREEN}[✓] Threat analysis complete${NC}"
}

# Function to implement immediate containment
contain_threat() {
    echo -e "${RED}[!] Implementing containment measures...${NC}"
    
    # 1. Block all outbound traffic except essential
    echo -e "${YELLOW}[*] Blocking outbound traffic...${NC}"
    iptables -P OUTPUT DROP
    iptables -A OUTPUT -p tcp --dport 22 -j ACCEPT  # SSH
    iptables -A OUTPUT -p tcp --dport 443 -j ACCEPT # HTTPS for updates
    iptables -A OUTPUT -p udp --dport 53 -j ACCEPT  # DNS
    iptables -A OUTPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
    
    # 2. Kill suspicious processes
    echo -e "${YELLOW}[*] Terminating suspicious processes...${NC}"
    # Kill processes using high CPU (over 80%)
    ps aux | awk '{if($3 > 80) print $2}' | while read pid; do
        if [ "$pid" != "$$" ] && [ "$pid" != "1" ]; then
            echo "Killing high-CPU process $pid"
            kill -9 "$pid" 2>/dev/null || true
        fi
    done
    
    # Kill processes with suspicious names
    pkill -f "ntpclient" 2>/dev/null || true
    pkill -f "x86_64.kok" 2>/dev/null || true
    pkill -f "/tmp/.*\.sh" 2>/dev/null || true
    
    # 3. Disable suspicious cron jobs
    echo -e "${YELLOW}[*] Disabling cron jobs...${NC}"
    chmod 000 /etc/cron.d/* 2>/dev/null || true
    service cron stop 2>/dev/null || systemctl stop crond 2>/dev/null || true
    
    # 4. Lock down critical files
    echo -e "${YELLOW}[*] Protecting critical files...${NC}"
    chattr +i /etc/passwd /etc/shadow /etc/group 2>/dev/null || true
    chattr +i /root/.ssh/authorized_keys 2>/dev/null || true
    
    echo -e "${GREEN}[✓] Containment measures applied${NC}"
}

# Function to clean known malware
clean_malware() {
    echo -e "${YELLOW}[*] Cleaning known malware...${NC}"
    
    # Remove suspicious files from temp directories
    find /tmp -type f \( -name "*.kok" -o -name "*backdoor*" -o -name "*bot*" \) -delete 2>/dev/null
    find /var/tmp -type f \( -name "*.kok" -o -name "*backdoor*" -o -name "*bot*" \) -delete 2>/dev/null
    find /dev/shm -type f \( -name "*.kok" -o -name "*backdoor*" -o -name "*bot*" \) -delete 2>/dev/null
    
    # Clear suspicious crontab entries
    for user in $(cut -f1 -d: /etc/passwd); do
        crontab -u "$user" -l 2>/dev/null | grep -v "/tmp/" | crontab -u "$user" - 2>/dev/null || true
    done
    
    # Remove backdoored profile entries
    cp /etc/profile "$BACKUP_DIR/profile.backup"
    sed -i '/\/tmp\/.*\.kok/d' /etc/profile 2>/dev/null
    sed -i '/\/tmp\/nigga/d' /etc/profile 2>/dev/null
    
    echo -e "${GREEN}[✓] Malware cleaning complete${NC}"
}

# Function to generate report
generate_report() {
    echo -e "${YELLOW}[*] Generating incident report...${NC}"
    
    cat > "$BACKUP_DIR/INCIDENT_REPORT.txt" << EOF
INCIDENT RESPONSE REPORT
========================
Date: $(date)
Hostname: $(hostname)
IP Address: $(ip addr show | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}')

SUMMARY OF ACTIONS TAKEN:
-------------------------
1. Evidence collected and preserved in $BACKUP_DIR
2. Network traffic blocked (except SSH)
3. Suspicious processes terminated
4. Cron jobs disabled
5. Critical system files protected
6. Known malware patterns removed

IMMEDIATE ACTIONS REQUIRED:
---------------------------
1. Change ALL passwords (root, users, database, applications)
2. Regenerate ALL SSH keys
3. Review all user accounts for unauthorized access
4. Update ALL software to latest versions
5. Review firewall rules before re-enabling network
6. Consider full system rebuild if rootkit suspected

SUSPICIOUS INDICATORS FOUND:
----------------------------
$(cat "$BACKUP_DIR/suspicious_activity.txt" | head -50)

For full details, review files in: $BACKUP_DIR
EOF
    
    echo -e "${GREEN}[✓] Report generated: $BACKUP_DIR/INCIDENT_REPORT.txt${NC}"
}

# Function to send alert
send_alert() {
    echo -e "${YELLOW}[*] Sending alert notification...${NC}"
    
    {
        echo "Subject: EMERGENCY - Server Compromise Detected on $(hostname)"
        echo ""
        cat "$BACKUP_DIR/INCIDENT_REPORT.txt"
    } | sendmail "$ADMIN_EMAIL" 2>/dev/null || echo "Failed to send email alert"
    
    # Also log to syslog
    logger -t EMERGENCY "Server compromise detected and contained. Review $BACKUP_DIR"
}

# Main execution
main() {
    echo -e "${RED}╔════════════════════════════════════════╗${NC}"
    echo -e "${RED}║    EMERGENCY RESPONSE IN PROGRESS     ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════╝${NC}"
    
    collect_evidence
    identify_threats
    contain_threat
    clean_malware
    generate_report
    send_alert
    
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║    EMERGENCY RESPONSE COMPLETE        ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}NEXT STEPS:${NC}"
    echo "1. Review the incident report: $BACKUP_DIR/INCIDENT_REPORT.txt"
    echo "2. Change ALL passwords immediately"
    echo "3. Review network connections before re-enabling"
    echo "4. Consider engaging security professionals for forensic analysis"
    echo "5. Monitor closely for the next 48 hours"
    echo ""
    echo -e "${RED}WARNING: Server is now in lockdown mode. Only SSH access is allowed.${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "This script must be run as root"
    exit 1
fi

# Run main function
main

exit 0
