# Fix Blank Login Page - Manual Instructions

## Issue
The login page at http://212.86.104.9/admin/en/pages/auth/login-v2 is showing blank.

## SSH Connection Issues
The server appears to be blocking SSH connections. This could be due to:
1. Firewall rules blocking your IP
2. fail2ban blocking due to multiple login attempts
3. SSH service issues

## Alternative Access Methods

### Option 1: Console Access (Recommended)
If you have access to your VPS provider's console:

1. Log into your VPS provider's control panel
2. Access the server console/terminal
3. Run these commands:

```bash
# Check if firewall is blocking
ufw status
ufw allow from any to any port 22

# Check fail2ban
fail2ban-client status sshd
fail2ban-client unban --all

# Restart SSH
systemctl restart ssh
```

### Option 2: Fix via Console

Once you have console access, run these commands to fix the blank page:

```bash
cd /var/www/naturaloptions

# 1. Check if the build exists
ls -la .next/

# 2. If .next is missing or empty, rebuild:
NODE_OPTIONS="--max-old-space-size=2048" npm run build

# 3. Check PM2 logs for errors
pm2 logs --lines 100

# 4. Restart the application
pm2 restart all

# 5. Check if it's responding
curl -I http://localhost:3000
```

## Common Causes of Blank Page

### 1. Missing Build Files
The `.next` directory might be missing or corrupted.

**Fix:**
```bash
cd /var/www/naturaloptions
npm run build
pm2 restart all
```

### 2. Environment Variables Issue
NextAuth requires proper environment variables.

**Fix:**
```bash
cd /var/www/naturaloptions
nano .env
```

Ensure these are set:
```
NEXTAUTH_URL=http://212.86.104.9
NEXTAUTH_SECRET=any-long-random-string-here-at-least-32-chars
AUTH_URL=http://212.86.104.9
AUTH_TRUST_HOST=true
```

### 3. Database Connection Issue
Check PostgreSQL is running:

```bash
systemctl status postgresql
sudo -u postgres psql -c "SELECT 1;"
```

### 4. Static Files Not Being Served
Check Nginx is serving static files:

```bash
ls -la /var/www/naturaloptions/.next/static/
curl http://localhost:3000/_next/static/chunks/main.js
```

## Quick Diagnostic Commands

Run these to identify the issue:

```bash
# Check if app is running
pm2 status

# Check for JavaScript errors
pm2 logs --err --lines 50

# Check Nginx errors
tail -50 /var/log/nginx/error.log

# Test local response
curl -v http://localhost:3000/admin/en/pages/auth/login-v2

# Check disk space
df -h

# Check memory
free -m
```

## Complete Fix Script

Save this as `fix.sh` and run on the server:

```bash
#!/bin/bash
cd /var/www/naturaloptions

# Rebuild if needed
if [ ! -d ".next" ] || [ -z "$(ls -A .next)" ]; then
    echo "Rebuilding application..."
    NODE_OPTIONS="--max-old-space-size=2048" npm run build
fi

# Fix permissions
chmod -R 755 .next
chmod -R 755 public

# Restart everything
pm2 restart all
systemctl restart nginx

# Show status
pm2 logs --lines 20
```

## If Nothing Works

1. **Check browser console** (F12) for JavaScript errors
2. **Try different browser** or incognito mode
3. **Check network tab** for failed resource loads
4. **Verify DNS** if using domain name

## Server Access Recovery

If SSH is completely blocked:

1. Contact VPS provider for console access
2. Or request them to:
   - Disable firewall temporarily
   - Clear fail2ban blocks
   - Restart SSH service

## Expected Working State

When fixed, you should see:
- Login form with email/password fields
- Natural Options branding
- Proper styling and layout
- No console errors in browser
