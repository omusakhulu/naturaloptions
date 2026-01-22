# ✅ Deployment Checklist

Use this checklist to ensure you complete all steps for a successful deployment.

---

## 📋 Pre-Deployment Checklist

### Local Environment
- [ ] Application runs successfully locally (`npm run dev`)
- [ ] All tests pass (if applicable)
- [ ] Environment variables documented in `.env.example`
- [ ] Database migrations tested locally
- [ ] No sensitive data in code (API keys, passwords, etc.)
- [ ] `.gitignore` configured correctly
- [ ] Git repository initialized

### VPS Requirements
- [ ] VPS purchased/provisioned (minimum 2GB RAM, 2 CPU)
- [ ] VPS operating system: Ubuntu 20.04+ or similar
- [ ] Root or sudo access obtained
- [ ] VPS IP address noted
- [ ] SSH access tested

### Domain & DNS
- [ ] Domain name purchased
- [ ] A record pointing to VPS IP address
- [ ] DNS propagation confirmed (use `dig your-domain.com`)
- [ ] Subdomain configured (if using subdomain)

### WooCommerce Setup
- [ ] WooCommerce REST API enabled
- [ ] Consumer Key generated
- [ ] Consumer Secret generated
- [ ] API permissions set to Read/Write
- [ ] Test API connection from local machine

---

## 🚀 Deployment Steps

### Step 1: Push to Git Repository
- [ ] Code committed to git (`git add . && git commit -m "message"`)
- [ ] Remote repository created (GitHub/GitLab)
- [ ] Remote added to local repo
- [ ] Code pushed to remote (`git push origin main`)
- [ ] Repository accessible from browser

**Script to use:** `git-setup.ps1` (Windows) or `git-setup.sh` (Linux/Mac)

---

### Step 2: VPS Initial Setup
- [ ] SSH into VPS (`ssh root@YOUR_VPS_IP`)
- [ ] Download vps-setup.sh script
- [ ] Make script executable (`chmod +x vps-setup.sh`)
- [ ] Run setup script (`./vps-setup.sh`)
- [ ] Note database credentials created
- [ ] Verify Node.js installed (`node --version`)
- [ ] Verify PostgreSQL installed (`psql --version`)
- [ ] Verify PM2 installed (`pm2 --version`)
- [ ] Verify Nginx installed (`nginx -v`)

**Script to use:** `vps-setup.sh`

---

### Step 3: Application Configuration
- [ ] `.env` file created on VPS
- [ ] WooCommerce credentials added to `.env`
- [ ] Database URL configured in `.env`
- [ ] NEXTAUTH_URL set to production domain
- [ ] NEXTAUTH_SECRET generated and added
- [ ] NODE_ENV set to "production"
- [ ] Environment variables validated

**Template:** `.env.production.template`

---

### Step 4: Database Setup
- [ ] PostgreSQL service running
- [ ] Database created
- [ ] Database user created with password
- [ ] Connection tested from application
- [ ] Prisma client generated
- [ ] Migrations run successfully
- [ ] Initial database backup created

---

### Step 5: Application Build & Start
- [ ] Dependencies installed
- [ ] woo-rental-bridge built successfully
- [ ] Application built (`npm run build`)
- [ ] PM2 started application
- [ ] Application running on port 3000
- [ ] PM2 configured for auto-restart
- [ ] PM2 startup configured for system reboot

---

### Step 6: Nginx Configuration
- [ ] Nginx config file created
- [ ] Config file symlinked to sites-enabled
- [ ] Nginx config tested (`sudo nginx -t`)
- [ ] Nginx restarted
- [ ] Port 80 accessible
- [ ] Reverse proxy working
- [ ] Static files serving correctly

---

### Step 7: SSL Certificate (Recommended)
- [ ] Certbot installed
- [ ] SSL certificate obtained
- [ ] Nginx configured for HTTPS
- [ ] HTTP to HTTPS redirect working
- [ ] Certificate auto-renewal configured
- [ ] Port 443 accessible

---

### Step 8: Firewall Configuration
- [ ] UFW firewall enabled
- [ ] SSH port allowed (22)
- [ ] HTTP port allowed (80)
- [ ] HTTPS port allowed (443)
- [ ] Firewall status verified (`sudo ufw status`)

---

