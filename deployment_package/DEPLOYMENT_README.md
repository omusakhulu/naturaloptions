# 📦 Deployment Files Overview

This directory contains all necessary files and scripts for deploying the Natural Options Admin Dashboard to a VPS.

---

## 📚 Documentation Files

### 1. **DEPLOYMENT_QUICK_START.md** ⚡
Quick reference guide for fast deployment. Perfect for those who need a quick reminder of commands and steps.

**Use when:** You've deployed before and need a quick reference.

### 2. **VPS_DEPLOYMENT_GUIDE.md** 📖
Comprehensive, step-by-step deployment guide with detailed explanations, troubleshooting, and best practices.

**Use when:** First-time deployment or when you need detailed instructions.

---

## 🛠️ Deployment Scripts

### 3. **vps-setup.sh** 🚀
**Location:** Run on VPS  
**Purpose:** Initial VPS setup - installs all required software and configures the server

**What it does:**
- Installs Node.js 20 LTS
- Installs PostgreSQL database
- Installs PM2 process manager
- Installs Nginx web server
- Creates database and user
- Clones your repository
- Builds the application
- Configures Nginx reverse proxy
- Optionally installs SSL certificate
- Starts the application with PM2

**Usage:**
```bash
# On your VPS
wget https://raw.githubusercontent.com/YOUR_USERNAME/omnishop-admin/main/vps-setup.sh
chmod +x vps-setup.sh
./vps-setup.sh
```

**When to use:** First time setting up the VPS only.

---

### 4. **deploy.sh** 🔄
**Location:** Run on VPS (after initial setup)  
**Purpose:** Deploy code updates and restart application

**What it does:**
- Backs up database before deployment
- Pulls latest code from git
- Installs new dependencies
- Runs database migrations
- Rebuilds application
- Restarts PM2 process
- Runs health check
- Cleans up old backups

**Usage:**
```bash
# On your VPS
cd /var/www/omnishop-admin
./deploy.sh
```

**When to use:** Every time you want to deploy code updates.

---

### 5. **git-setup.ps1** 📤 (Windows)
**Location:** Run on local Windows machine  
**Purpose:** Initialize git repository and push to remote

**What it does:**
- Checks if git is installed
- Initializes git repository
- Adds and commits all files
- Adds remote origin
- Pushes to GitHub/GitLab

**Usage:**
```powershell
# On Windows PowerShell
.\git-setup.ps1
```

---

### 6. **git-setup.sh** 📤 (Linux/Mac/WSL)
**Location:** Run on local Linux/Mac/WSL machine  
**Purpose:** Initialize git repository and push to remote (same as above but for Unix systems)

**Usage:**
```bash
# On Linux/Mac/WSL
chmod +x git-setup.sh
./git-setup.sh
```

---

## ⚙️ Configuration Files

### 7. **ecosystem.config.js** ⚡
**Location:** VPS  
**Purpose:** PM2 process manager configuration

**What it configures:**
- Application name and script path
- Number of instances (1 or cluster mode)
- Memory limits and restart policies
- Environment variables
- Log file locations
- Startup behavior

**You can customize:**
- `instances`: Set to `'max'` for cluster mode (multi-core)
- `exec_mode`: Set to `'cluster'` for load balancing
- `max_memory_restart`: Adjust memory limits
- `PORT`: Change application port if needed

---

### 8. **.env.production.template** 🔐
**Location:** Template to copy to VPS  
**Purpose:** Template for production environment variables

