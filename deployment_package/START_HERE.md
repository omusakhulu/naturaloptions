# 🚀 START HERE - VPS Deployment Guide

Welcome! This guide will help you deploy your Natural Options Admin Dashboard to a VPS in just a few steps.

---

## 📦 What You Have

I've created a complete deployment package with everything you need:

### 📚 Documentation
1. **START_HERE.md** (this file) - Your starting point
2. **DEPLOYMENT_QUICK_START.md** - Quick reference for experienced users
3. **VPS_DEPLOYMENT_GUIDE.md** - Comprehensive step-by-step guide
4. **DEPLOYMENT_README.md** - Overview of all deployment files
5. **DEPLOYMENT_CHECKLIST.md** - Complete checklist to track progress

### 🛠️ Scripts
6. **git-setup.ps1** - Windows PowerShell script to push to Git
7. **git-setup.sh** - Linux/Mac/WSL script to push to Git  
8. **vps-setup.sh** - Automated VPS initial setup (run on VPS)
9. **deploy.sh** - Deploy updates script (run on VPS)

### ⚙️ Configuration
10. **ecosystem.config.js** - PM2 process manager configuration
11. **.env.production.template** - Production environment variables template

---

## 🎯 Quick Start (3 Simple Steps)

### Step 1️⃣: Push Your Code to Git (5 minutes)

**On Windows:**
```powershell
cd c:\Users\Joe\omnishop-admin-dashboard
.\git-setup.ps1
```

**On Linux/Mac/WSL:**
```bash
cd ~/omnishop-admin-dashboard
chmod +x git-setup.sh
./git-setup.sh
```

**What this does:**
- Initializes git repository
- Commits all files
- Pushes to GitHub/GitLab

**You'll need:**
- GitHub or GitLab account
- Repository URL (create at github.com/new)

---

### Step 2️⃣: Setup Your VPS (15-20 minutes)

**Connect to your VPS:**
```bash
ssh root@YOUR_VPS_IP
```

**Run the automated setup:**
```bash
# Download the setup script from your repository
wget https://raw.githubusercontent.com/YOUR_USERNAME/omnishop-admin-dashboard/main/vps-setup.sh

# Make it executable
chmod +x vps-setup.sh

# Run it
./vps-setup.sh
```

**The script will ask you for:**
- Database name (default: omnishop)
- Database username (default: omnishop_user)
- Database password (you create this)
- Your Git repository URL
- WooCommerce store URL
- WooCommerce API keys
- Your domain name

**What this does automatically:**
- ✅ Installs Node.js, PostgreSQL, PM2, Nginx, Git
- ✅ Creates and configures database
- ✅ Clones your repository
- ✅ Installs dependencies
- ✅ Builds application
- ✅ Configures Nginx
- ✅ Starts application with PM2
- ✅ (Optional) Installs SSL certificate

---

### Step 3️⃣: Access Your Application

Once setup completes, visit:
- **HTTP:** `http://your-domain.com`
- **HTTPS:** `https://your-domain.com` (if SSL was installed)

---

## 🔄 Deploying Updates (After Initial Setup)

When you make changes to your code:

### On Your Local Machine:
```bash
git add .
git commit -m "Describe your changes"
git push origin main
```

### On Your VPS:
```bash
cd /var/www/omnishop-admin
./deploy.sh
```

That's it! The deploy script automatically:
1. Backs up database
2. Pulls latest code
3. Installs dependencies
4. Runs migrations
5. Builds application
6. Restarts PM2
7. Verifies health

---

## 📋 Prerequisites

Before you begin, make sure you have:

### VPS Requirements
- [ ] Ubuntu 20.04+ or similar Linux distribution
- [ ] Minimum 2GB RAM, 2 CPU cores
- [ ] At least 20GB storage
- [ ] Root or sudo access
- [ ] SSH access

### Domain & DNS
- [ ] Domain name registered
- [ ] DNS A record pointing to VPS IP
- [ ] DNS propagated (test with: `dig your-domain.com`)

### Accounts & Credentials
- [ ] GitHub or GitLab account
- [ ] WooCommerce store with REST API enabled
- [ ] WooCommerce Consumer Key and Secret

---

## 🗺️ Deployment Roadmap

```
┌─────────────────────────────────────────────────┐
│         1. LOCAL: Push to Git                  │
│         ↓ (git-setup.ps1 or .sh)               │
│                                                 │
│         2. VPS: Run vps-setup.sh               │
│         ↓ (Automated installation)              │
│                                                 │
│         3. BROWSER: Test Application           │
│         ↓ (https://your-domain.com)            │
│                                                 │
│         4. FUTURE: Deploy Updates              │
│         ↓ (deploy.sh)                           │
│                                                 │
│         ✅ Production Ready!                    │
└─────────────────────────────────────────────────┘
```

---

## 📖 Which Documentation Should I Read?

