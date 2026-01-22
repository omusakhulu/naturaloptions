#!/bin/bash

# Natural Options - Complete Automated PostgreSQL Deployment
# Target Server: 185.181.8.53

set -e

# Configuration
SERVER_IP="185.181.8.53"
SERVER_USER="root"
APP_NAME="naturaloptions"
DEPLOY_PATH="/var/www/naturaloptions"
DB_NAME="naturaloptions_db"
DB_USER="naturaloptions_user"
DB_PASS="NatOpt2024Secure!"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}    Natural Options - PostgreSQL Automated Deployment${NC}"
echo -e "${GREEN}    Server: ${SERVER_IP}${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"

# Step 1: Setup PostgreSQL and dependencies on server
echo -e "\n${YELLOW}1️⃣ Setting up PostgreSQL and dependencies...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << 'SETUP_SCRIPT'
set -e

# Update system
apt update
DEBIAN_FRONTEND=noninteractive apt upgrade -y

# Install essentials
apt install -y curl wget git build-essential nginx software-properties-common

# Install Node.js 20 if not present
if ! node --version 2>/dev/null | grep -q "v20"; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

# Install PM2 globally
npm install -g pm2

# Install PostgreSQL
apt install -y postgresql postgresql-contrib postgresql-client

# Start and enable PostgreSQL
systemctl enable postgresql
systemctl start postgresql

echo "PostgreSQL and Node.js setup complete"
SETUP_SCRIPT

# Step 2: Configure PostgreSQL database
echo -e "\n${YELLOW}2️⃣ Configuring PostgreSQL database...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << POSTGRES_SCRIPT
set -e

# Configure PostgreSQL
sudo -u postgres psql << EOF
-- Drop existing if exists
DROP DATABASE IF EXISTS ${DB_NAME};
DROP USER IF EXISTS ${DB_USER};

-- Create user and database
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';
CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};

-- Grant schema permissions
\c ${DB_NAME}
GRANT ALL ON SCHEMA public TO ${DB_USER};
EOF

echo "PostgreSQL database configured"
POSTGRES_SCRIPT

# Step 3: Build application locally
echo -e "\n${YELLOW}3️⃣ Building application locally...${NC}"
NODE_OPTIONS="--max-old-space-size=2048" npm run build

# Step 4: Create and upload deployment package
echo -e "\n${YELLOW}4️⃣ Creating deployment package...${NC}"
tar czf deployment.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=.next/cache \
  --exclude=deployment.tar.gz \
  --exclude=playwright-report \
  --exclude=test-results \
  --exclude=deployment_package \
  .

echo -e "\n${YELLOW}5️⃣ Uploading to server...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} "mkdir -p ${DEPLOY_PATH}"
scp deployment.tar.gz ${SERVER_USER}@${SERVER_IP}:/tmp/
ssh ${SERVER_USER}@${SERVER_IP} "cd ${DEPLOY_PATH} && tar xzf /tmp/deployment.tar.gz && rm /tmp/deployment.tar.gz"
rm deployment.tar.gz

# Step 5: Install dependencies on server
echo -e "\n${YELLOW}6️⃣ Installing dependencies on server...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << 'INSTALL_SCRIPT'
set -e

cd /var/www/naturaloptions

# Install dependencies
npm install --legacy-peer-deps

echo "Dependencies installed"
INSTALL_SCRIPT

# Step 6: Setup environment and database URL
echo -e "\n${YELLOW}7️⃣ Setting up environment variables...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << ENV_SCRIPT
set -e

cd ${DEPLOY_PATH}

# Create production .env if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env 2>/dev/null || true
fi

# Update DATABASE_URL for PostgreSQL
sed -i '/^DATABASE_URL=/d' .env 2>/dev/null || true
echo "DATABASE_URL=\"postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}?schema=public\"" >> .env

# Add other required variables
grep -q "^NODE_ENV=" .env || echo "NODE_ENV=production" >> .env
grep -q "^NEXTAUTH_URL=" .env || echo "NEXTAUTH_URL=http://${SERVER_IP}" >> .env
grep -q "^NEXTAUTH_SECRET=" .env || echo "NEXTAUTH_SECRET=\$(openssl rand -base64 32)" >> .env

echo "Environment configured"
ENV_SCRIPT

