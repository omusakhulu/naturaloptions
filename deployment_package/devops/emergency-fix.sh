#!/bin/bash

# Natural Options - Emergency Fix Script
# This script fixes the blank page issue and gets the application running
# Run this on server 212.86.104.9 via console access

set -e

echo "🚨 Emergency Fix for Natural Options Platform"
echo "============================================"

DEPLOY_PATH="/var/www/naturaloptions"

# 1. Navigate to application directory
cd ${DEPLOY_PATH}

# 2. Check current status
echo "📊 Current Status:"
pm2 status || echo "PM2 not running"

# 3. Ensure all dependencies are installed
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps --ignore-scripts

# 4. Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate --schema=./src/prisma/schema.prisma

# 5. Build the application
echo "🏗️ Building application..."
NODE_OPTIONS="--max-old-space-size=2048" npm run build

# 6. Create proper environment file
echo "📝 Setting environment variables..."
cat > .env << 'ENV'
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://naturaloptions_user:NatOpt2024Secure!@localhost:5432/naturaloptions_db?schema=public
NEXTAUTH_URL=http://212.86.104.9
NEXTAUTH_SECRET=super-secret-key-change-me-to-random-string-xyz789abc123
AUTH_URL=http://212.86.104.9
AUTH_TRUST_HOST=true
AUTH_SECRET=super-secret-key-change-me-to-random-string-xyz789abc123
BASEPATH=
NEXT_PUBLIC_BASEPATH=
NODE_OPTIONS=--max-old-space-size=768
PM2_INSTANCES=2
ENV

# 7. Run database migrations
echo "🗄️ Running database migrations..."
npx prisma db push --schema=./src/prisma/schema.prisma

# 8. Stop any existing PM2 processes
echo "⏹️ Stopping existing processes..."
pm2 delete all 2>/dev/null || true

# 9. Start application with PM2
echo "🚀 Starting application..."
pm2 start ecosystem.config.js --env production

# 10. Save PM2 configuration
pm2 save
pm2 startup systemd -u root --hp /root

# 11. Fix Nginx configuration
echo "🌐 Updating Nginx..."
cat > /etc/nginx/sites-available/naturaloptions << 'NGINX'
server {
    listen 80;
    server_name 212.86.104.9;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    client_max_body_size 50M;
    
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
}
NGINX

# 12. Enable site and restart Nginx
ln -sf /etc/nginx/sites-available/naturaloptions /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# 13. Check application response
echo ""
echo "✅ Testing application..."
sleep 5
curl -I http://localhost:3000

# 14. Show PM2 logs
echo ""
echo "📝 Application logs:"
pm2 logs --lines 20 --nostream

# 15. Fix SSH access
echo ""
echo "🔓 Fixing SSH access..."
# Clear fail2ban blocks
fail2ban-client unban --all 2>/dev/null || true
# Ensure SSH is allowed
ufw allow 22/tcp
ufw reload
systemctl restart ssh

echo ""
echo "✅ ========================================="
echo "✅ EMERGENCY FIX COMPLETE!"
echo "✅ ========================================="
echo ""
echo "Application should now be accessible at:"
echo "  http://212.86.104.9"
echo ""
echo "Login page:"
echo "  http://212.86.104.9/admin/en/pages/auth/login-v2"
echo ""
echo "If still having issues, check:"
echo "  pm2 logs --lines 100"
echo "  journalctl -u nginx -n 50"
echo ""
echo "SSH access should be restored. Try connecting again."