### Step 9: Testing & Verification
- [ ] Application accessible via domain
- [ ] HTTPS working (if SSL configured)
- [ ] WooCommerce API connection working
- [ ] Products fetch successfully
- [ ] Orders fetch successfully
- [ ] Database operations working
- [ ] Warehouse features working
- [ ] Invoice generation working
- [ ] Packing slips working
- [ ] All pages load without errors
- [ ] No console errors in browser

---

### Step 10: Monitoring & Backups
- [ ] PM2 logs configured
- [ ] PM2 log rotation enabled
- [ ] Database backup script created
- [ ] Automated backups scheduled (cron)
- [ ] Backup restore tested
- [ ] Application health check working
- [ ] Error monitoring set up (optional)

---

## 🔒 Security Checklist

### Application Security
- [ ] All environment variables secured
- [ ] No hardcoded credentials in code
- [ ] NEXTAUTH_SECRET is strong and unique
- [ ] Database password is strong
- [ ] Sessions configured with secure settings
- [ ] CORS configured properly

### Server Security
- [ ] Root login disabled (optional but recommended)
- [ ] SSH key authentication enabled
- [ ] Password authentication disabled (optional)
- [ ] Fail2ban installed (optional)
- [ ] Automatic security updates enabled
- [ ] Regular backups scheduled
- [ ] Firewall properly configured
- [ ] Unnecessary ports closed

### SSL/TLS
- [ ] SSL certificate installed
- [ ] Certificate auto-renewal working
- [ ] TLS 1.2+ enforced
- [ ] HTTP to HTTPS redirect working
- [ ] Security headers configured

---

## 📊 Post-Deployment Checklist

### Immediate (Within 24 Hours)
- [ ] Monitor application logs for errors
- [ ] Test all critical features
- [ ] Verify backup creation
- [ ] Check PM2 status
- [ ] Monitor resource usage (CPU, RAM, disk)
- [ ] Test SSL certificate

### First Week
- [ ] Monitor application performance
- [ ] Check for memory leaks
- [ ] Review error logs daily
- [ ] Test backup restoration
- [ ] Verify webhook functionality
- [ ] Check database performance

### Ongoing Maintenance
- [ ] Weekly log reviews
- [ ] Monthly security updates
- [ ] Regular database optimizations
- [ ] Monitor disk space usage
- [ ] Review and rotate logs
- [ ] Update dependencies regularly
- [ ] Test disaster recovery plan

---

## 🆘 Emergency Contacts & Resources

### Important File Locations
```
Application: /var/www/omnishop-admin
Logs: /var/www/omnishop-admin/logs
Nginx Config: /etc/nginx/sites-available/omnishop-admin
Nginx Logs: /var/log/nginx/
Backups: /var/backups/omnishop/
```

### Important Commands
```bash
# Application
pm2 status
pm2 logs omnishop-admin
pm2 restart omnishop-admin

# Nginx
sudo nginx -t
sudo systemctl restart nginx
sudo tail -f /var/log/nginx/error.log

# Database
psql -U omnishop_user -d omnishop
pg_dump -U omnishop_user -d omnishop > backup.sql

# Deployment
cd /var/www/omnishop-admin
./deploy.sh
```

### Rollback Procedure
If deployment fails:
1. Check logs: `pm2 logs omnishop-admin`
2. Restore database: `psql -U omnishop_user -d omnishop < /var/backups/omnishop/latest.sql`
3. Revert code: `git reset --hard HEAD~1`
4. Rebuild: `npm run build`
5. Restart: `pm2 restart omnishop-admin`

---

## 📝 Deployment Log

Keep track of your deployments:

| Date | Version | Changes | Status | Notes |
|------|---------|---------|--------|-------|
| YYYY-MM-DD | v1.0.0 | Initial deployment | ✅ Success | |
| YYYY-MM-DD | v1.0.1 | Bug fixes | ✅ Success | |
| | | | | |

---

## ✅ Deployment Complete!

Once all items are checked:
- [ ] Document any issues encountered and solutions
- [ ] Update team on deployment status
- [ ] Schedule follow-up monitoring
- [ ] Plan next deployment cycle
- [ ] Celebrate! 🎉

---

**Keep this checklist for reference during future deployments.**

Last Updated: October 29, 2025
