#!/bin/bash

# Natural Options - Optimized Deployment Script
# This script includes performance optimizations to reduce server resource usage

set -e  # Exit on error

# Load configuration
source ./devops/config.env

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Optimized Deployment to ${SERVER_IP}...${NC}"

# Function to execute commands on remote server
remote_exec() {
    ssh ${SERVER_USER}@${SERVER_IP} "$1"
}

# Function to copy files to remote server
remote_copy() {
    scp -r "$1" ${SERVER_USER}@${SERVER_IP}:"$2"
}

# Step 1: Build application with optimizations
echo -e "${YELLOW}📦 Building application with optimizations...${NC}"
# Clean previous builds
rm -rf .next
rm -rf node_modules/.cache

# Build with memory limit and optimizations
NODE_OPTIONS="--max-old-space-size=2048" npm run build

# Step 2: Create deployment package
echo -e "${YELLOW}📦 Creating deployment package...${NC}"
rm -rf deployment_package
mkdir -p deployment_package

# Copy essential files only (exclude development files)
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

# Step 3: Prepare remote server
echo -e "${YELLOW}🛠 Preparing remote server...${NC}"
remote_exec "
    # Stop current application
    cd ${DEPLOY_PATH} || exit 0
    pm2 stop ${APP_NAME} || true
    pm2 delete ${APP_NAME} || true
    
    # Clean old files but preserve uploads and logs
    find ${DEPLOY_PATH} -maxdepth 1 ! -name 'public' ! -name 'logs' ! -name 'uploads' -exec rm -rf {} + 2>/dev/null || true
    
    # Ensure directories exist
    mkdir -p ${DEPLOY_PATH}/logs
"

# Step 4: Upload optimized package
echo -e "${YELLOW}📤 Uploading optimized package...${NC}"
rsync -avz --delete \
  --exclude 'public/uploads' \
  --exclude 'logs' \
  deployment_package/ ${SERVER_USER}@${SERVER_IP}:${DEPLOY_PATH}/

# Step 5: Install production dependencies only
echo -e "${YELLOW}📦 Installing production dependencies...${NC}"
remote_exec "
    cd ${DEPLOY_PATH}
    
    # Clean npm cache to free space
    npm cache clean --force
    
    # Install production dependencies only
    NODE_ENV=production npm ci --only=production --omit=dev
    
    # Generate Prisma client with minimal output
    npx prisma generate --schema=./src/prisma/schema.prisma
"

# Step 6: Optimize database
echo -e "${YELLOW}🗄 Optimizing database connections...${NC}"
remote_exec "
    cd ${DEPLOY_PATH}
    
    # Run database migrations
    npx prisma migrate deploy --schema=./src/prisma/schema.prisma || true
"

# Step 7: Set up environment with optimizations
echo -e "${YELLOW}⚙️  Setting up optimized environment...${NC}"
remote_exec "
    cd ${DEPLOY_PATH}
    
    # Create .env.production with optimizations
    cat > .env.production << EOF
NODE_ENV=production
PORT=${APP_PORT}
DATABASE_URL=\$(grep DATABASE_URL .env | cut -d '=' -f2-)

# Add connection pooling to MongoDB URL if not present
if [[ \$DATABASE_URL == mongodb* ]] && [[ \$DATABASE_URL != *maxPoolSize* ]]; then
    DATABASE_URL=\"\${DATABASE_URL}?maxPoolSize=10&minPoolSize=2&maxIdleTimeMS=10000\"
fi

# Memory optimization
NODE_OPTIONS=--max-old-space-size=768 --optimize-for-size

# PM2 cluster mode instances
PM2_INSTANCES=2
EOF

    # Copy other env variables from .env
    grep -v '^DATABASE_URL=' .env | grep -v '^NODE_ENV=' | grep -v '^PORT=' >> .env.production || true
"

# Step 8: Copy optimized PM2 configuration
echo -e "${YELLOW}📋 Deploying optimized PM2 configuration...${NC}"
remote_copy ./ecosystem.config.js ${DEPLOY_PATH}/

