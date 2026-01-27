#!/bin/bash
# Initial Server Hardening Script
# Run this immediately on new server deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration variables
NEW_SSH_PORT=2222
ADMIN_USER="adminuser"
ADMIN_EMAIL="admin@example.com"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   INITIAL SERVER HARDENING SCRIPT     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}[!] This script must be run as root${NC}"
    exit 1
fi

# Function to configure firewall
setup_firewall() {
    echo -e "${YELLOW}[*] Configuring firewall...${NC}"
    
    # Install UFW if not present
    which ufw > /dev/null 2>&1 || apt-get install -y ufw
    
    # Basic UFW configuration
    ufw --force disable
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow essential services
    ufw allow 22/tcp comment 'SSH-Temporary'
    ufw allow $NEW_SSH_PORT/tcp comment 'SSH-New'
    ufw allow 80/tcp comment 'HTTP'
    ufw allow 443/tcp comment 'HTTPS'
    
    # Rate limiting for SSH
    ufw limit $NEW_SSH_PORT/tcp
    
    # Enable UFW
    ufw --force enable
    
    echo -e "${GREEN}[✓] Firewall configured${NC}"
}

# Function to harden SSH
harden_ssh() {
    echo -e "${YELLOW}[*] Hardening SSH configuration...${NC}"
    
    # Backup original SSH config
    cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup.$(date +%Y%m%d)
    
    # Apply hardened configuration
    cat > /etc/ssh/sshd_config.d/99-hardened.conf << EOF
# Hardened SSH Configuration
Port $NEW_SSH_PORT
Protocol 2
PermitRootLogin no
PubkeyAuthentication yes
PasswordAuthentication yes  # Will disable after key setup
MaxAuthTries 3
MaxSessions 2
ClientAliveInterval 300
ClientAliveCountMax 2
PermitEmptyPasswords no
X11Forwarding no
IgnoreRhosts yes
HostbasedAuthentication no
StrictModes yes
LoginGraceTime 60
Banner /etc/ssh/banner.txt

# Limit users who can SSH
AllowUsers $ADMIN_USER

# Ciphers and algorithms
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com
KexAlgorithms curve25519-sha256,curve25519-sha256@libssh.org
EOF

    # Create SSH banner
    cat > /etc/ssh/banner.txt << EOF
****************************************************************************
                            AUTHORIZED ACCESS ONLY
Unauthorized access to this system is forbidden and will be prosecuted
by law. By accessing this system, you agree that your actions may be
monitored and recorded.
****************************************************************************
EOF

    echo -e "${GREEN}[✓] SSH configuration hardened${NC}"
}

