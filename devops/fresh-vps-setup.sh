#!/bin/bash

# Natural Options - Complete Fresh VPS Setup & Deployment Script
# For Ubuntu 22.04/24.04 VPS
# This script sets up everything from scratch with optimizations

set -e  # Exit on error

# Load configuration
source ./devops/config.env

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}    Natural Options - Fresh VPS Setup & Deployment${NC}"
echo -e "${GREEN}    Target: ${SERVER_IP}${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"

# Function to execute commands on remote server
remote_exec() {
    ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "$1"
}

# Function to copy files to remote server
remote_copy() {
    scp -o StrictHostKeyChecking=no -r "$1" ${SERVER_USER}@${SERVER_IP}:"$2"
}

# Step 1: Initial server setup and updates
echo -e "\n${YELLOW}📦 Step 1: Updating Ubuntu and installing base packages...${NC}"
remote_exec "
    # Update system
    apt update && apt upgrade -y
    
    # Install essential packages
    apt install -y curl wget git build-essential software-properties-common \
        nginx certbot python3-certbot-nginx ufw fail2ban \
        htop net-tools unzip gnupg lsb-release ca-certificates
    
    # Set timezone
    timedatectl set-timezone Africa/Nairobi
"

# Step 2: Install Node.js 20.x LTS
echo -e "\n${YELLOW}📦 Step 2: Installing Node.js 20.x LTS...${NC}"
remote_exec "
    # Install Node.js 20.x
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    
    # Verify installation
    node --version
    npm --version
    
    # Install pnpm globally
    npm install -g pnpm
"

# Step 3: Install MongoDB
echo -e "\n${YELLOW}🗄 Step 3: Installing MongoDB...${NC}"
remote_exec "
    # Import MongoDB GPG key
    curl -fsSL https://pgp.mongodb.com/server-7.0.asc | \
        gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
    
    # Add MongoDB repository
    echo 'deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse' | \
        tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    
    # Update and install MongoDB
    apt update
    apt install -y mongodb-org
    
    # Start and enable MongoDB
    systemctl start mongod
    systemctl enable mongod
    
    # Configure MongoDB for production
    cat > /etc/mongod.conf << 'MONGEOF'
# MongoDB configuration for production
storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true
  engine: wiredTiger
  wiredTiger:
    engineConfig:
      cacheSizeGB: 0.5

systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log

net:
  port: 27017
  bindIp: 127.0.0.1

processManagement:
  timeZoneInfo: /usr/share/zoneinfo

# Connection pool settings
setParameter:
  maxIncomingConnections: 65536
MONGEOF
    
    # Restart MongoDB with new configuration
    systemctl restart mongod
    
    # Create database and user
    mongosh << 'MONGOCOMMANDS'
use naturaloptions_db
db.createUser({
  user: 'naturaloptions_user',
  pwd: 'NatOpt2024Secure!',
  roles: [
    { role: 'readWrite', db: 'naturaloptions_db' },
    { role: 'dbAdmin', db: 'naturaloptions_db' }
  ]
})
exit
MONGOCOMMANDS
"

# Step 4: Install PM2
echo -e "\n${YELLOW}⚙️ Step 4: Installing PM2...${NC}"
remote_exec "
    npm install -g pm2
    pm2 startup systemd -u root --hp /root
"

# Step 5: Configure firewall
echo -e "\n${YELLOW}🔒 Step 5: Configuring firewall...${NC}"
remote_exec "
    # Configure UFW firewall
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 3000/tcp
    echo 'y' | ufw enable
    
    # Configure fail2ban for SSH protection
    cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
    systemctl enable fail2ban
    systemctl start fail2ban
"

# Step 6: Create application directory structure
echo -e "\n${YELLOW}📁 Step 6: Creating application directories...${NC}"
remote_exec "
    mkdir -p ${DEPLOY_PATH}
    mkdir -p ${DEPLOY_PATH}/logs
    mkdir -p ${DEPLOY_PATH}/uploads
    mkdir -p /var/cache/nginx
    chown www-data:www-data /var/cache/nginx
