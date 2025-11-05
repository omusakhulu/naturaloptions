# 🚀 Natural Options Admin Dashboard - Complete Deployment Package

Welcome! This package contains everything you need to deploy the Natural Options Admin Dashboard to a VPS.

---

## 📦 What's Included

This deployment package includes:

- ✅ Complete VPS setup automation
- ✅ Automated deployment scripts
- ✅ Comprehensive documentation
- ✅ Configuration templates
- ✅ Step-by-step guides
- ✅ Troubleshooting resources

---

## 🎯 Three Ways to Deploy

### Option 1: Automated Setup (Recommended) ⚡

**Best for:** Quick deployment with minimal manual work.

1. **Push to Git:**
   ```bash
   # Windows
   .\git-setup.ps1
   
   # Linux/Mac
   chmod +x git-setup.sh
   ./git-setup.sh
   ```

2. **Run on VPS:**
   ```bash
   wget https://raw.githubusercontent.com/YOUR_USERNAME/omnishop-admin/main/vps-setup.sh
   chmod +x vps-setup.sh
   ./vps-setup.sh
   ```

3. **Done!** Your app is live at `https://your-domain.com`

**Time:** ~15-20 minutes

---

### Option 2: Guided Manual Setup 📖

**Best for:** Learning the deployment process or customizing setup.

Follow the comprehensive guide: **[VPS_DEPLOYMENT_GUIDE.md](VPS_DEPLOYMENT_GUIDE.md)**

**Time:** ~30-45 minutes

---

### Option 3: Quick Reference 📋

**Best for:** Experienced users who need a quick reminder.

Use: **[DEPLOYMENT_QUICK_START.md](DEPLOYMENT_QUICK_START.md)**

**Time:** ~10-15 minutes

---

## 📚 Documentation Files

| File | Purpose | When to Use |
|------|---------|-------------|
| **VPS_DEPLOYMENT_GUIDE.md** | Complete step-by-step guide with explanations | First-time deployment |
| **DEPLOYMENT_QUICK_START.md** | Quick reference for commands | Fast deployment/updates |
| **DEPLOYMENT_README.md** | Overview of all files and scripts | Understanding the package |
| **DEPLOYMENT_CHECKLIST.md** | Item-by-item checklist | Tracking deployment progress |
| **README_DEPLOYMENT.md** | This file - Getting started | Starting point |

---

## 🛠️ Scripts & Tools

| Script | Location | Purpose |
|--------|----------|---------|
| **vps-setup.sh** | Run on VPS | Initial server setup (one-time) |
| **deploy.sh** | Run on VPS | Deploy updates (repeated) |
| **git-setup.ps1** | Run on Windows | Initialize and push to Git |
| **git-setup.sh** | Run on Linux/Mac | Initialize and push to Git |
| **ecosystem.config.js** | VPS | PM2 process manager config |
| **.env.production.template** | VPS | Environment variables template |

---

## ⚡ Quick Start (5 Steps)

### 1️⃣ Prepare Prerequisites

- [ ] VPS with Ubuntu 20.04+ (2GB RAM, 2 CPU minimum)
- [ ] Domain name pointing to VPS IP
- [ ] WooCommerce API credentials
- [ ] GitHub/GitLab account

### 2️⃣ Push Code to Git

```bash
# On your local machine
.\git-setup.ps1   # Windows
# OR
./git-setup.sh    # Linux/Mac
```

### 3️⃣ Setup VPS

```bash
# SSH into VPS
ssh root@YOUR_VPS_IP

# Download and run setup script
wget https://raw.githubusercontent.com/YOUR_USERNAME/omnishop-admin/main/vps-setup.sh
chmod +x vps-setup.sh
./vps-setup.sh
```

### 4️⃣ Configure SSL (Optional but Recommended)

The setup script will ask if you want to install SSL certificate. Say **Yes**.

### 5️⃣ Access Your Application

Visit: `https://your-domain.com`

---

## 🔄 Deploying Updates

After making code changes:

```bash
# 1. Push to git (local machine)
git add .
git commit -m "Your changes"
git push origin main

# 2. Deploy on VPS
ssh user@your-vps-ip
cd /var/www/omnishop-admin
./deploy.sh
```

The deploy script automatically:
- ✅ Backs up database
- ✅ Pulls latest code
- ✅ Installs dependencies
- ✅ Runs migrations
- ✅ Rebuilds application
- ✅ Restarts server
- ✅ Runs health check

