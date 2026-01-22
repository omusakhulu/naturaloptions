#!/bin/bash

# Omnishop Admin Dashboard - Initial VPS Setup Script
# Run this script on a fresh VPS to set up the environment

set -e

echo "🚀 Omnishop Admin Dashboard - VPS Initial Setup"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if running as root
if [[ $EUID -ne 0 ]] && ! groups | grep -q sudo; then
   echo -e "${RED}❌ This script must be run with sudo privileges${NC}"
   exit 1
fi

# Step 1: Update System
echo -e "${YELLOW}📦 Updating system...${NC}"
sudo apt update && sudo apt upgrade -y
echo -e "${GREEN}✅ System updated${NC}"

# Step 2: Install Node.js
echo -e "${YELLOW}📦 Installing Node.js 20 LTS...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
echo -e "${GREEN}✅ Node.js installed: $(node --version)${NC}"

# Step 3: Install PostgreSQL
echo -e "${YELLOW}🗄️  Installing PostgreSQL...${NC}"
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
echo -e "${GREEN}✅ PostgreSQL installed${NC}"

# Step 4: Setup Database
echo -e "${YELLOW}🔧 Setting up database...${NC}"
read -p "Enter database name [omnishop]: " DB_NAME
DB_NAME=${DB_NAME:-omnishop}

read -p "Enter database user [omnishop_user]: " DB_USER
DB_USER=${DB_USER:-omnishop_user}

read -sp "Enter database password: " DB_PASSWORD
echo ""

sudo -u postgres psql <<EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER DATABASE $DB_NAME OWNER TO $DB_USER;
\q
EOF
echo -e "${GREEN}✅ Database created${NC}"

# Step 5: Install PM2
echo -e "${YELLOW}📦 Installing PM2...${NC}"
sudo npm install -g pm2
echo -e "${GREEN}✅ PM2 installed${NC}"

# Step 5.5: Install pnpm
echo -e "${YELLOW}📦 Installing pnpm...${NC}"
sudo npm install -g pnpm
echo -e "${GREEN}✅ pnpm installed: $(pnpm --version)${NC}"

# Step 6: Install Nginx
echo -e "${YELLOW}📦 Installing Nginx...${NC}"
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
echo -e "${GREEN}✅ Nginx installed${NC}"

# Step 7: Install Git
echo -e "${YELLOW}📦 Installing Git...${NC}"
sudo apt install -y git
echo -e "${GREEN}✅ Git installed${NC}"

# Step 8: Create Application Directory
echo -e "${YELLOW}📁 Creating application directory...${NC}"
sudo mkdir -p /var/www/naturaloptions
sudo chown $USER:$USER /var/www/naturaloptions
echo -e "${GREEN}✅ Directory created: /var/www/naturaloptions${NC}"

# Step 9: Configure Firewall
echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
echo "y" | sudo ufw enable
echo -e "${GREEN}✅ Firewall configured${NC}"

# Step 10: Clone Repository
echo -e "${YELLOW}📥 Ready to clone repository...${NC}"
read -p "Enter your GitHub/GitLab repository URL: " REPO_URL

if [ ! -z "$REPO_URL" ]; then
    cd /var/www/naturaloptions
    git clone $REPO_URL .
    echo -e "${GREEN}✅ Repository cloned${NC}"
else
    echo -e "${YELLOW}⚠️  Repository URL not provided. Clone manually later.${NC}"
fi

# Step 11: Create .env file
echo -e "${YELLOW}📝 Creating .env file...${NC}"
cd /var/www/naturaloptions

read -p "Enter WooCommerce Store URL: " WOO_URL
read -p "Enter WooCommerce Consumer Key: " WOO_KEY
read -p "Enter WooCommerce Consumer Secret: " WOO_SECRET
read -p "Enter your domain (e.g., 102.220.12.78.sslip.io): " DOMAIN

# Generate NextAuth Secret
NEXTAUTH_SECRET=$(openssl rand -base64 32)

