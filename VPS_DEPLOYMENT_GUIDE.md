# VPS Deployment Guide - Natural Options Admin Dashboard

## Prerequisites

### On Your Local Machine
- [x] Git installed
- [x] GitHub/GitLab account
- [x] SSH access to VPS

### On Your VPS
- Ubuntu 20.04+ or similar Linux distribution
- Root or sudo access
- Minimum 2GB RAM, 2 CPU cores
- At least 20GB storage

---

## Part 1: Prepare Your Project for Git

### 1.1 Create/Update .gitignore

Ensure your `.gitignore` includes:
```
# Dependencies
node_modules/
woo-rental-bridge/node_modules/

# Environment variables
.env
.env.local
.env.production.local

# Build output
.next/
dist/
out/

# Logs
logs/
*.log
pnpm-debug.log*

# Database
*.dump
backups/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

### 1.2 Initialize Git Repository (if not already done)

```bash
git init
git add .
git commit -m "Initial commit - Natural Options Admin Dashboard"
```

### 1.3 Push to Remote Repository

**For GitHub:**
```bash
git remote add origin https://github.com/YOUR_USERNAME/omnishop-admin-dashboard.git
git branch -M main
git push -u origin main
```

**For GitLab:**
```bash
git remote add origin https://gitlab.com/YOUR_USERNAME/omnishop-admin-dashboard.git
git branch -M main
git push -u origin main
```

---

## Part 2: VPS Initial Setup

### 2.1 Connect to Your VPS

```bash
ssh root@YOUR_VPS_IP
# or
ssh YOUR_USERNAME@YOUR_VPS_IP
```

### 2.2 Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 2.3 Install Node.js (v18 LTS or higher)

```bash
# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should be v20.x
pnpm --version   # Should be v10.x
```

### 2.4 Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql <<EOF
CREATE DATABASE omnishop;
CREATE USER omnishop_user WITH PASSWORD 'YOUR_SECURE_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE omnishop TO omnishop_user;
\q
EOF
```

### 2.5 Install PM2 (Process Manager)

```bash
sudo pnpm install -g pm2
```

### 2.6 Install Nginx (Reverse Proxy)

```bash
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2.7 Install Git

```bash
sudo apt install -y git
```

---

## Part 3: Deploy Application

### 3.1 Create Application Directory

```bash
# Create directory for your application
sudo mkdir -p /var/www/omnishop-admin
sudo chown $USER:$USER /var/www/omnishop-admin
cd /var/www/omnishop-admin
```

### 3.2 Clone Repository

```bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/omnishop-admin-dashboard.git .

# Or with SSH (recommended for private repos)
git clone git@github.com:YOUR_USERNAME/omnishop-admin-dashboard.git .
```

### 3.3 Create Environment File

```bash
nano .env
```

Add the following (update with your values):
```env
# WooCommerce Configuration
WOO_STORE_URL=https://omnishop.omnispace3d.com
WOO_CONSUMER_KEY=your_actual_consumer_key
WOO_CONSUMER_SECRET=your_actual_consumer_secret

# Database Configuration
DATABASE_URL=postgresql://omnishop_user:YOUR_SECURE_PASSWORD@localhost:5432/omnishop?schema=public

# NextAuth Configuration
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=generate_a_secure_random_string_here

# Production
NODE_ENV=production
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 3.4 Install Dependencies

```bash
# Install main dependencies
pnpm install --production

# Build woo-rental-bridge
cd woo-rental-bridge
pnpm install
pnpm run build
cd ..
```

### 3.5 Setup Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy
```

### 3.6 Build Application

```bash
pnpm run build
```

### 3.7 Start with PM2

```bash
# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it outputs
```

---

## Part 4: Configure Nginx Reverse Proxy

### 4.1 Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/omnishop-admin
```

Add the following:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect to HTTPS (if you have SSL)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeout for large requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 60m;
    }

    # API routes
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4.2 Enable Site and Restart Nginx

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/omnishop-admin /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 4.3 Configure Firewall

```bash
# Allow SSH
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable
```

---

## Part 5: SSL Certificate (Optional but Recommended)

### 5.1 Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 5.2 Obtain SSL Certificate

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Follow the prompts. Certbot will automatically configure Nginx for HTTPS.

### 5.3 Test Auto-Renewal

```bash
sudo certbot renew --dry-run
```

---

## Part 6: Maintenance Commands

### View Application Logs
```bash
pm2 logs omnishop-admin
```

### Restart Application
```bash
pm2 restart omnishop-admin
```

### Stop Application
```bash
pm2 stop omnishop-admin
```

### Check Application Status
```bash
pm2 status
```

### Update Application (Pull Latest Changes)
```bash
cd /var/www/omnishop-admin
git pull origin main
pnpm install --production
pnpm run build
pm2 restart omnishop-admin
```

### Database Migrations
```bash
cd /var/www/omnishop-admin
npx prisma migrate deploy
pm2 restart omnishop-admin
```

### View Nginx Logs
```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

---

## Part 7: Monitoring & Health Checks

### Setup PM2 Monitoring
```bash
# Install PM2 monitoring (optional)
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Application Health Check
```bash
# Check if app is running
curl http://localhost:3000

# Check from outside
curl http://your-domain.com
```

---

## Troubleshooting

### Application Won't Start
1. Check logs: `pm2 logs omnishop-admin`
2. Check environment variables: `cat .env`
3. Verify database connection: `psql -U omnishop_user -d omnishop -h localhost`

### Database Connection Issues
1. Check PostgreSQL is running: `sudo systemctl status postgresql`
2. Verify credentials in `.env`
3. Check PostgreSQL logs: `sudo tail -f /var/log/postgresql/postgresql-*.log`

### Nginx 502 Bad Gateway
1. Check if app is running: `pm2 status`
2. Verify port 3000 is listening: `sudo netstat -tlnp | grep 3000`
3. Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`

### Port Already in Use
```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill process if needed
sudo kill -9 PID
```

---

## Security Checklist

- [ ] Changed default PostgreSQL password
- [ ] Generated strong NEXTAUTH_SECRET
- [ ] Configured firewall (UFW)
- [ ] Installed SSL certificate
- [ ] Updated all environment variables
- [ ] Disabled root SSH login (optional)
- [ ] Setup fail2ban (optional)
- [ ] Regular backups configured
- [ ] Keep system updated

---

## Backup Strategy

### Manual Database Backup
```bash
# Backup database
pg_dump -U omnishop_user -d omnishop > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
psql -U omnishop_user -d omnishop < backup_YYYYMMDD_HHMMSS.sql
```

### Automated Daily Backups
```bash
# Create backup script
sudo nano /usr/local/bin/backup-omnishop.sh
```

Add:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/omnishop"
mkdir -p $BACKUP_DIR
pg_dump -U omnishop_user -d omnishop > $BACKUP_DIR/omnishop_$(date +%Y%m%d_%H%M%S).sql
# Keep only last 7 days
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-omnishop.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-omnishop.sh
```

---

## Performance Optimization

### Enable Gzip in Nginx
Add to Nginx config:
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
```

### PM2 Cluster Mode (for multiple CPU cores)
```bash
pm2 start ecosystem.config.js --env production -i max
```

---

## Support & Resources

- **Next.js Docs**: https://nextjs.org/docs
- **PM2 Docs**: https://pm2.keymetrics.io/docs
- **Nginx Docs**: https://nginx.org/en/docs/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

---

**Created**: October 29, 2025
**Last Updated**: October 29, 2025