**Important variables to configure:**
- `WOO_STORE_URL` - Your WooCommerce store URL
- `WOO_CONSUMER_KEY` - WooCommerce API key
- `WOO_CONSUMER_SECRET` - WooCommerce API secret
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Your production domain
- `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
- `NODE_ENV` - Must be `production`

---

## 📋 Complete Deployment Workflow

### First-Time Deployment

```
┌─────────────────────────────────────────┐
│ 1. LOCAL: Push to Git                  │
│    Run: git-setup.ps1 or git-setup.sh   │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ 2. VPS: Initial Setup                  │
│    Run: vps-setup.sh                    │
│    - Installs all software              │
│    - Creates database                   │
│    - Clones repository                  │
│    - Builds application                 │
│    - Starts with PM2                    │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ 3. BROWSER: Access Application         │
│    Visit: https://your-domain.com       │
└─────────────────────────────────────────┘
```

### Deploying Updates

```
┌─────────────────────────────────────────┐
│ 1. LOCAL: Make Changes                 │
│    git add .                            │
│    git commit -m "description"          │
│    git push origin main                 │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ 2. VPS: Deploy Updates                 │
│    cd /var/www/omnishop-admin           │
│    ./deploy.sh                          │
│    - Backs up database                  │
│    - Pulls code                         │
│    - Builds                             │
│    - Restarts                           │
└─────────────────────────────────────────┘
```

---

## 🎯 Quick Commands Reference

### On Local Machine

```bash
# Push code updates
git add .
git commit -m "Update message"
git push origin main
```

### On VPS

```bash
# Deploy updates
cd /var/www/omnishop-admin
./deploy.sh

# View logs
pm2 logs omnishop-admin

# Restart app
pm2 restart omnishop-admin

# Check status
pm2 status

# Manual deployment
git pull origin main
npm install --production
npm run build
pm2 restart omnishop-admin

# Database backup
pg_dump -U omnishop_user -d omnishop > backup.sql

# View Nginx logs
sudo tail -f /var/log/nginx/error.log
```

---

## 🔒 Security Best Practices

1. **Environment Variables**
   - Never commit `.env` files to git
   - Use strong passwords
   - Generate secure `NEXTAUTH_SECRET`

2. **Database**
   - Use strong database passwords
   - Restrict database access to localhost
   - Regular backups

3. **Firewall**
   - Only allow necessary ports (80, 443, 22)
   - Use UFW to manage firewall rules

4. **SSL Certificate**
   - Always use HTTPS in production
   - Use Let's Encrypt for free SSL

5. **Updates**
   - Keep system packages updated
   - Update Node.js and dependencies regularly

6. **Backups**
   - Automated daily database backups
   - Store backups off-server

---

## 📊 File Locations on VPS

```
/var/www/omnishop-admin/          # Application root
├── .env                          # Environment variables (create manually)
├── package.json                  # Dependencies
├── ecosystem.config.js           # PM2 config (from repo)
├── deploy.sh                     # Deploy script (from repo)
├── src/                          # Source code
├── prisma/                       # Database schema
└── logs/                         # PM2 logs

/etc/nginx/sites-available/       # Nginx configurations
└── omnishop-admin                # Your site config

/var/backups/omnishop/            # Database backups
└── *.sql

/var/log/nginx/                   # Nginx logs
├── access.log
└── error.log
```

---

## 🆘 Troubleshooting

### Application won't start
1. Check logs: `pm2 logs omnishop-admin --lines 100`
2. Check .env file exists and is valid
3. Check database connection
4. Check port 3000 is not in use

### Database connection failed
1. Check PostgreSQL is running: `sudo systemctl status postgresql`
2. Verify DATABASE_URL in .env
3. Test connection: `psql -U omnishop_user -d omnishop`

### Nginx 502 Bad Gateway
1. Check app is running: `pm2 status`
2. Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify port 3000 is listening: `sudo netstat -tlnp | grep 3000`

### Port already in use
```bash
sudo lsof -i :3000        # Find process
sudo kill -9 <PID>        # Kill process
pm2 restart omnishop-admin
```

### SSL certificate issues
```bash
sudo certbot renew       # Renew certificate
sudo systemctl restart nginx
```

---

## 📖 Additional Resources

- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **PM2 Documentation**: https://pm2.keymetrics.io/docs
- **Nginx Documentation**: https://nginx.org/en/docs/
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **Let's Encrypt**: https://letsencrypt.org/getting-started/

---

## 📝 Notes

- All shell scripts are executable with `chmod +x script-name.sh`
- Always backup database before major updates
- Test deployments in staging environment if available
- Monitor application logs regularly
- Set up automated backups immediately after deployment

---

**Need help?** Check the detailed guides:
- Quick reference: `DEPLOYMENT_QUICK_START.md`
- Full guide: `VPS_DEPLOYMENT_GUIDE.md`

---

**Last Updated:** October 29, 2025