cat > .env <<EOF
# WooCommerce Configuration
WOO_STORE_URL=$WOO_URL
WOO_CONSUMER_KEY=$WOO_KEY
WOO_CONSUMER_SECRET=$WOO_SECRET

# Database Configuration
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME?schema=public

# NextAuth Configuration
BASEPATH=/admin
NEXTAUTH_URL=https://$DOMAIN/admin
NEXTAUTH_SECRET=$NEXTAUTH_SECRET

# Production
NODE_ENV=production
EOF

echo -e "${GREEN}✅ .env file created${NC}"

# Step 12: Install Dependencies and Build
if [ -f "package.json" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    pnpm install

    # Build woo-rental-bridge
    if [ -d "woo-rental-bridge" ]; then
        cd woo-rental-bridge
        pnpm install
        pnpm build
        cd ..
    fi

    echo -e "${YELLOW}🔧 Setting up database...${NC}"
    pnpm dlx prisma generate
    pnpm dlx prisma migrate deploy

    echo -e "${YELLOW}🔨 Building application...${NC}"
    # Clean build cache
    rm -rf .next node_modules/.cache /tmp/next-* ~/.npm/_cacache
    # Build with optimized memory settings
    NODE_OPTIONS='--max-old-space-size=6144' pnpm build:prod || NODE_OPTIONS='--max-old-space-size=4096' pnpm build

    echo -e "${GREEN}✅ Application built${NC}"
fi

# Step 13: Configure Nginx
echo -e "${YELLOW}🌐 Configuring Nginx...${NC}"
sudo tee /etc/nginx/sites-available/omnishop-admin > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    location = / {
        return 301 /admin/;
    }

    location /admin {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /admin/_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 60m;
    }

    location /admin/api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/omnishop-admin /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
echo -e "${GREEN}✅ Nginx configured${NC}"

# Step 14: Start Application with PM2
if [ -f "package.json" ]; then
    echo -e "${YELLOW}🚀 Starting application...${NC}"
    pm2 start ecosystem.config.js --env production
    pm2 save
    pm2 startup | tail -n 1 | sudo bash
    echo -e "${GREEN}✅ Application started${NC}"
fi

# Step 15: Install SSL (Optional)
echo ""
echo -e "${BLUE}🔒 Would you like to install SSL certificate? (y/n)${NC}"
read -p "" INSTALL_SSL

if [ "$INSTALL_SSL" = "y" ] || [ "$INSTALL_SSL" = "Y" ]; then
    echo -e "${YELLOW}🔒 Installing Certbot...${NC}"
    sudo apt install -y certbot python3-certbot-nginx
    sudo certbot --nginx -d $DOMAIN
    echo -e "${GREEN}✅ SSL certificate installed${NC}"
fi

# Step 16: Summary
echo ""
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo "=================================="
echo ""
echo -e "${BLUE}📊 System Information:${NC}"
echo "  - Node.js: $(node --version)"
echo "  - npm: $(npm --version)"
echo "  - PostgreSQL: $(psql --version | awk '{print $3}')"
echo "  - PM2: $(pm2 --version)"
echo ""
echo -e "${BLUE}📁 Application:${NC}"
echo "  - Location: /var/www/naturaloptions"
echo "  - Domain: $DOMAIN"
echo "  - Database: $DB_NAME"
echo ""
echo -e "${BLUE}🔧 Useful Commands:${NC}"
echo "  - View logs: pm2 logs omnishop-admin"
echo "  - Restart: pm2 restart omnishop-admin"
echo "  - Status: pm2 status"
echo "  - Deploy updates: cd /var/www/naturaloptions && ./deploy.sh"
echo ""
echo -e "${BLUE}🌐 Access your application:${NC}"
echo "  - URL: http://$DOMAIN"
if [ "$INSTALL_SSL" = "y" ] || [ "$INSTALL_SSL" = "Y" ]; then
    echo "  - SSL: https://$DOMAIN"
fi
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "  1. Update your DNS records to point $DOMAIN to this server IP"
echo "  2. Save your .env file credentials securely"
echo "  3. Set up automated backups"
echo ""