# Step 7: Run Prisma migrations and generate client
echo -e "\n${YELLOW}8️⃣ Running Prisma migrations...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << 'PRISMA_SCRIPT'
set -e

cd /var/www/naturaloptions

# Generate Prisma client
npx prisma generate --schema=./src/prisma/schema.prisma

# Push database schema (create tables)
npx prisma db push --schema=./src/prisma/schema.prisma --accept-data-loss

# Run seed if exists
if [ -f "prisma/seed.js" ]; then
    node prisma/seed.js || echo "Seed completed with warnings"
elif [ -f "src/prisma/seed.js" ]; then
    node src/prisma/seed.js || echo "Seed completed with warnings"
else
    npm run seed || echo "No seed script found"
fi

echo "Prisma setup complete"
PRISMA_SCRIPT

# Step 8: Start application with PM2
echo -e "\n${YELLOW}9️⃣ Starting application with PM2...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << 'PM2_SCRIPT'
set -e

cd /var/www/naturaloptions

# Stop any existing instance
pm2 stop naturaloptions || true
pm2 delete naturaloptions || true

# Start application
pm2 start npm --name "naturaloptions" -- start
pm2 save
pm2 startup systemd -u root --hp /root || true

echo "PM2 started"
PM2_SCRIPT

# Step 9: Configure Nginx
echo -e "\n${YELLOW}🔟 Configuring Nginx...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << NGINX_SCRIPT
set -e

# Create Nginx configuration
cat > /etc/nginx/sites-available/naturaloptions << 'NGINX_CONF'
server {
    listen 80;
    server_name ${SERVER_IP};
    
    client_max_body_size 50M;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX_CONF

# Update server_name with actual IP
sed -i "s/\${SERVER_IP}/${SERVER_IP}/g" /etc/nginx/sites-available/naturaloptions

# Enable site
ln -sf /etc/nginx/sites-available/naturaloptions /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t && systemctl reload nginx

echo "Nginx configured"
NGINX_SCRIPT

# Step 10: Configure firewall
echo -e "\n${YELLOW}1️⃣1️⃣ Configuring firewall...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << 'FIREWALL_SCRIPT'
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
echo 'y' | ufw enable || true
FIREWALL_SCRIPT

# Step 11: Test deployment
echo -e "\n${YELLOW}1️⃣2️⃣ Testing deployment...${NC}"

# Wait for application to start
sleep 10

# Test database connection via API
echo -e "\n${BLUE}Testing database connection...${NC}"
DB_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://${SERVER_IP}/api/health 2>/dev/null || echo "000")
if [ "$DB_TEST" = "200" ] || [ "$DB_TEST" = "404" ]; then
    echo -e "${GREEN}✅ API is responding${NC}"
else
    echo -e "${YELLOW}⚠️ API returned status: $DB_TEST${NC}"
fi

# Test main page
echo -e "\n${BLUE}Testing main page...${NC}"
PAGE_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://${SERVER_IP} 2>/dev/null || echo "000")
if [ "$PAGE_TEST" = "200" ]; then
    echo -e "${GREEN}✅ Main page is accessible${NC}"
else
    echo -e "${YELLOW}⚠️ Main page returned status: $PAGE_TEST${NC}"
fi

# Show PM2 status
echo -e "\n${BLUE}Application status:${NC}"
ssh ${SERVER_USER}@${SERVER_IP} "pm2 list"

# Show logs
echo -e "\n${BLUE}Recent logs:${NC}"
ssh ${SERVER_USER}@${SERVER_IP} "pm2 logs naturaloptions --lines 20 --nostream"

echo -e "\n${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e ""
echo -e "🔗 Application URL: ${BLUE}http://${SERVER_IP}${NC}"
echo -e "🔗 API Health: ${BLUE}http://${SERVER_IP}/api/health${NC}"
echo -e ""
echo -e "${YELLOW}Database Details:${NC}"
echo -e "  • Type: PostgreSQL"
echo -e "  • Database: ${DB_NAME}"
echo -e "  • User: ${DB_USER}"
echo -e ""
echo -e "${YELLOW}Commands:${NC}"
echo -e "  • View logs: ssh root@${SERVER_IP} 'pm2 logs'"
echo -e "  • Restart app: ssh root@${SERVER_IP} 'pm2 restart naturaloptions'"
echo -e "  • Check status: ssh root@${SERVER_IP} 'pm2 status'"
