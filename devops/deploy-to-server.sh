#!/bin/bash

# Natural Options - Server Deployment Script
# Server: 212.86.104.9
# This script will deploy the application with all optimizations

set -e

# Configuration
SERVER_IP="212.86.104.9"
SERVER_USER="root"
SERVER_PASS="MotherFuckerJones2026!"
APP_NAME="naturaloptions"
DEPLOY_PATH="/var/www/naturaloptions"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}    Natural Options Platform Deployment${NC}"
echo -e "${GREEN}    Server: ${SERVER_IP}${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"

# First, let's clear any existing SSH host key
ssh-keygen -R ${SERVER_IP} 2>/dev/null || true

# Check for sshpass
if ! command -v sshpass &> /dev/null; then
    echo -e "${YELLOW}Installing sshpass...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew tap hudochenkov/sshpass 2>/dev/null || true
        brew install hudochenkov/sshpass/sshpass 2>/dev/null || {
            echo -e "${YELLOW}Please install sshpass manually or use manual deployment${NC}"
            exit 1
        }
    fi
fi

echo -e "\n${YELLOW}📦 Building application locally...${NC}"
NODE_OPTIONS="--max-old-space-size=2048" npm run build

echo -e "\n${YELLOW}📦 Creating deployment package...${NC}"
tar czf deployment.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=.next/cache \
  --exclude=deployment.tar.gz \
  --exclude=playwright-report \
  --exclude=test-results \
  --exclude=.windsurf \
  --exclude=natural-options-ai-assistant \
  .

echo -e "\n${YELLOW}📤 Uploading to server...${NC}"
echo "If prompted for password, enter: ${SERVER_PASS}"
echo ""

# Upload the deployment package
sshpass -p "${SERVER_PASS}" scp -o StrictHostKeyChecking=no deployment.tar.gz ${SERVER_USER}@${SERVER_IP}:/tmp/

# Upload the setup script
cat > /tmp/server-setup.sh << 'SETUP_SCRIPT'
#!/bin/bash

# Server setup script - runs on the server
set -e

DEPLOY_PATH="/var/www/naturaloptions"

echo "Starting server setup..."

# 1. Update system
apt update && DEBIAN_FRONTEND=noninteractive apt upgrade -y

# 2. Install Node.js 20
if ! node --version 2>/dev/null | grep -q "v20"; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

# 3. Install essential packages
apt install -y git build-essential nginx mongodb-clients

# 4. Install MongoDB
if ! mongod --version &>/dev/null; then
    curl -fsSL https://pgp.mongodb.com/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb.gpg
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" > /etc/apt/sources.list.d/mongodb.list
    apt update && apt install -y mongodb-org
    systemctl enable mongod && systemctl start mongod
fi

# 5. Install PM2
npm install -g pm2

# 6. Setup application directory
mkdir -p ${DEPLOY_PATH}
cd ${DEPLOY_PATH}

# 7. Extract application
tar xzf /tmp/deployment.tar.gz
rm /tmp/deployment.tar.gz

# 8. Install dependencies
NODE_ENV=production npm ci --only=production

# 9. Generate Prisma client
npx prisma generate --schema=./src/prisma/schema.prisma || true

# 10. Create environment file
cat > .env << 'ENV_EOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=mongodb://localhost:27017/naturaloptions_db?maxPoolSize=10&minPoolSize=2
NEXTAUTH_URL=http://212.86.104.9:3000
NEXTAUTH_SECRET=your-secret-key-here-change-this-to-random-string
AUTH_URL=http://212.86.104.9:3000
AUTH_TRUST_HOST=true
AUTH_SECRET=your-secret-key-here-change-this-to-random-string

# WooCommerce Integration (UPDATE THESE WITH ACTUAL VALUES)
WOOCOMMERCE_URL=https://naturaloptions.co.ke
WOOCOMMERCE_CONSUMER_KEY=ck_your_consumer_key_here
WOOCOMMERCE_CONSUMER_SECRET=cs_your_consumer_secret_here
WOOCOMMERCE_WEBHOOK_SECRET=your_webhook_secret_here

# Payment Gateways (UPDATE THESE WITH ACTUAL VALUES)
STRIPE_PUBLIC_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret

# Memory optimization
NODE_OPTIONS=--max-old-space-size=768 --optimize-for-size
PM2_INSTANCES=2
ENV_EOF

# 11. Configure PM2
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup systemd -u root --hp /root || true

# 12. Configure Nginx
cat > /etc/nginx/sites-available/naturaloptions << 'NGINX_EOF'
upstream naturaloptions_backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name 212.86.104.9;
    
    client_max_body_size 50M;
    
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
    
    location /_next/static {
        expires 365d;
        add_header Cache-Control "public, immutable";
        proxy_pass http://naturaloptions_backend;
    }
    
    location /api/webhooks/woocommerce {
        proxy_pass http://naturaloptions_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    location /api {
        proxy_pass http://naturaloptions_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    location / {
        proxy_pass http://naturaloptions_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
NGINX_EOF

ln -sf /etc/nginx/sites-available/naturaloptions /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# 13. Configure firewall
ufw allow 22/tcp
ufw allow 80/tcp  
ufw allow 443/tcp
ufw allow 3000/tcp
echo 'y' | ufw enable || true

echo "Setup complete!"
SETUP_SCRIPT

sshpass -p "${SERVER_PASS}" scp -o StrictHostKeyChecking=no /tmp/server-setup.sh ${SERVER_USER}@${SERVER_IP}:/tmp/

echo -e "\n${YELLOW}🚀 Running server setup...${NC}"
sshpass -p "${SERVER_PASS}" ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "bash /tmp/server-setup.sh"

# Clean up
rm -f deployment.tar.gz /tmp/server-setup.sh

echo -e "\n${YELLOW}✅ Verifying deployment...${NC}"
sshpass -p "${SERVER_PASS}" ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "pm2 list"

echo -e "\n${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e ""
echo -e "🔗 Application URL: ${BLUE}http://${SERVER_IP}${NC}"
echo -e "📊 API Health: ${BLUE}http://${SERVER_IP}/api/health${NC}"
echo -e "🔗 WooCommerce Webhook: ${BLUE}http://${SERVER_IP}/api/webhooks/woocommerce${NC}"
echo -e ""
echo -e "${YELLOW}⚠️ IMPORTANT NEXT STEPS:${NC}"
echo -e "1. SSH into server: ssh root@${SERVER_IP}"
echo -e "2. Edit /var/www/naturaloptions/.env with actual API keys"
echo -e "3. Configure WooCommerce webhooks to point to:"
echo -e "   http://${SERVER_IP}/api/webhooks/woocommerce"
echo -e "4. Test the integration"
echo -e ""
echo -e "${YELLOW}Monitor with:${NC}"
echo -e "ssh root@${SERVER_IP} 'pm2 logs'"