---

## 📊 Essential Commands

### View Application Status
```bash
pm2 status
```

### View Logs
```bash
pm2 logs omnishop-admin
```

### Restart Application
```bash
pm2 restart omnishop-admin
```

### Database Backup
```bash
pg_dump -U omnishop_user -d omnishop > backup_$(date +%Y%m%d).sql
```

### View Nginx Logs
```bash
sudo tail -f /var/log/nginx/error.log
```

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Internet                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Domain (HTTPS)                         │
│                  your-domain.com:443                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Nginx (Reverse Proxy)                     │
│                       Port 80/443                           │
│  - SSL Termination                                          │
│  - Static File Caching                                      │
│  - Request Forwarding                                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     PM2 (Process Manager)                   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │       Next.js Application (Port 3000)                │  │
│  │                                                       │  │
│  │  - Admin Dashboard                                   │  │
│  │  - API Routes                                        │  │
│  │  - Server-side Rendering                            │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         ▼                               ▼
┌──────────────────┐          ┌──────────────────────┐
│   PostgreSQL     │          │  WooCommerce API     │
│   Database       │          │  (External)          │
│   Port 5432      │          │  omnishop.omni...    │
│                  │          │                      │
│  - Products      │          │  - Orders            │
│  - Orders        │          │  - Products          │
│  - Warehouses    │          │  - Customers         │
│  - Inventory     │          │                      │
│  - Invoices      │          │                      │
└──────────────────┘          └──────────────────────┘
```

---

## 🔒 Security Features

✅ **Firewall (UFW)**
- Only necessary ports open (22, 80, 443)
- Rate limiting configured

✅ **SSL/TLS**
- Let's Encrypt free SSL certificate
- Automatic renewal
- HTTPS enforced

✅ **Environment Variables**
- No credentials in code
- Secured .env file
- Production-specific settings

✅ **Database**
- Strong passwords
- Local-only access
- Regular backups

✅ **Application**
- PM2 process isolation
- Automatic restarts
- Log rotation

---

## 📈 Monitoring & Maintenance

### Daily
- Check application logs: `pm2 logs`
- Monitor disk space: `df -h`

### Weekly
- Review error logs
- Check backup creation
- Monitor resource usage: `htop`

### Monthly
- Update system packages: `sudo apt update && sudo apt upgrade`
- Review and clean old backups
- Test backup restoration
- Update dependencies: `npm outdated`

### Automated
- Database backups (daily at 2 AM)
- SSL certificate renewal (automatic)
- PM2 log rotation (automatic)

---

## 🆘 Troubleshooting

### Application Won't Start
```bash
# Check logs
pm2 logs omnishop-admin --lines 100

# Check environment
cat .env

# Check database
sudo systemctl status postgresql
```

### 502 Bad Gateway
```bash
# Is app running?
pm2 status

# Check Nginx
sudo nginx -t
sudo systemctl status nginx

# Check port
sudo netstat -tlnp | grep 3000
```

### Database Connection Failed
```bash
# Test connection
psql -U omnishop_user -d omnishop -h localhost

# Check PostgreSQL
sudo systemctl status postgresql

# Restart if needed
sudo systemctl restart postgresql
```

### Out of Disk Space
```bash
# Check space
df -h

# Clean old logs
pm2 flush
sudo journalctl --vacuum-time=7d

# Clean old backups
cd /var/backups/omnishop
ls -lt | tail -n +11 | awk '{print $9}' | xargs rm
```

---

## 🎯 Features Included

### WooCommerce Integration
- ✅ Products sync and management
- ✅ Orders processing
- ✅ Real-time status updates
- ✅ Webhook support

### Warehouse Management
- ✅ Multiple warehouses
- ✅ Inventory tracking
- ✅ Stock movements
- ✅ Location-based storage
- ✅ Reorder level alerts

### Order Processing
- ✅ Packing slip generation
- ✅ Automatic stock reduction
- ✅ Order status management
- ✅ Booth assignment
- ✅ Collection tracking

### Invoicing
- ✅ Automatic invoice generation
- ✅ PDF export
- ✅ Payment tracking
- ✅ Customer management

### Database
- ✅ PostgreSQL with Prisma ORM
- ✅ Automated migrations
- ✅ Backup and restore
- ✅ Full transaction support

---

## 📞 Getting Help

### Documentation
1. **VPS_DEPLOYMENT_GUIDE.md** - Comprehensive guide
2. **DEPLOYMENT_QUICK_START.md** - Quick reference
3. **DEPLOYMENT_CHECKLIST.md** - Track your progress

### Check Logs
```bash
# Application logs
pm2 logs omnishop-admin

