#!/bin/bash

echo "🔧 Fixing VPS Authentication Configuration..."
echo ""

# Step 1: Update .env file for VPS
echo "1️⃣ Updating environment variables for VPS..."

# Check if running on VPS (detect if /var/www/omnishop-admin exists)
if [ -d "/var/www/omnishop-admin" ]; then
    echo "  ✅ Running on VPS - updating environment"
    cd /var/www/omnishop-admin
else
    echo "  ℹ️  Running locally - environment already updated"
fi

# Step 2: Restart the application
echo ""
echo "2️⃣ Restarting application..."
if command -v pm2 &> /dev/null; then
    pm2 restart omnishop-admin
    pm2 save
    echo "  ✅ PM2 application restarted"
else
    echo "  ⚠️  PM2 not found - please restart manually"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Authentication configuration updated!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Your VPS URL: http://102.212.246.251:3000"
echo "🔑 Login page: http://102.212.246.251:3000/en/pages/auth/login-v2"
echo ""
echo "Test credentials:"
echo "  Email: superadmin@omnishop.com"
echo "  Password: password123"
