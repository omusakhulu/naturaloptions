#!/bin/bash

echo "🔧 Fixing all Next.js 15 build errors on VPS..."
echo "================================================"

# Step 1: Ensure we're in the correct directory
cd /var/www/omnishop-admin

# Step 2: Pull latest changes if using git
echo "📝 Step 1: Pulling latest changes..."
git pull origin main || echo "Skipping git pull..."

# Step 3: Clean build cache
echo "📝 Step 2: Cleaning build cache..."
rm -rf .next node_modules/.cache

# Step 4: Ensure all dependencies are installed
echo "📝 Step 3: Installing dependencies..."
pnpm install

# Step 5: Set proper memory settings for build
echo "📝 Step 4: Setting build environment..."
export NODE_OPTIONS='--max-old-space-size=2048'
export NODE_ENV=production

# Step 6: Build the application
echo "🚀 Step 5: Building application..."
pnpm build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build completed successfully!"
    echo "================================================"
    echo ""
    echo "🎉 Restarting application with PM2..."
    pm2 restart omnishop-admin
    pm2 save
    echo ""
    echo "✨ Application is now running with all fixes applied!"
    echo "🌐 Visit your domain to see the updated application"
else
    echo ""
    echo "❌ Build failed. Checking for common issues..."
    echo ""
    
    # Check memory
    echo "Memory status:"
    free -h
    
    # Check swap
    echo ""
    echo "Swap status:"
    swapon --show
    
    # Try again with lower memory
    echo ""
    echo "🔄 Retrying with lower memory settings..."
    export NODE_OPTIONS='--max-old-space-size=1536'
    pnpm build
    
    if [ $? -eq 0 ]; then
        echo "✅ Build succeeded with lower memory settings!"
        pm2 restart omnishop-admin
        pm2 save
    else
        echo "❌ Build still failing. Please check the error messages above."
        exit 1
    fi
fi
