#!/bin/bash

# naturaloptions Admin Dashboard - Deployment Script
# This script automates the deployment process on VPS

set -e  # Exit on any error

echo "🚀 Starting deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/var/www/omnishop-admin"
BACKUP_DIR="/var/backups/omnishop-admin"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Load environment variables (DATABASE_URL, etc.)
if [ -f "$APP_DIR/.env" ]; then
    set -a
    # shellcheck disable=SC1090
    . "$APP_DIR/.env"
    set +a
fi

# Step 1: Backup Database
echo -e "${YELLOW}📦 Creating database backup...${NC}"
mkdir -p $BACKUP_DIR
if [ -n "$DATABASE_URL" ]; then
    pg_dump "$DATABASE_URL" > "$BACKUP_DIR/pre_deploy_$TIMESTAMP.sql"
else
    echo -e "${RED}❌ DATABASE_URL not set. Cannot run pg_dump.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Database backed up${NC}"

# Step 2: Pull Latest Code
echo -e "${YELLOW}📥 Pulling latest code from git...${NC}"
cd $APP_DIR
git pull origin main
echo -e "${GREEN}✅ Code updated${NC}"

# Step 3: Install Dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
pnpm install --prod

# Build woo-rental-bridge
cd woo-rental-bridge
pnpm install
pnpm build
cd ..
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Step 4: Generate Prisma Client
echo -e "${YELLOW}🔧 Generating Prisma client...${NC}"
pnpm dlx prisma generate
echo -e "${GREEN}✅ Prisma client generated${NC}"

# Step 5: Run Database Migrations
echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
pnpm dlx prisma migrate deploy
echo -e "${GREEN}✅ Migrations completed${NC}"

# Step 6: Build Application
echo -e "${YELLOW}🔨 Building application...${NC}"
pnpm build
echo -e "${GREEN}✅ Build completed${NC}"

# Step 7: Restart PM2
echo -e "${YELLOW}🔄 Restarting application...${NC}"
pm2 restart naturaloptions-admin
echo -e "${GREEN}✅ Application restarted${NC}"

# Step 8: Health Check
echo -e "${YELLOW}🏥 Running health check...${NC}"
sleep 5
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Application is healthy${NC}"
else
    echo -e "${RED}❌ Health check failed! Check logs with: pm2 logs naturaloptions-admin${NC}"
    exit 1
fi

# Step 9: Cleanup old backups (keep last 10)
echo -e "${YELLOW}🧹 Cleaning up old backups...${NC}"
cd $BACKUP_DIR
ls -t pre_deploy_*.sql | tail -n +11 | xargs -r rm
echo -e "${GREEN}✅ Cleanup completed${NC}"

echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo "📊 Application Status:"
pm2 status naturaloptions-admin
echo ""
echo "📝 View logs: pm2 logs naturaloptions-admin"
echo "🔄 Restart: pm2 restart naturaloptions-admin"
echo "⏹️  Stop: pm2 stop naturaloptions-admin"
