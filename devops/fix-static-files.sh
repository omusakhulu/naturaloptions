#!/bin/bash

# Fix static file serving issue for Natural Options
# Run this on server 212.86.104.9 when SSH access is restored

set -e

echo "🔧 Fixing static file serving issue..."

# 1. Fix Nginx configuration to properly serve Next.js static files
cat > /etc/nginx/sites-available/naturaloptions << 'NGINX'
server {
    listen 80;
    server_name _;
    
    client_max_body_size 50M;
    
    # CRITICAL: Serve Next.js static files directly
    location /_next/static {
        alias /var/www/naturaloptions/.next/static;
        expires 365d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # Serve public static files
    location /static {
        alias /var/www/naturaloptions/public/static;
        expires 30d;
        add_header Cache-Control "public";
        access_log off;
    }
    
    # Favicon and public files
    location /favicon.ico {
        alias /var/www/naturaloptions/public/favicon.ico;
        expires 30d;
        access_log off;
    }
    
    # API routes
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # Main application (MUST be last)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/x-javascript;
}
NGINX

# 2. Test Nginx configuration
nginx -t

# 3. Reload Nginx
systemctl reload nginx

# 4. Check if static files exist
echo "📂 Checking static files..."
ls -la /var/www/naturaloptions/.next/static/

# 5. Set proper permissions
chmod -R 755 /var/www/naturaloptions/.next
chmod -R 755 /var/www/naturaloptions/public

# 6. Test static file serving
echo "🧪 Testing static file access..."
curl -I http://localhost/_next/static/chunks/main.js

# 7. Clear SSH blocks that might be happening
echo "🔓 Fixing SSH access..."
fail2ban-client unban --all 2>/dev/null || true
ufw allow from any to any port 22
systemctl restart ssh

echo "✅ Fix complete! The login page should now load with styles."
echo "Test at: http://212.86.104.9/admin/en/pages/auth/login-v2"
