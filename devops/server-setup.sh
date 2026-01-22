#!/bin/bash

# Natural Options - Server Setup Script
# Run this directly on the server after SSH login
# Usage: bash server-setup.sh

set -e

# Configuration
APP_NAME="naturaloptions"
DEPLOY_PATH="/var/www/naturaloptions"
SERVER_IP="102.212.246.251"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}    Natural Options - Server Setup${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"

# 1. Update system
echo -e "\n${YELLOW}📦 Updating system packages...${NC}"
apt update && apt upgrade -y

# 2. Install base packages
echo -e "\n${YELLOW}📦 Installing essential packages...${NC}"
apt install -y curl wget git build-essential nginx ufw software-properties-common

# 3. Install Node.js 20
echo -e "\n${YELLOW}📦 Installing Node.js 20...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node --version
npm --version

# 4. Install PM2
echo -e "\n${YELLOW}⚙️ Installing PM2...${NC}"
npm install -g pm2
pm2 startup systemd -u root --hp /root

# 5. Install MongoDB
echo -e "\n${YELLOW}🗄 Installing MongoDB...${NC}"
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update
apt install -y mongodb-org
systemctl start mongod
systemctl enable mongod

# 6. Create MongoDB database and user
echo -e "\n${YELLOW}🗄 Setting up MongoDB database...${NC}"
mongosh << 'EOF'
use naturaloptions_db
db.createUser({
  user: "naturaloptions_user",
  pwd: "NatOpt2024Secure!",
  roles: [
    { role: "readWrite", db: "naturaloptions_db" },
    { role: "dbAdmin", db: "naturaloptions_db" }
  ]
})
exit
EOF

# 7. Configure firewall
echo -e "\n${YELLOW}🔒 Configuring firewall...${NC}"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
echo 'y' | ufw enable

# 8. Create application directory
echo -e "\n${YELLOW}📁 Creating application directory...${NC}"
mkdir -p ${DEPLOY_PATH}
mkdir -p ${DEPLOY_PATH}/logs
cd ${DEPLOY_PATH}

# 9. Configure Nginx
echo -e "\n${YELLOW}🌐 Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/naturaloptions << 'NGINX_EOF'
upstream naturaloptions_backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name 102.212.246.251;
    
    client_max_body_size 50M;
    
    # Enable gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
    
    location / {
        proxy_pass http://naturaloptions_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # API endpoints
    location /api {
        proxy_pass http://naturaloptions_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # WooCommerce webhook
    location /api/webhooks/woocommerce {
        proxy_pass http://naturaloptions_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
NGINX_EOF

ln -sf /etc/nginx/sites-available/naturaloptions /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

echo -e "\n${GREEN}✅ Server base setup complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Upload the application files to ${DEPLOY_PATH}"
echo -e "2. Run: cd ${DEPLOY_PATH} && npm install --production"
echo -e "3. Configure .env file"
echo -e "4. Run: npx prisma generate"
echo -e "5. Start with PM2: pm2 start ecosystem.config.js --env production"
echo -e ""
echo -e "${GREEN}Server is ready for application deployment!${NC}"