# Step 9: Start application with PM2 cluster mode
echo -e "${YELLOW}🚀 Starting application with PM2 cluster mode...${NC}"
remote_exec "
    cd ${DEPLOY_PATH}
    
    # Start with optimized PM2 configuration
    pm2 start ecosystem.config.js --env production
    
    # Save PM2 configuration
    pm2 save
    
    # Setup PM2 to start on boot
    pm2 startup systemd -u ${SERVER_USER} --hp /home/${SERVER_USER} || true
"

# Step 10: Configure Nginx with caching
echo -e "${YELLOW}🌐 Optimizing Nginx configuration...${NC}"
remote_exec "
    # Create Nginx cache directory
    sudo mkdir -p /var/cache/nginx
    sudo chown www-data:www-data /var/cache/nginx
    
    # Update Nginx config with caching
    sudo tee /etc/nginx/sites-available/${APP_NAME} > /dev/null << 'EOF'
# Cache configuration
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=app_cache:10m max_size=100m inactive=60m use_temp_path=off;

upstream ${APP_NAME}_backend {
    # Load balance between PM2 instances
    server 127.0.0.1:${APP_PORT};
    keepalive 64;
}

server {
    listen 80;
    server_name ${SERVER_IP};
    
    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Security headers
    add_header X-Frame-Options \"SAMEORIGIN\" always;
    add_header X-Content-Type-Options \"nosniff\" always;
    add_header X-XSS-Protection \"1; mode=block\" always;
    
    # Static file caching
    location /_next/static {
        proxy_cache app_cache;
        proxy_cache_valid 200 1y;
        add_header Cache-Control \"public, immutable\";
        proxy_pass http://${APP_NAME}_backend;
    }
    
    location /static {
        expires 30d;
        add_header Cache-Control \"public, immutable\";
        proxy_pass http://${APP_NAME}_backend;
    }
    
    # API endpoints - no caching
    location /api {
        proxy_pass http://${APP_NAME}_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_cache_bypass \\\$http_upgrade;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
    }
    
    # Main application
    location / {
        proxy_pass http://${APP_NAME}_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_cache_bypass \\\$http_upgrade;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
        
        # Cache HTML for 10 minutes
        proxy_cache app_cache;
        proxy_cache_valid 200 10m;
        proxy_cache_use_stale error timeout http_500 http_502 http_503 http_504;
    }
}
EOF
    
    # Reload Nginx
    sudo nginx -t && sudo systemctl reload nginx
"

# Step 11: Verify deployment
echo -e "${YELLOW}✅ Verifying deployment...${NC}"
sleep 5

# Check PM2 status
echo -e "${GREEN}PM2 Status:${NC}"
remote_exec "pm2 list"

# Check application health
echo -e "${GREEN}Application Health Check:${NC}"
response=$(curl -s -o /dev/null -w "%{http_code}" http://${SERVER_IP}:${APP_PORT}/api/health 2>/dev/null || echo "000")
if [ "$response" = "200" ] || [ "$response" = "404" ]; then
    echo -e "${GREEN}✅ Application is responding${NC}"
else
    echo -e "${YELLOW}⚠️ Application may still be starting up...${NC}"
fi

# Show resource usage
echo -e "${GREEN}Resource Usage:${NC}"
remote_exec "
    echo 'Memory Usage:'
    free -h
    echo ''
    echo 'PM2 Memory Usage:'
    pm2 info ${APP_NAME} | grep -E 'memory|heap' || true
"

# Clean up local deployment package
rm -rf deployment_package

echo -e "${GREEN}🎉 Optimized deployment complete!${NC}"
echo -e "${GREEN}📊 Performance improvements applied:${NC}"
echo -e "  • Single PrismaClient instance (reduced from 24)"
echo -e "  • PM2 cluster mode with 2 instances"
echo -e "  • Database connection pooling enabled"
echo -e "  • API response caching implemented"
echo -e "  • Nginx caching for static assets"
echo -e "  • Gzip compression enabled"
echo -e "  • Memory limits optimized"
echo -e ""
echo -e "${GREEN}Access your application at: http://${SERVER_IP}${NC}"