# Nginx logs
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u nginx -n 50
```

### Common Issues
- Port already in use → Kill process or change port
- Database connection failed → Check credentials and PostgreSQL status
- Nginx 502 → Check if app is running with `pm2 status`
- SSL certificate issues → Run `sudo certbot renew`

---

## 🎓 Learning Resources

- **Next.js**: https://nextjs.org/docs
- **PM2**: https://pm2.keymetrics.io/docs
- **Nginx**: https://nginx.org/en/docs/
- **PostgreSQL**: https://www.postgresql.org/docs/
- **Prisma**: https://www.prisma.io/docs/

---

## 📝 Deployment Workflow

### First Deployment
```
Local Machine          VPS
─────────────          ───
git-setup.ps1    →    (creates remote repo)
                 →    vps-setup.sh
                      ├── Install software
                      ├── Clone repository
                      ├── Build application
                      ├── Configure Nginx
                      └── Start with PM2
```

### Regular Updates
```
Local Machine          VPS
─────────────          ───
Make changes
git commit & push →    deploy.sh
                      ├── Backup database
                      ├── Pull code
                      ├── Build
                      └── Restart
```

---

## ✅ Success Indicators

Your deployment is successful when:

- ✅ Application accessible via domain
- ✅ HTTPS working (green padlock)
- ✅ Products load from WooCommerce
- ✅ Orders display correctly
- ✅ Warehouse features functional
- ✅ No errors in browser console
- ✅ PM2 shows app as "online"
- ✅ Database operations working
- ✅ Backups creating successfully

---

## 🚀 Next Steps After Deployment

1. **Set Up Monitoring** (Optional)
   - PM2 Plus for advanced monitoring
   - Sentry for error tracking
   - Uptime monitoring service

2. **Configure Backups**
   - Verify automated backups working
   - Test restoration procedure
   - Set up off-site backup storage

3. **Performance Optimization**
   - Enable PM2 cluster mode
   - Configure Nginx caching
   - Optimize database queries

4. **User Management**
   - Create admin accounts
   - Set up authentication
   - Configure user roles

5. **Custom Domain**
   - Update NEXTAUTH_URL
   - Configure DNS
   - Install SSL certificate

---

## 📦 Package Contents Summary

```
omnishop-admin-dashboard/
├── 📚 Documentation
│   ├── README_DEPLOYMENT.md          ← You are here
│   ├── VPS_DEPLOYMENT_GUIDE.md       ← Comprehensive guide
│   ├── DEPLOYMENT_QUICK_START.md     ← Quick reference
│   ├── DEPLOYMENT_README.md          ← Files overview
│   └── DEPLOYMENT_CHECKLIST.md       ← Progress tracker
│
├── 🛠️ Setup Scripts
│   ├── vps-setup.sh                  ← Initial VPS setup
│   ├── deploy.sh                     ← Update deployment
│   ├── git-setup.ps1                 ← Git init (Windows)
│   └── git-setup.sh                  ← Git init (Linux/Mac)
│
├── ⚙️ Configuration
│   ├── ecosystem.config.js           ← PM2 configuration
│   ├── .env.production.template      ← Environment template
│   └── .gitignore                    ← Git ignore rules
│
└── 📁 Application
    ├── src/                          ← Source code
    ├── prisma/                       ← Database schema
    ├── package.json                  ← Dependencies
    └── next.config.mjs               ← Next.js config
```

---

## 🎉 You're Ready!

You now have everything needed to deploy your Natural Options Admin Dashboard to a VPS.

**Choose your deployment method:**
- ⚡ **Fast:** Run automated scripts (15 minutes)
- 📖 **Guided:** Follow step-by-step guide (30 minutes)
- 📋 **Reference:** Use quick start guide (10 minutes)

**Questions?** Check the troubleshooting sections in the guides.

**Good luck with your deployment!** 🚀

---

**Created:** October 29, 2025  
**Version:** 1.0.0  
**Project:** Natural Options Admin Dashboard
