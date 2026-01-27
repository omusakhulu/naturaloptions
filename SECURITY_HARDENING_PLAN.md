# Comprehensive Security Hardening Plan
## Prevention of DDoS/Brute Force Attack Vectors

### Executive Summary
This plan addresses the compromise that led to your server (185.181.8.53) being used in a UDP flood DDoS attack. The attack generated 267 Mbps of malicious traffic, targeting port 5817 on multiple destinations.

---

## 1. Software & System Management Checklist

### Operating System Level
- [ ] **Enable automatic security updates**
  ```bash
  # Ubuntu/Debian
  apt install unattended-upgrades
  dpkg-reconfigure --priority=low unattended-upgrades
  
  # CentOS/RHEL
  yum install yum-cron
  systemctl enable yum-cron
  ```

- [ ] **Update all packages immediately**
  ```bash
  apt update && apt upgrade -y  # Ubuntu/Debian
  yum update -y                  # CentOS/RHEL
  ```

- [ ] **Remove unnecessary packages**
  ```bash
  # List installed packages and remove unused ones
  dpkg -l | grep ^ii  # Debian/Ubuntu
  rpm -qa             # CentOS/RHEL
  ```

### Application Security
- [ ] **Web Applications (WordPress, Drupal, phpMyAdmin)**
  - Update to latest stable versions immediately
  - Remove unused plugins/themes
  - Implement Web Application Firewall (ModSecurity/Cloudflare)
  - Disable XML-RPC for WordPress: `add_filter('xmlrpc_enabled', '__return_false');`
  - Move phpMyAdmin to non-standard URL or remove if not needed
  - Enable auto-updates for WordPress: `define('WP_AUTO_UPDATE_CORE', true);`

- [ ] **Version Control Systems**
  - Update GitLab to latest version (never use pre-13.10.3)
  - Enable 2FA for all Git repositories
  - Restrict repository access by IP when possible

- [ ] **DNS Servers**
  - Update BIND/Microsoft DNS to latest versions
  - Implement rate limiting: `rate-limit { responses-per-second 10; };`
  - Disable recursion for public-facing DNS servers

### Patch Management Schedule
- [ ] Daily: Check for critical security updates
- [ ] Weekly: Apply all security patches
- [ ] Monthly: Full system audit and update
- [ ] Quarterly: Review and update all third-party applications

---

## 2. Access Control & Authentication

### SSH Hardening
```bash
# /etc/ssh/sshd_config modifications
Port 2222                          # Change from default 22
PermitRootLogin no                 # Disable root login
PasswordAuthentication no          # Force key-based auth
PubkeyAuthentication yes
MaxAuthTries 3                     # Limit authentication attempts
MaxSessions 2                      # Limit concurrent sessions
ClientAliveInterval 300            # Disconnect idle sessions
ClientAliveCountMax 2
AllowUsers specific_user           # Whitelist specific users
Protocol 2                         # Use SSH protocol 2 only
StrictModes yes
IgnoreRhosts yes
HostbasedAuthentication no
PermitEmptyPasswords no
X11Forwarding no                   # Disable unless needed
```

### Multi-Factor Authentication (MFA)
- [ ] **Install Google Authenticator PAM**
  ```bash
  apt install libpam-google-authenticator
  # Add to /etc/pam.d/sshd:
  auth required pam_google_authenticator.so
  # In /etc/ssh/sshd_config:
  ChallengeResponseAuthentication yes
  ```

### Password Policies
- [ ] **Implement strong password requirements**
  ```bash
  # /etc/pam.d/common-password
  password requisite pam_pwquality.so retry=3 minlen=14 dcredit=-1 ucredit=-1 ocredit=-1 lcredit=-1
  ```

- [ ] **Set password expiration**
  ```bash
  # /etc/login.defs
  PASS_MAX_DAYS 90
  PASS_MIN_DAYS 7
  PASS_WARN_AGE 14
  ```