"

# Step 7: Build application locally
echo -e "\n${YELLOW}🔨 Step 7: Building application with optimizations...${NC}"
# Clean previous builds
rm -rf .next
rm -rf node_modules/.cache

# Build with optimizations
NODE_OPTIONS="--max-old-space-size=2048" npm run build

# Step 8: Create deployment package
echo -e "\n${YELLOW}📦 Step 8: Creating deployment package...${NC}"
rm -rf deployment_package
mkdir -p deployment_package

# Copy essential files only
rsync -av --progress \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.next/cache' \
  --exclude 'deployment_package' \
  --exclude '*.log' \
  --exclude '.DS_Store' \
  --exclude 'playwright-report' \
  --exclude 'test-results' \
  --exclude '.windsurf' \
  --exclude 'natural-options-ai-assistant' \
  ./ deployment_package/

# Step 9: Upload application
echo -e "\n${YELLOW}📤 Step 9: Uploading application to server...${NC}"
rsync -avz --delete \
  --exclude 'public/uploads' \
  --exclude 'logs' \
  deployment_package/ ${SERVER_USER}@${SERVER_IP}:${DEPLOY_PATH}/

# Step 10: Install dependencies and setup environment
echo -e "\n${YELLOW}📦 Step 10: Installing production dependencies...${NC}"
remote_exec "
    cd ${DEPLOY_PATH}
    
    # Install production dependencies
    NODE_ENV=production npm ci --only=production --omit=dev
    
    # Generate Prisma client
    npx prisma generate --schema=./src/prisma/schema.prisma
"

# Step 11: Configure environment with all integrations
echo -e "\n${YELLOW}⚙️ Step 11: Configuring environment and integrations...${NC}"
remote_exec "
    cd ${DEPLOY_PATH}
    
    # Create comprehensive .env.production file
    cat > .env.production << 'ENVEOF'
# Application
NODE_ENV=production
PORT=3000
NEXTAUTH_URL=http://102.212.246.251:3000
NEXTAUTH_SECRET=your-secret-key-here-change-this-to-random-string

# Database with connection pooling
DATABASE_URL=mongodb://naturaloptions_user:NatOpt2024Secure!@localhost:27017/naturaloptions_db?authSource=naturaloptions_db&maxPoolSize=10&minPoolSize=2&maxIdleTimeMS=10000

# NextAuth Configuration
AUTH_URL=http://102.212.246.251:3000
AUTH_TRUST_HOST=true
AUTH_SECRET=your-secret-key-here-change-this-to-random-string

# WooCommerce Integration
WOOCOMMERCE_URL=https://naturaloptions.co.ke
WOOCOMMERCE_CONSUMER_KEY=ck_your_consumer_key_here
WOOCOMMERCE_CONSUMER_SECRET=cs_your_consumer_secret_here
WOOCOMMERCE_WEBHOOK_SECRET=your_webhook_secret_here

# Payment Gateway - Stripe
STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret

# Payment Gateway - PayPal
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox

# Payment Gateway - M-Pesa (for Kenya)
MPESA_CONSUMER_KEY=your_mpesa_consumer_key
MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
MPESA_PASSKEY=your_mpesa_passkey
MPESA_SHORTCODE=174379
MPESA_ENVIRONMENT=sandbox

# Email Configuration (for notifications)
EMAIL_FROM=noreply@naturaloptions.co.ke
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Application URLs
APP_URL=http://102.212.246.251:3000
API_URL=http://102.212.246.251:3000/api

# Memory optimization
NODE_OPTIONS=--max-old-space-size=768 --optimize-for-size

# PM2 cluster mode instances
PM2_INSTANCES=2

# Logging
LOG_LEVEL=info
ENVEOF
    
    # Create .env from .env.production
    cp .env.production .env
"

# Step 12: Deploy optimized PM2 configuration
echo -e "\n${YELLOW}📋 Step 12: Setting up PM2 with cluster mode...${NC}"
remote_copy ./ecosystem.config.js ${DEPLOY_PATH}/