# Function to setup fail2ban
setup_fail2ban() {
    echo -e "${YELLOW}[*] Installing and configuring fail2ban...${NC}"
    
    apt-get update
    apt-get install -y fail2ban
    
    # Create custom jail configuration
    cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
destemail = $ADMIN_EMAIL
action = %(action_mwl)s

[sshd]
enabled = true
port = $NEW_SSH_PORT
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 7200

[sshd-ddos]
enabled = true
port = $NEW_SSH_PORT
filter = sshd-ddos
logpath = /var/log/auth.log
maxretry = 10
findtime = 60
bantime = 86400

[apache-auth]
enabled = true
port = http,https
filter = apache-auth
logpath = /var/log/apache2/*error.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3
EOF

    # Create SSH DDoS filter
    cat > /etc/fail2ban/filter.d/sshd-ddos.conf << EOF
[Definition]
failregex = ^.*sshd\[.*\]: Did not receive identification string from <HOST>$
            ^.*sshd\[.*\]: Connection from <HOST> port .* \[preauth\]$
ignoreregex =
EOF

    systemctl restart fail2ban
    systemctl enable fail2ban
    
    echo -e "${GREEN}[✓] Fail2ban configured${NC}"
}

# Function to configure kernel parameters
harden_kernel() {
    echo -e "${YELLOW}[*] Hardening kernel parameters...${NC}"
    
    # Backup current sysctl configuration
    cp /etc/sysctl.conf /etc/sysctl.conf.backup.$(date +%Y%m%d)
    
    # Apply hardened kernel parameters
    cat >> /etc/sysctl.conf << EOF

# Security Hardening Parameters
# IP Spoofing protection
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1

# Ignore ICMP redirects
net.ipv4.conf.all.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0

# Ignore ICMP ping requests
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.icmp_ignore_bogus_error_responses = 1

# Disable source packet routing
net.ipv4.conf.all.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0

# Log Martians
net.ipv4.conf.all.log_martians = 1

# SYN flood protection
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.tcp_synack_retries = 2
net.ipv4.tcp_syn_retries = 5

# Time-wait assassination hazards protection
net.ipv4.tcp_rfc1337 = 1

# Decrease the time default value for tcp_fin_timeout
net.ipv4.tcp_fin_timeout = 30

# Decrease the time default value for connections to keep alive
net.ipv4.tcp_keepalive_time = 300
net.ipv4.tcp_keepalive_intvl = 60
net.ipv4.tcp_keepalive_probes = 5

# Don't relay bootp
net.ipv4.conf.all.bootp_relay = 0

# Don't proxy arp for anyone
net.ipv4.conf.all.proxy_arp = 0

# Turn on ASLR
kernel.randomize_va_space = 2

# Don't allow users to view dmesg
kernel.dmesg_restrict = 1

# Restrict core dumps
fs.suid_dumpable = 0
kernel.core_uses_pid = 1

# Restrict ptrace scope
kernel.yama.ptrace_scope = 1

# Protect against time-wait assassination
net.ipv4.tcp_rfc1337 = 1

# Increase system file descriptor limit
fs.file-max = 65535

# Connection tracking limits (prevent DDoS)
net.netfilter.nf_conntrack_max = 32768
net.netfilter.nf_conntrack_tcp_timeout_established = 600
net.netfilter.nf_conntrack_tcp_timeout_time_wait = 60
net.netfilter.nf_conntrack_tcp_timeout_close_wait = 60
net.netfilter.nf_conntrack_tcp_timeout_fin_wait = 60
EOF

    # Apply the changes
    sysctl -p
    
    echo -e "${GREEN}[✓] Kernel parameters hardened${NC}"
}

# Function to install security tools
install_security_tools() {
    echo -e "${YELLOW}[*] Installing essential security tools...${NC}"
    
    apt-get update
    apt-get install -y \
        aide \
        rkhunter \
        clamav \
        clamav-daemon \
        logwatch \
        unattended-upgrades \
        apt-listchanges \
        needrestart \
        debsecan \
        debsums \
        chkrootkit \
        lynis \
        auditd \
        rsyslog \
        net-tools \
        iptables-persistent \
        vim \
        htop \
        iotop \
        iftop \
        nethogs \
        vnstat
    
    # Initialize AIDE
    aideinit -y -f
    
    # Update rkhunter
    rkhunter --update
    rkhunter --propupd
    
    # Update ClamAV
    freshclam
    
    echo -e "${GREEN}[✓] Security tools installed${NC}"
}

# Function to create admin user
create_admin_user() {
    echo -e "${YELLOW}[*] Creating admin user...${NC}"
    
    # Check if user already exists
    if id "$ADMIN_USER" &>/dev/null; then
        echo -e "${YELLOW}[!] User $ADMIN_USER already exists${NC}"
    else
        # Create user with home directory
        useradd -m -s /bin/bash "$ADMIN_USER"
        
        # Add to sudo group
        usermod -aG sudo "$ADMIN_USER"
        
        # Generate strong random password
        ADMIN_PASS=$(openssl rand -base64 32)
        echo "$ADMIN_USER:$ADMIN_PASS" | chpasswd
        
        # Save credentials securely
        echo "Admin User: $ADMIN_USER" > /root/admin_credentials.txt
        echo "Admin Password: $ADMIN_PASS" >> /root/admin_credentials.txt
        chmod 600 /root/admin_credentials.txt
        
        echo -e "${GREEN}[✓] Admin user created. Credentials saved in /root/admin_credentials.txt${NC}"
        echo -e "${RED}[!] CHANGE THIS PASSWORD IMMEDIATELY!${NC}"
    fi
    
    # Setup SSH key directory
    mkdir -p /home/$ADMIN_USER/.ssh
    chmod 700 /home/$ADMIN_USER/.ssh
    touch /home/$ADMIN_USER/.ssh/authorized_keys
    chmod 600 /home/$ADMIN_USER/.ssh/authorized_keys
    chown -R $ADMIN_USER:$ADMIN_USER /home/$ADMIN_USER/.ssh
}

# Function to setup automatic updates
setup_auto_updates() {
    echo -e "${YELLOW}[*] Configuring automatic updates...${NC}"
    
    # Configure unattended-upgrades
    cat > /etc/apt/apt.conf.d/50unattended-upgrades << EOF
Unattended-Upgrade::Allowed-Origins {
    "\${distro_id}:\${distro_codename}-security";
    "\${distro_id}:\${distro_codename}-updates";
};
Unattended-Upgrade::Package-Blacklist {
};
Unattended-Upgrade::DevRelease "false";
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
Unattended-Upgrade::Automatic-Reboot-Time "03:00";
Unattended-Upgrade::Mail "$ADMIN_EMAIL";
EOF

    # Enable automatic updates
    cat > /etc/apt/apt.conf.d/20auto-upgrades << EOF
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
APT::Periodic::Unattended-Upgrade "1";
EOF

    echo -e "${GREEN}[✓] Automatic updates configured${NC}"
}

# Function to setup monitoring
setup_monitoring() {
    echo -e "${YELLOW}[*] Setting up basic monitoring...${NC}"
    
    # Setup logwatch
    cat > /etc/cron.daily/00logwatch << EOF
#!/bin/bash
/usr/sbin/logwatch --output mail --mailto $ADMIN_EMAIL --detail high
EOF
    chmod +x /etc/cron.daily/00logwatch
    
    # Setup daily security checks
    cat > /etc/cron.daily/security-check << EOF
#!/bin/bash
# Daily security check
echo "Daily Security Report - \$(date)" > /tmp/security_report.txt
echo "========================" >> /tmp/security_report.txt
echo "" >> /tmp/security_report.txt

echo "Failed Login Attempts:" >> /tmp/security_report.txt
grep "Failed password" /var/log/auth.log | tail -20 >> /tmp/security_report.txt

echo "" >> /tmp/security_report.txt
echo "Current Connections:" >> /tmp/security_report.txt
netstat -tulpn >> /tmp/security_report.txt

echo "" >> /tmp/security_report.txt
echo "Disk Usage:" >> /tmp/security_report.txt
df -h >> /tmp/security_report.txt

mail -s "Daily Security Report - \$(hostname)" $ADMIN_EMAIL < /tmp/security_report.txt
rm /tmp/security_report.txt
EOF
    chmod +x /etc/cron.daily/security-check
    
    # Setup vnstat for bandwidth monitoring
    systemctl enable vnstat
    systemctl start vnstat
    
    echo -e "${GREEN}[✓] Monitoring configured${NC}"
}

# Function to create summary
create_summary() {
    echo -e "${YELLOW}[*] Creating configuration summary...${NC}"
    
    cat > /root/hardening_summary.txt << EOF
SERVER HARDENING SUMMARY
========================
Date: $(date)
Hostname: $(hostname)

COMPLETED ACTIONS:
------------------
✓ Firewall configured (UFW)
✓ SSH hardened (Port: $NEW_SSH_PORT)
✓ Fail2ban installed and configured
✓ Kernel parameters hardened
✓ Security tools installed
✓ Admin user created: $ADMIN_USER
✓ Automatic updates configured
✓ Basic monitoring setup

IMPORTANT NEXT STEPS:
--------------------
1. Add your SSH public key to /home/$ADMIN_USER/.ssh/authorized_keys
2. Test SSH connection on port $NEW_SSH_PORT
3. Disable password authentication in SSH config
4. Change the admin password (see /root/admin_credentials.txt)
5. Configure application-specific security settings
6. Review and adjust firewall rules for your services
7. Setup proper backup strategy
8. Configure log management and retention

SECURITY TOOLS INSTALLED:
-------------------------
- AIDE (File integrity monitoring)
- rkhunter (Rootkit scanner)
- ClamAV (Antivirus)
- fail2ban (Brute force protection)
- Logwatch (Log analysis)
- Lynis (Security auditing)
- auditd (System auditing)

MONITORING:
-----------
- Daily security reports via email
- Bandwidth monitoring (vnstat)
- Log analysis (logwatch)
- Automatic security updates

FIREWALL RULES:
--------------
$(ufw status numbered)

SSH CONFIGURATION:
-----------------
Port: $NEW_SSH_PORT
Root Login: Disabled
Password Auth: Enabled (disable after key setup)
Max Auth Tries: 3
Allowed Users: $ADMIN_USER

For questions or issues, review documentation at:
/Users/joe/naturaloptions/SECURITY_HARDENING_PLAN.md
EOF

    echo -e "${GREEN}[✓] Summary created: /root/hardening_summary.txt${NC}"
}

# Main execution
main() {
    echo -e "${BLUE}Starting server hardening process...${NC}"
    echo ""
    
    setup_firewall
    harden_ssh
    setup_fail2ban
    harden_kernel
    install_security_tools
    create_admin_user
    setup_auto_updates
    setup_monitoring
    create_summary
    
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║    HARDENING COMPLETE                 ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}CRITICAL ACTIONS REQUIRED:${NC}"
    echo "1. Add your SSH public key to: /home/$ADMIN_USER/.ssh/authorized_keys"
    echo "2. Test SSH connection: ssh -p $NEW_SSH_PORT $ADMIN_USER@$(hostname -I | awk '{print $1}')"
    echo "3. Once confirmed working, disable password auth in SSH"
    echo "4. Review /root/hardening_summary.txt for complete details"
    echo ""
    echo -e "${RED}WARNING: SSH is now on port $NEW_SSH_PORT${NC}"
    echo -e "${RED}Do not close this session until you confirm new SSH access!${NC}"
}

# Run main function
main

exit 0