### RDP Security (Windows)
- [ ] Change default RDP port (3389 to custom)
- [ ] Enable Network Level Authentication (NLA)
- [ ] Implement RD Gateway for external access
- [ ] Use Group Policy to enforce account lockout after 3 failed attempts
- [ ] Enable Windows Firewall with Advanced Security

### Administrative Panels
- [ ] **Never use default credentials** (ADMIN/ADMIN, admin/admin, root/root)
- [ ] Implement IP whitelisting for admin panels
- [ ] Use fail2ban for brute force protection
- [ ] Add CAPTCHA after 2 failed login attempts
- [ ] Implement session timeout (15 minutes idle)

---

## 3. Network and Firewall Rules

### Essential Firewall Configuration
```bash
# UFW (Ubuntu Firewall) Configuration
ufw default deny incoming
ufw default allow outgoing
ufw limit 2222/tcp                 # SSH with rate limiting
ufw allow 80/tcp                   # HTTP
ufw allow 443/tcp                  # HTTPS
ufw allow from 10.0.0.0/8 to any port 3306  # MySQL (internal only)
ufw enable

# IPTables Advanced Rules
# Block common attack ports
iptables -A INPUT -p tcp --dport 135:139 -j DROP
iptables -A INPUT -p tcp --dport 445 -j DROP
iptables -A INPUT -p udp --dport 135:139 -j DROP
iptables -A INPUT -p udp --dport 445 -j DROP

# Rate limiting for SSH
iptables -A INPUT -p tcp --dport 2222 -m state --state NEW -m recent --set
iptables -A INPUT -p tcp --dport 2222 -m state --state NEW -m recent --update --seconds 60 --hitcount 4 -j DROP

# Block DNS amplification
iptables -A INPUT -p udp --dport 53 -m string --algo bm --hex-string "|00 00 ff 00 01|" -j DROP

# Prevent SYN flood
iptables -A INPUT -p tcp ! --syn -m state --state NEW -j DROP
iptables -A INPUT -p tcp --tcp-flags ALL NONE -j DROP
iptables -A INPUT -p tcp --tcp-flags SYN,FIN SYN,FIN -j DROP

# Limit outbound connections (prevent DDoS participation)
iptables -A OUTPUT -p udp -m limit --limit 100/second --limit-burst 150 -j ACCEPT
iptables -A OUTPUT -p udp -j DROP

# Block outbound to common DDoS ports
iptables -A OUTPUT -p udp --dport 19 -j DROP    # Chargen
iptables -A OUTPUT -p udp --dport 53 -j DROP    # DNS (unless DNS server)
iptables -A OUTPUT -p udp --dport 123 -j DROP   # NTP (unless NTP server)
iptables -A OUTPUT -p udp --dport 161 -j DROP   # SNMP
iptables -A OUTPUT -p udp --dport 389 -j DROP   # LDAP
iptables -A OUTPUT -p udp --dport 1900 -j DROP  # SSDP
iptables -A OUTPUT -p udp --dport 5353 -j DROP  # mDNS
iptables -A OUTPUT -p udp --dport 11211 -j DROP # Memcached
```

### DDoS Mitigation Rules
```bash
# Kernel parameters for DDoS protection
# /etc/sysctl.conf
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.tcp_synack_retries = 2
net.ipv4.tcp_syn_retries = 5
net.ipv4.ip_forward = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.secure_redirects = 0
net.ipv4.conf.default.secure_redirects = 0
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.icmp_ignore_bogus_error_responses = 1
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.tcp_timestamps = 0
net.netfilter.nf_conntrack_max = 32768
net.netfilter.nf_conntrack_tcp_timeout_established = 600
net.netfilter.nf_conntrack_tcp_timeout_time_wait = 60
net.netfilter.nf_conntrack_tcp_timeout_close_wait = 60
net.netfilter.nf_conntrack_tcp_timeout_fin_wait = 60
```

---