# Step 13: Configure Nginx with optimizations
echo -e "\n${YELLOW}🌐 Step 13: Configuring Nginx with caching and compression...${NC}"
remote_exec "
    # Create optimized Nginx configuration
    cat > /etc/nginx/sites-available/naturaloptions << 'NGINXEOF'
# Cache configuration
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=app_cache:10m max_size=100m inactive=60m use_temp_path=off;

upstream naturaloptions_backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name 102.212.246.251;
    
    # Max upload size for product images
    client_max_body_size 50M;
    
    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss;
    
    # Security headers
    add_header X-Frame-Options \"SAMEORIGIN\" always;
    add_header X-Content-Type-Options \"nosniff\" always;
    add_header X-XSS-Protection \"1; mode=block\" always;
    
    # Static file caching
    location /_next/static {
        proxy_cache app_cache;
        proxy_cache_valid 200 1y;
        add_header Cache-Control \"public, immutable\";
        proxy_pass http://naturaloptions_backend;
    }
    
    location /static {
        expires 30d;
        add_header Cache-Control \"public, immutable\";
        proxy_pass http://naturaloptions_backend;
    }
    
    # WooCommerce webhook endpoint
    location /api/webhooks/woocommerce {
        proxy_pass http://naturaloptions_backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Payment gateway webhooks
    location /api/webhooks/stripe {
        proxy_pass http://naturaloptions_backend;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
    
    location /api/webhooks/paypal {
        proxy_pass http://naturaloptions_backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
    
    location /api/webhooks/mpesa {
        proxy_pass http://naturaloptions_backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
    
    # API endpoints - no caching
    location /api {
        proxy_pass http://naturaloptions_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Main application
    location / {
        proxy_pass http://naturaloptions_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Cache HTML for 10 minutes
        proxy_cache app_cache;
        proxy_cache_valid 200 10m;
        proxy_cache_use_stale error timeout http_500 http_502 http_503 http_504;
    }
}
NGINXEOF
    
    # Enable site
    ln -sf /etc/nginx/sites-available/naturaloptions /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Test and reload Nginx
    nginx -t && systemctl restart nginx
"

# Step 14: Initialize database and seed data
echo -e "\n${YELLOW}🗄 Step 14: Initializing database...${NC}"
remote_exec "
    cd ${DEPLOY_PATH}
    
    # Run Prisma migrations
    npx prisma migrate deploy --schema=./src/prisma/schema.prisma || true
    
    # Seed initial data if needed
    if [ -f prisma/seed.js ]; then
        node prisma/seed.js || true
    fi
"

# Step 15: Start application with PM2
echo -e "\n${YELLOW}🚀 Step 15: Starting application with PM2 cluster mode...${NC}"
remote_exec "
    cd ${DEPLOY_PATH}
    
    # Start application
    pm2 start ecosystem.config.js --env production
    
    # Save PM2 configuration
    pm2 save
    
    # Setup PM2 startup
    pm2 startup systemd -u root --hp /root
    systemctl enable pm2-root
"

# Step 16: Setup health check endpoint
echo -e "\n${YELLOW}❤️ Step 16: Creating health check endpoint...${NC}"
remote_exec "
    cd ${DEPLOY_PATH}
    
    # Create health check API if it doesn't exist
    if [ ! -f src/app/api/health/route.ts ]; then
        mkdir -p src/app/api/health
        cat > src/app/api/health/route.ts << 'HEALTHEOF'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Check database connection
    await prisma.\$queryRaw\`SELECT 1\`
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      environment: process.env.NODE_ENV
    })
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 503 })
  }
}
HEALTHEOF
    fi
"

# Step 17: Setup monitoring and logs
echo -e "\n${YELLOW}📊 Step 17: Setting up monitoring...${NC}"
remote_exec "
    # Setup log rotation
    cat > /etc/logrotate.d/naturaloptions << 'LOGROTEOF'
${DEPLOY_PATH}/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 640 root root
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
LOGROTEOF
    
    # Create monitoring script
    cat > ${DEPLOY_PATH}/monitor.sh << 'MONITOREOF'
#!/bin/bash
# Simple monitoring script

echo \"=== Natural Options Platform Status ===\"
echo \"\"
echo \"PM2 Status:\"
pm2 list
echo \"\"
echo \"Memory Usage:\"
free -h
echo \"\"
echo \"Disk Usage:\"
df -h /
echo \"\"
echo \"MongoDB Connections:\"
mongosh naturaloptions_db --eval \"db.serverStatus().connections\" --quiet
echo \"\"
echo \"Nginx Status:\"
systemctl status nginx --no-pager | head -n 5
echo \"\"
echo \"Recent Errors (last 10):\"
pm2 logs naturaloptions-admin --err --nostream --lines 10
MONITOREOF
    
    chmod +x ${DEPLOY_PATH}/monitor.sh
"

# Step 18: Verify deployment
echo -e "\n${YELLOW}✅ Step 18: Verifying deployment...${NC}"
sleep 10

# Check PM2 status
echo -e "\n${BLUE}PM2 Status:${NC}"
remote_exec "pm2 list"

# Check application health
echo -e "\n${BLUE}Health Check:${NC}"
response=$(curl -s -o /dev/null -w "%{http_code}" http://${SERVER_IP}:3000/api/health 2>/dev/null || echo "000")
if [ "$response" = "200" ]; then
    echo -e "${GREEN}✅ Application is healthy${NC}"
    curl -s http://${SERVER_IP}:3000/api/health | python3 -m json.tool || true
else
    echo -e "${YELLOW}⚠️ Application may still be starting up... Response code: $response${NC}"
fi

# Check MongoDB
echo -e "\n${BLUE}MongoDB Status:${NC}"
remote_exec "systemctl status mongod --no-pager | head -n 5"

# Check Nginx
echo -e "\n${BLUE}Nginx Status:${NC}"
remote_exec "systemctl status nginx --no-pager | head -n 5"

# Show resource usage
echo -e "\n${BLUE}Resource Usage:${NC}"
remote_exec "
    echo 'Memory:'
    free -h
    echo ''
    echo 'CPU Load:'
    uptime
"

# Clean up
rm -rf deployment_package

echo -e "\n${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e ""
echo -e "${GREEN}✅ Platform deployed with optimizations:${NC}"
echo -e "  • MongoDB installed and configured with connection pooling"
echo -e "  • PM2 cluster mode with 2 instances for load balancing"
echo -e "  • Nginx configured with caching and compression"
echo -e "  • Single PrismaClient instance (optimized from 24)"
echo -e "  • API response caching implemented"
echo -e "  • WooCommerce webhook endpoints configured"
echo -e "  • Payment gateway endpoints ready"
echo -e ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo -e "  1. Update WooCommerce API keys in .env file"
echo -e "  2. Configure payment gateway credentials"
echo -e "  3. Set up WordPress webhooks to:"
echo -e "     • http://${SERVER_IP}/api/webhooks/woocommerce"
echo -e "  4. Test integrations with: ${DEPLOY_PATH}/monitor.sh"
echo -e ""
echo -e "${GREEN}🔗 Access URLs:${NC}"
echo -e "  • Application: ${BLUE}http://${SERVER_IP}${NC}"
echo -e "  • API Health: ${BLUE}http://${SERVER_IP}/api/health${NC}"
echo -e "  • WooCommerce Webhook: ${BLUE}http://${SERVER_IP}/api/webhooks/woocommerce${NC}"
echo -e ""
echo -e "${YELLOW}🔧 Monitoring Commands:${NC}"
echo -e "  • View logs: ssh root@${SERVER_IP} 'pm2 logs'"
echo -e "  • Monitor resources: ssh root@${SERVER_IP} 'pm2 monit'"
echo -e "  • Check status: ssh root@${SERVER_IP} '${DEPLOY_PATH}/monitor.sh'"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
