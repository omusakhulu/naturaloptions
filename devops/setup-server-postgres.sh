#!/bin/bash

# Natural Options - PostgreSQL Server Setup (Fixed)
# Run this on server: 212.86.104.9

set -e

DEPLOY_PATH="/var/www/naturaloptions"
DB_NAME="naturaloptions_db"
DB_USER="naturaloptions_user"
DB_PASS="NatOpt2024Secure!"

echo "📦 Continuing PostgreSQL setup..."

# Fix PostgreSQL optimization config
PG_VERSION=$(psql --version | awk '{print $3}' | sed 's/\..*$//')
if [ -z "$PG_VERSION" ]; then
    PG_VERSION=16
fi

# Create config directory if it doesn't exist
mkdir -p /etc/postgresql/${PG_VERSION}/main/conf.d/

# Configure PostgreSQL optimization
cat > /etc/postgresql/${PG_VERSION}/main/conf.d/optimization.conf << EOF
# Connection pooling
max_connections = 100
shared_buffers = 256MB

# Performance
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200

# Logging
log_statement = 'none'
log_duration = off
EOF

# Include conf.d in main config if not already
if ! grep -q "include_dir" /etc/postgresql/${PG_VERSION}/main/postgresql.conf; then
    echo "include_dir = 'conf.d'" >> /etc/postgresql/${PG_VERSION}/main/postgresql.conf
fi

# Restart PostgreSQL
systemctl restart postgresql

# Install PM2
npm install -g pm2

# Setup application
echo "🚀 Setting up application..."
cd ${DEPLOY_PATH}

# Install dependencies
NODE_ENV=production npm ci --only=production

# Generate Prisma client
npx prisma generate --schema=./src/prisma/schema.prisma

# Create .env with PostgreSQL
cat > .env << 'ENV'
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://naturaloptions_user:NatOpt2024Secure!@localhost:5432/naturaloptions_db?schema=public&connection_limit=10
NEXTAUTH_URL=http://212.86.104.9:3000
NEXTAUTH_SECRET=generate-secure-random-string-here-minimum-32-chars
AUTH_URL=http://212.86.104.9:3000
AUTH_TRUST_HOST=true
WOOCOMMERCE_URL=https://naturaloptions.co.ke
WOOCOMMERCE_CONSUMER_KEY=ck_update_with_actual_key
WOOCOMMERCE_CONSUMER_SECRET=cs_update_with_actual_secret
NODE_OPTIONS=--max-old-space-size=768
PM2_INSTANCES=2
ENV

# Run migrations
echo "🗄 Running database migrations..."
npx prisma migrate deploy --schema=./src/prisma/schema.prisma || \
npx prisma db push --schema=./src/prisma/schema.prisma

# Start PM2
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup systemd -u root --hp /root

# Configure Nginx
cat > /etc/nginx/sites-available/naturaloptions << 'NGX'
upstream naturaloptions_backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name 212.86.104.9;
    
    client_max_body_size 50M;
    
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
    
    location /_next/static {
        expires 365d;
        add_header Cache-Control "public, immutable";
        proxy_pass http://naturaloptions_backend;
    }
    
    location /api/webhooks {
        proxy_pass http://naturaloptions_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api {
        proxy_pass http://naturaloptions_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location / {
        proxy_pass http://naturaloptions_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
NGX

ln -sf /etc/nginx/sites-available/naturaloptions /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# Configure firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
echo 'y' | ufw enable || true

echo "✅ Setup complete!"
echo ""
echo "Application URL: http://212.86.104.9"
echo ""
pm2 list