## 4. Monitoring & Alerting Strategy

### Network Traffic Monitoring
- [ ] **Install vnStat for bandwidth monitoring**
  ```bash
  apt install vnstat
  vnstat -l  # Live monitoring
  ```

- [ ] **Deploy netdata for real-time monitoring**
  ```bash
  bash <(curl -Ss https://my-netdata.io/kickstart.sh)
  # Configure alerts for > 100 Mbps outbound traffic
  ```

- [ ] **Implement iftop for connection monitoring**
  ```bash
  apt install iftop
  # Create cron job to check for unusual traffic patterns
  */5 * * * * /usr/local/bin/traffic_monitor.sh
  ```

### Traffic Alert Script
```bash
#!/bin/bash
# /usr/local/bin/traffic_monitor.sh
THRESHOLD=100 # Mbps
INTERFACE="eth0"

# Get current bandwidth in Mbps
CURRENT=$(vnstat -tr 5 -i $INTERFACE | grep "tx" | awk '{print $2}')
UNIT=$(vnstat -tr 5 -i $INTERFACE | grep "tx" | awk '{print $3}')

if [[ "$UNIT" == "Mbit/s" ]] && (( $(echo "$CURRENT > $THRESHOLD" | bc -l) )); then
    echo "High outbound traffic detected: $CURRENT Mbps" | mail -s "DDoS Alert on $(hostname)" admin@example.com
    # Emergency block all NEW outbound connections
    iptables -I OUTPUT 1 -m state --state NEW -j DROP
    # Log all connections
    netstat -tupn > /var/log/emergency_connections_$(date +%Y%m%d_%H%M%S).log
fi
```

### System Integrity Monitoring
- [ ] **Install AIDE (Advanced Intrusion Detection Environment)**
  ```bash
  apt install aide
  aideinit
  # Add to cron for daily checks
  0 3 * * * /usr/bin/aide --check | mail -s "AIDE Report" admin@example.com
  ```

- [ ] **Deploy fail2ban**
  ```bash
  apt install fail2ban
  # Configure /etc/fail2ban/jail.local
  [sshd]
  enabled = true
  port = 2222
  maxretry = 3
  bantime = 3600
  
  [apache-auth]
  enabled = true
  maxretry = 3
  bantime = 3600
  ```

- [ ] **Install rkhunter (Rootkit Hunter)**
  ```bash
  apt install rkhunter
  rkhunter --update
  rkhunter --check --skip-keypress
  ```

### Log Analysis
- [ ] **Centralized logging with rsyslog**
  ```bash
  # /etc/rsyslog.conf
  *.* @@central-log-server:514
  ```

- [ ] **Install logwatch for daily summaries**
  ```bash
  apt install logwatch
  # Configure to email daily reports
  ```

### Alert Thresholds
- Outbound traffic > 100 Mbps sustained for 60 seconds
- More than 1000 connections from single IP
- Failed login attempts > 5 within 5 minutes
- New outbound connection to ports: 19, 53, 123, 161, 389, 1900, 5353, 11211
- CPU usage > 90% for 5 minutes
- Disk usage > 90%
- Unauthorized file changes in system directories

---

## 5. Initial Server Setup Checklist

### Immediate Actions (First 15 Minutes)
- [ ] **Change root password**
  ```bash
  passwd root
  ```

- [ ] **Create non-root admin user**
  ```bash
  adduser adminuser
  usermod -aG sudo adminuser
  ```

- [ ] **Update system**
  ```bash
  apt update && apt upgrade -y
  ```

- [ ] **Configure basic firewall**
  ```bash
  ufw default deny incoming
  ufw default allow outgoing
  ufw allow 22/tcp  # Will change later
  ufw enable
  ```

- [ ] **Install essential security tools**
  ```bash
  apt install -y fail2ban ufw unattended-upgrades aide rkhunter
  ```