### If you're... Read this...

**🏃 In a hurry and know what you're doing**
→ `DEPLOYMENT_QUICK_START.md`

**📚 Deploying for the first time**
→ `VPS_DEPLOYMENT_GUIDE.md` (comprehensive guide)

**📝 Want to track your progress**
→ `DEPLOYMENT_CHECKLIST.md` (checkbox format)

**🤔 Confused about the files**
→ `DEPLOYMENT_README.md` (explains each file)

**🚨 Having issues**
→ `VPS_DEPLOYMENT_GUIDE.md` (has troubleshooting section)

---

## 🎓 Understanding the Files

### Scripts You Run Locally (on your computer)
- `git-setup.ps1` (Windows)
- `git-setup.sh` (Linux/Mac)

### Scripts You Run on VPS (on your server)
- `vps-setup.sh` (run once for initial setup)
- `deploy.sh` (run every time you deploy updates)

### Configuration Files (automatically used)
- `ecosystem.config.js` (tells PM2 how to run your app)
- `.env.production.template` (template for environment variables)

### Documentation (for you to read)
- All the `.md` files

---

## ⚡ Essential Commands

### On VPS - Application Management
```bash
pm2 status                    # Check app status
pm2 logs omnishop-admin       # View logs
pm2 restart omnishop-admin    # Restart app
pm2 stop omnishop-admin       # Stop app
pm2 start omnishop-admin      # Start app
```

### On VPS - System Management
```bash
sudo systemctl status nginx   # Check Nginx
sudo systemctl restart nginx  # Restart Nginx
sudo nginx -t                 # Test Nginx config
sudo ufw status               # Check firewall
```

### On VPS - Database Management
```bash
# Backup database
pg_dump -U omnishop_user -d omnishop > backup.sql

# Restore database
psql -U omnishop_user -d omnishop < backup.sql

# Connect to database
psql -U omnishop_user -d omnishop
```

---

## 🔒 Security Reminders

1. **Never commit `.env` file to git** - It contains secrets
2. **Use strong passwords** - For database and other services
3. **Generate unique NEXTAUTH_SECRET** - Run: `openssl rand -base64 32`
4. **Install SSL certificate** - Always use HTTPS in production
5. **Enable firewall** - Only allow necessary ports
6. **Setup automated backups** - Don't lose your data

---

## 🆘 Need Help?

### Common Issues

**"Permission denied" errors**
```bash
chmod +x script-name.sh
```

**Port 3000 already in use**
```bash
sudo lsof -i :3000
sudo kill -9 <PID>
```

**Application won't start**
```bash
pm2 logs omnishop-admin --lines 50
```

**Nginx 502 Bad Gateway**
```bash
pm2 status                              # Check if app is running
sudo tail -f /var/log/nginx/error.log  # Check Nginx logs
```

### Get More Help
- Check the troubleshooting section in `VPS_DEPLOYMENT_GUIDE.md`
- Review logs: `pm2 logs omnishop-admin`
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`

---

## ✅ Success Checklist

Once deployed, verify:

- [ ] Application accessible at your domain
- [ ] HTTPS working (if SSL installed)
- [ ] WooCommerce products loading
- [ ] Orders syncing from WooCommerce
- [ ] Warehouse features working
- [ ] Database operations working
- [ ] No errors in browser console
- [ ] PM2 shows app running: `pm2 status`

---

## 🎉 Next Steps After Deployment

1. **Monitor your application**
   - Check logs regularly: `pm2 logs omnishop-admin`
   - Monitor resource usage: `htop` or `free -h`

2. **Setup automated backups**
   - Follow backup section in `VPS_DEPLOYMENT_GUIDE.md`
   - Test backup restoration

3. **Configure monitoring** (optional)
   - Setup PM2 monitoring dashboard
   - Configure error alerts

4. **Document your setup**
   - Save your environment variables securely
   - Document any custom configurations
   - Keep track of deployments

5. **Plan for scaling** (if needed)
   - Consider cluster mode in `ecosystem.config.js`
   - Plan for load balancing
   - Consider CDN for static assets

---

## 📞 Support Resources

- **Next.js Docs**: https://nextjs.org/docs/deployment
- **PM2 Docs**: https://pm2.keymetrics.io/docs
- **Nginx Docs**: https://nginx.org/en/docs/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Let's Encrypt**: https://letsencrypt.org/

---

## 🚀 Ready to Deploy?

1. ✅ Read through this document
2. ✅ Ensure you have all prerequisites
3. ✅ Follow the 3-step Quick Start above
4. ✅ Use the checklist in `DEPLOYMENT_CHECKLIST.md`
5. ✅ Refer to detailed guides as needed

**Good luck with your deployment! 🎉**

---

**Created:** October 29, 2025  
**Version:** 1.0.0  
**For:** Natural Options Admin Dashboard
