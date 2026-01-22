#!/bin/bash

# Natural Options - Complete Automated Deployment
# For fresh Ubuntu VPS at 102.212.246.251

set -e

# Configuration
export SERVER_IP="102.212.246.251"
export SERVER_USER="root"
export SERVER_PASS="MotherFuckerJones2026!"
export APP_NAME="naturaloptions"
export DEPLOY_PATH="/var/www/naturaloptions"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}    Natural Options Platform Deployment${NC}"
echo -e "${GREEN}    Server: ${SERVER_IP}${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"

# Check for sshpass
if ! command -v sshpass &> /dev/null; then
    echo -e "${YELLOW}Installing sshpass...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew tap hudochenkov/sshpass || true
        brew install hudochenkov/sshpass/sshpass || {
            echo -e "${RED}Please install sshpass manually:${NC}"
            echo "brew install hudochenkov/sshpass/sshpass"
            exit 1
        }
    fi
fi

# SSH function with password
ssh_exec() {
    sshpass -p "${SERVER_PASS}" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${SERVER_USER}@${SERVER_IP} "$1"
}

# SCP function with password  
scp_upload() {
    sshpass -p "${SERVER_PASS}" scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -r "$1" ${SERVER_USER}@${SERVER_IP}:"$2"
}

echo -e "\n${YELLOW}1️⃣ Setting up server base packages...${NC}"
ssh_exec "
apt update && apt upgrade -y
apt install -y curl wget git build-essential nginx mongodb-org nodejs npm pm2 ufw || true

# Install Node.js 20 if not present
if ! node --version | grep -q 'v20'; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

# Install PM2 globally
npm install -g pm2

# Install MongoDB if not present
if ! mongod --version &>/dev/null; then
    curl -fsSL https://pgp.mongodb.com/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
    echo 'deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse' | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    apt update && apt install -y mongodb-org
    systemctl enable mongod
    systemctl start mongod
fi
"

echo -e "\n${YELLOW}2️⃣ Creating application directories...${NC}"
ssh_exec "mkdir -p ${DEPLOY_PATH} ${DEPLOY_PATH}/logs"

echo -e "\n${YELLOW}3️⃣ Building application locally...${NC}"
NODE_OPTIONS="--max-old-space-size=2048" npm run build

echo -e "\n${YELLOW}4️⃣ Uploading application files...${NC}"
# Create tarball excluding unnecessary files
tar czf deployment.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=.next/cache \
  --exclude=deployment.tar.gz \
  --exclude=playwright-report \
  --exclude=test-results \
  .

# Upload and extract
scp_upload deployment.tar.gz /tmp/
ssh_exec "cd ${DEPLOY_PATH} && tar xzf /tmp/deployment.tar.gz && rm /tmp/deployment.tar.gz"

echo -e "\n${YELLOW}5️⃣ Installing dependencies...${NC}"
ssh_exec "cd ${DEPLOY_PATH} && NODE_ENV=production npm ci --only=production"

echo -e "\n${YELLOW}6️⃣ Setting up environment...${NC}"
ssh_exec "cat > ${DEPLOY_PATH}/.env << 'EOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=mongodb://localhost:27017/naturaloptions_db?maxPoolSize=10
NEXTAUTH_URL=http://102.212.246.251:3000
NEXTAUTH_SECRET=change-this-to-secure-random-string
AUTH_URL=http://102.212.246.251:3000
AUTH_TRUST_HOST=true
AUTH_SECRET=change-this-to-secure-random-string

# WooCommerce (update with actual values)
WOOCOMMERCE_URL=https://naturaloptions.co.ke
WOOCOMMERCE_CONSUMER_KEY=ck_your_key_here
WOOCOMMERCE_CONSUMER_SECRET=cs_your_secret_here

# Optimizations
NODE_OPTIONS=--max-old-space-size=768
PM2_INSTANCES=2
EOF"

echo -e "\n${YELLOW}7️⃣ Generating Prisma client...${NC}"
ssh_exec "cd ${DEPLOY_PATH} && npx prisma generate --schema=./src/prisma/schema.prisma"

echo -e "\n${YELLOW}8️⃣ Setting up PM2...${NC}"
ssh_exec "cd ${DEPLOY_PATH} && pm2 delete all || true"
ssh_exec "cd ${DEPLOY_PATH} && pm2 start ecosystem.config.js --env production"
ssh_exec "pm2 save && pm2 startup systemd -u root --hp /root"

echo -e "\n${YELLOW}9️⃣ Configuring Nginx...${NC}"
ssh_exec "cat > /etc/nginx/sites-available/naturaloptions << 'EOF'
server {
    listen 80;
    server_name ${SERVER_IP};
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_cache_bypass \\\$http_upgrade;
    }
}
EOF"

ssh_exec "ln -sf /etc/nginx/sites-available/naturaloptions /etc/nginx/sites-enabled/"
ssh_exec "rm -f /etc/nginx/sites-enabled/default"
ssh_exec "nginx -t && systemctl restart nginx"

echo -e "\n${YELLOW}🔟 Configuring firewall...${NC}"
ssh_exec "ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && echo 'y' | ufw enable || true"

# Clean up
rm -f deployment.tar.gz

echo -e "\n${GREEN}✅ Verifying deployment...${NC}"
ssh_exec "pm2 list"

echo -e "\n${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "🔗 Application URL: ${BLUE}http://${SERVER_IP}${NC}"
echo -e "📊 Check status: ssh root@${SERVER_IP} 'pm2 list'"
echo -e "📝 View logs: ssh root@${SERVER_IP} 'pm2 logs'"
echo -e "\n${YELLOW}⚠️ Remember to update the .env file with your actual API keys!${NC}"
