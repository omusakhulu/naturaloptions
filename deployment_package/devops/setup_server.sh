#!/bin/bash
set -e
source ./devops/config.env

echo "🚧 Connecting to $SERVER_IP to fix Nginx..."

ssh -t $SERVER_USER@$SERVER_IP <<REMOTE_SCRIPT
    # Ensure Nginx is installed
    apt-get install -y nginx

    # Create the Nginx config with properly escaped variables
    cat > /etc/nginx/sites-available/$APP_NAME <<NGINX_CONF
server {
    listen 80;
    server_name $SERVER_IP;

    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX_CONF

    # Enable site and test
    ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl reload nginx
    echo "✅ Nginx is now correctly configured."
REMOTE_SCRIPT
