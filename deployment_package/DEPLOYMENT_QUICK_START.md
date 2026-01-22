# 🚀 Quick Deployment Guide

This is a quick reference for deploying the Natural Options Admin Dashboard to a VPS. For detailed instructions, see `VPS_DEPLOYMENT_GUIDE.md`.

---

## 📋 Prerequisites Checklist

- [ ] VPS with Ubuntu 20.04+ (minimum 2GB RAM, 2 CPU cores)
- [ ] Domain name pointed to VPS IP address
- [ ] GitHub/GitLab account
- [ ] WooCommerce store credentials
- [ ] SSH access to VPS

---

## 🎯 Quick Start (3 Steps)

### Step 1: Push to Git Repository

```bash
# On your local machine
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/omnishop-admin.git
git push -u origin main
```

### Step 2: Run Setup Script on VPS

```bash
# SSH into your VPS
ssh root@YOUR_VPS_IP

# Download and run setup script
wget https://raw.githubusercontent.com/YOUR_USERNAME/omnishop-admin/main/vps-setup.sh
chmod +x vps-setup.sh
./vps-setup.sh
```

The script will:
- ✅ Install Node.js, PostgreSQL, PM2, Nginx
- ✅ Create database
- ✅ Clone repository
- ✅ Build application
- ✅ Configure Nginx
- ✅ Start application
- ✅ (Optional) Install SSL certificate

### Step 3: Access Your Application

Visit `http://your-domain.com` (or `https://` if SSL was installed)

---

## 🔄 Deploy Updates

After making changes and pushing to git:

```bash
# On VPS
cd /var/www/omnishop-admin
./deploy.sh
```

This will:
1. Backup database
2. Pull latest code
3. Install dependencies
4. Run migrations
5. Build application
6. Restart PM2
7. Health check

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

### Manual Deployment
```bash
cd /var/www/omnishop-admin
git pull origin main
npm install --production
npm run build
pm2 restart omnishop-admin
```

### Database Backup
```bash
pg_dump -U omnishop_user -d omnishop > backup.sql
```

### Database Restore
```bash
psql -U omnishop_user -d omnishop < backup.sql
```

---

## 🔧 Common Issues

### Port 3000 Already in Use
```bash
sudo lsof -i :3000
sudo kill -9 <PID>
pm2 restart omnishop-admin
```

### Application Won't Start
```bash
pm2 logs omnishop-admin --lines 100
```

### Database Connection Failed
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -U omnishop_user -d omnishop -h localhost
```

### Nginx 502 Bad Gateway
```bash
# Check if app is running
pm2 status

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

---

## 🔒 Security Checklist

After deployment:

- [ ] Change default database password
- [ ] Generate secure NEXTAUTH_SECRET
- [ ] Configure firewall (UFW)
- [ ] Install SSL certificate (Let's Encrypt)
- [ ] Set up automated backups
- [ ] Update all .env variables
- [ ] Test application thoroughly

---

## 📝 Environment Variables

Create `.env` file on VPS with:

```env
# WooCommerce
WOO_STORE_URL=https://your-store.com
WOO_CONSUMER_KEY=ck_xxxxx
WOO_CONSUMER_SECRET=cs_xxxxx

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/omnishop?schema=public

# NextAuth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=generate_with_openssl_rand_-base64_32

# Production
NODE_ENV=production
```

---

## 📚 File Structure on VPS

```
/var/www/omnishop-admin/        # Application root
├── .env                         # Environment variables
├── package.json                 # Dependencies
├── ecosystem.config.js          # PM2 configuration
├── deploy.sh                    # Deployment script
├── src/                         # Source code
├── prisma/                      # Database schema
└── logs/                        # Application logs

/etc/nginx/sites-available/      # Nginx config
└── omnishop-admin

/var/backups/omnishop/           # Database backups
└── *.sql
```

---

## 🆘 Getting Help

1. Check logs: `pm2 logs omnishop-admin`
2. Check VPS_DEPLOYMENT_GUIDE.md for detailed instructions
3. Verify environment variables: `cat .env`
4. Check system resources: `htop` or `free -h`

---

## 📱 Monitoring

### Setup PM2 Web Dashboard (Optional)
```bash
pm2 web
# Access at http://your-vps-ip:9615
```

### PM2 Log Rotation
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## 🔄 Automated Backups

Create backup cron job:

```bash
sudo crontab -e
```

Add:
```bash
# Daily backup at 2 AM
0 2 * * * /usr/local/bin/backup-omnishop.sh
```

Create backup script:
```bash
sudo nano /usr/local/bin/backup-omnishop.sh
```

Add:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/omnishop"
mkdir -p $BACKUP_DIR
pg_dump -U omnishop_user -d omnishop > $BACKUP_DIR/omnishop_$(date +%Y%m%d_%H%M%S).sql
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
```

Make executable:
```bash
sudo chmod +x /usr/local/bin/backup-omnishop.sh
```

---

**Need detailed instructions?** See `VPS_DEPLOYMENT_GUIDE.md`

**Questions?** Check the troubleshooting section or application logs.

---

Last Updated: October 29, 2025