### First Hour Configuration
- [ ] **Harden SSH configuration** (see SSH Hardening section)
- [ ] **Change SSH port and restart**
- [ ] **Generate SSH keys for admin user**
  ```bash
  ssh-keygen -t ed25519 -a 100
  ```
- [ ] **Disable password authentication after confirming key access**
- [ ] **Configure automatic updates**
- [ ] **Set up time synchronization**
  ```bash
  timedatectl set-ntp on
  ```
- [ ] **Configure swap if needed**
  ```bash
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  ```

### First Day Hardening
- [ ] **Install and configure monitoring tools**
- [ ] **Set up log rotation**
  ```bash
  # /etc/logrotate.d/custom
  /var/log/custom/*.log {
      daily
      rotate 30
      compress
      delaycompress
      missingok
      notifempty
  }
  ```
- [ ] **Configure kernel parameters** (see DDoS Mitigation Rules)
- [ ] **Set up backup strategy**
- [ ] **Document all services and open ports**
- [ ] **Remove unnecessary services**
  ```bash
  systemctl list-unit-files --state=enabled
  systemctl disable <unnecessary-service>
  ```
- [ ] **Configure AppArmor/SELinux**
  ```bash
  aa-enforce /etc/apparmor.d/*  # AppArmor
  setenforce 1                   # SELinux
  ```

### Security Audit Commands
```bash
# Check for listening ports
netstat -tulpn
ss -tulpn

# Check for established connections
netstat -tupn | grep ESTABLISHED

# Check running processes
ps auxf

# Check for unauthorized SUID binaries
find / -perm -4000 -type f 2>/dev/null

# Check for world-writable files
find / -perm -002 -type f 2>/dev/null

# Check cron jobs
crontab -l
ls -la /etc/cron.*
cat /etc/crontab

# Check for suspicious files in /tmp
ls -la /tmp
ls -la /var/tmp
ls -la /dev/shm
```

---

## Emergency Response Plan

### If Compromise is Detected
1. **Immediate isolation**
   ```bash
   # Block all outbound traffic except SSH
   iptables -P OUTPUT DROP
   iptables -A OUTPUT -p tcp --dport 22 -j ACCEPT
   ```

2. **Document evidence**
   ```bash
   netstat -tupn > /root/incident_$(date +%Y%m%d).log
   ps auxf >> /root/incident_$(date +%Y%m%d).log
   ```

3. **Identify and kill malicious processes**
   ```bash
   # Find high CPU/network usage processes
   top -b -n 1
   iftop -t -s 1
   ```

4. **Check for persistence mechanisms**
   ```bash
   # Check all cron jobs
   for user in $(cut -f1 -d: /etc/passwd); do 
       echo "=== $user ===" 
       crontab -u $user -l 2>/dev/null
   done
   
   # Check startup scripts
   ls -la /etc/init.d/
   systemctl list-unit-files --state=enabled
   ```

5. **Clean and rebuild**
   - Change all passwords
   - Regenerate all SSH keys
   - Review all user accounts
   - Consider full system rebuild if rootkit detected

---

## Regular Maintenance Schedule

### Daily
- Review auth.log for failed login attempts
- Check bandwidth usage statistics
- Verify all services are running correctly

### Weekly
- Apply security updates
- Review firewall logs
- Run rkhunter and aide checks
- Backup critical configurations

### Monthly
- Full system security audit
- Review user accounts and permissions
- Update and test disaster recovery procedures
- Review and update firewall rules

### Quarterly
- Penetration testing
- Review and update security policies
- Update incident response procedures
- Security training for all administrators

---

## Additional Resources
- [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [SANS Critical Security Controls](https://www.sans.org/critical-security-controls/)

---

## Contact for Security Incidents
- Internal: security@yourcompany.com
- ISP Abuse Team: (Check your provider's abuse contact)
- Local CERT: (Your regional CERT contact)

Remember: Security is not a one-time setup but an ongoing process. Regular updates, monitoring, and audits are essential to maintain a secure environment.
