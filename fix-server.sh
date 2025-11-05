#!/bin/bash

echo "🛑 Stopping server crashes..."

# Navigate to project directory
cd /var/www/omnishop-admin

# Stop PM2 process
pm2 stop omnishop-admin

# Remove the problematic search API
if [ -f "src/app/api/search/route.ts" ]; then
    rm -f src/app/api/search/route.ts
    echo "✅ Removed search API"
fi

# Kill any hanging node processes
pkill -9 node

# Clear build cache
rm -rf .next
rm -rf node_modules/.cache

echo "🔄 Rebuilding application..."

# Rebuild
NODE_OPTIONS='--max-old-space-size=6144' npm run build

# Restart PM2
pm2 restart omnishop-admin

echo "✅ Server fixed and restarted!"
echo "📊 Check status with: pm2 logs omnishop-admin"
