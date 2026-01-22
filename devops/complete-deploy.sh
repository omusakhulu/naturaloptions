#!/bin/bash

# Natural Options - Complete Deployment Script
# Server: 212.86.104.9

set -e

SERVER_IP="212.86.104.9"
SERVER_USER="root"
SERVER_PASS="MotherFuckerJones2026!"
DEPLOY_PATH="/var/www/naturaloptions"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Natural Options - Deployment to ${SERVER_IP}${NC}"

# Clear SSH host key
ssh-keygen -R ${SERVER_IP} 2>/dev/null || true

# Build application
echo -e "\n${YELLOW}Building application...${NC}"
NODE_OPTIONS="--max-old-space-size=2048" npm run build

# Create deployment package
echo -e "\n${YELLOW}Creating deployment package...${NC}"
tar czf deployment.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=.next/cache \
  --exclude=deployment.tar.gz \
  .

# Create setup script
cat > setup.sh << 'SCRIPT'
#!/bin/bash
set -e

DEPLOY_PATH="/var/www/naturaloptions"

# Install essentials
apt update
apt install -y git build-essential nginx

# Install MongoDB
if ! mongod --version &>/dev/null; then
    curl -fsSL https://pgp.mongodb.com/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb.gpg
    echo "deb [ signed-by=/usr/share/keyrings/mongodb.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" > /etc/apt/sources.list.d/mongodb.list
    apt update && apt install -y mongodb-org || apt install -y mongodb
    systemctl enable mongod || systemctl enable mongodb
    systemctl start mongod || systemctl start mongodb
fi

# Install PM2
npm install -g pm2

# Setup application
mkdir -p ${DEPLOY_PATH}
cd ${DEPLOY_PATH}
tar xzf /tmp/deployment.tar.gz
rm /tmp/deployment.tar.gz

# Install dependencies
npm ci --only=production

# Generate Prisma
npx prisma generate --schema=./src/prisma/schema.prisma || true

# Create .env file
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=mongodb://localhost:27017/naturaloptions_db
NEXTAUTH_URL=http://212.86.104.9:3000
NEXTAUTH_SECRET=your-secure-secret-here
AUTH_URL=http://212.86.104.9:3000
AUTH_TRUST_HOST=true
WOOCOMMERCE_URL=https://naturaloptions.co.ke
WOOCOMMERCE_CONSUMER_KEY=ck_update_me
WOOCOMMERCE_CONSUMER_SECRET=cs_update_me
NODE_OPTIONS=--max-old-space-size=768
PM2_INSTANCES=2
EOF

# Start PM2
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js --env production
pm2 save

# Configure Nginx
cat > /etc/nginx/sites-available/naturaloptions << 'NGX'
server {
    listen 80;
    server_name 212.86.104.9;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGX

ln -sf /etc/nginx/sites-available/naturaloptions /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# Firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
echo 'y' | ufw enable || true

echo "Deployment complete!"
pm2 list
SCRIPT

echo -e "\n${YELLOW}Uploading files...${NC}"
echo "Password: ${SERVER_PASS}"

# Upload files
sshpass -p "${SERVER_PASS}" scp -o StrictHostKeyChecking=no deployment.tar.gz ${SERVER_USER}@${SERVER_IP}:/tmp/ || \
  scp -o StrictHostKeyChecking=no deployment.tar.gz ${SERVER_USER}@${SERVER_IP}:/tmp/

sshpass -p "${SERVER_PASS}" scp -o StrictHostKeyChecking=no setup.sh ${SERVER_USER}@${SERVER_IP}:/tmp/ || \
  scp -o StrictHostKeyChecking=no setup.sh ${SERVER_USER}@${SERVER_IP}:/tmp/

# Execute setup
echo -e "\n${YELLOW}Running setup on server...${NC}"
sshpass -p "${SERVER_PASS}" ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "bash /tmp/setup.sh" || \
  ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "bash /tmp/setup.sh"

# Clean up
rm -f deployment.tar.gz setup.sh

echo -e "\n${GREEN}✅ Deployment Complete!${NC}"
echo -e "Application: http://${SERVER_IP}"
echo -e "Check status: ssh root@${SERVER_IP} 'pm2 list'"
