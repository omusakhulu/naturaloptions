#!/bin/bash

# Fix blank login page issue for Natural Options
# Server: 212.86.104.9

set -e

DEPLOY_PATH="/var/www/naturaloptions"

echo "🔧 Fixing blank page issue..."

# 1. Check if .next directory exists
if [ ! -d "${DEPLOY_PATH}/.next" ]; then
    echo "❌ .next directory missing - rebuilding application..."
    cd ${DEPLOY_PATH}
    NODE_OPTIONS="--max-old-space-size=2048" npm run build
fi

# 2. Fix environment variables
echo "📝 Updating environment configuration..."
cat > ${DEPLOY_PATH}/.env << 'EOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://naturaloptions_user:NatOpt2024Secure!@localhost:5432/naturaloptions_db?schema=public&connection_limit=10

# NextAuth Configuration
NEXTAUTH_URL=http://212.86.104.9
NEXTAUTH_SECRET=your-secret-key-here-change-this-to-random-string-abc123xyz789
AUTH_URL=http://212.86.104.9
AUTH_TRUST_HOST=true
AUTH_SECRET=your-secret-key-here-change-this-to-random-string-abc123xyz789

# Base Path
BASEPATH=
NEXT_PUBLIC_BASEPATH=

# WooCommerce
WOOCOMMERCE_URL=https://naturaloptions.co.ke
WOOCOMMERCE_CONSUMER_KEY=ck_update_with_actual_key
WOOCOMMERCE_CONSUMER_SECRET=cs_update_with_actual_secret

# Optimization
NODE_OPTIONS=--max-old-space-size=768
PM2_INSTANCES=2
EOF

# 3. Ensure static files are accessible
echo "📂 Checking static file permissions..."
chmod -R 755 ${DEPLOY_PATH}/.next
chmod -R 755 ${DEPLOY_PATH}/public

# 4. Update PM2 configuration to serve static files properly
echo "⚙️ Updating PM2 configuration..."
cat > ${DEPLOY_PATH}/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'naturaloptions-admin',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    instances: 2,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '768M',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      BASEPATH: '',
      NEXTAUTH_URL: 'http://212.86.104.9',
      NODE_OPTIONS: '--max-old-space-size=768'
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true
  }]
}
EOF

# 5. Restart PM2 with new configuration
echo "🔄 Restarting application..."
cd ${DEPLOY_PATH}
pm2 delete all || true
pm2 start ecosystem.config.js --env production
pm2 save

# 6. Update Nginx to properly handle Next.js routing
echo "🌐 Updating Nginx configuration..."
cat > /etc/nginx/sites-available/naturaloptions << 'NGX'
upstream naturaloptions_backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name 212.86.104.9;
    
    client_max_body_size 50M;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/x-javascript;
    
    # Static files
    location /_next/static {
        alias /var/www/naturaloptions/.next/static;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
    
    location /static {
        alias /var/www/naturaloptions/public/static;
        expires 30d;
        add_header Cache-Control "public";
    }
    
    # API routes
    location /api {
        proxy_pass http://naturaloptions_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Main application
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
        
        # Important for Next.js
        proxy_redirect off;
    }
}
NGX

# Restart Nginx
nginx -t && systemctl restart nginx

# 7. Check and display status
echo ""
echo "✅ Fix applied! Checking status..."
echo ""
pm2 list
echo ""
echo "📊 Testing application response..."
curl -I http://localhost:3000

echo ""
echo "🎉 Fix complete! Please try accessing:"
echo "   http://212.86.104.9"
echo ""
echo "If still blank, check logs with:"
echo "   pm2 logs --lines 100"
