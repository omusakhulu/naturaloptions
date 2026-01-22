#!/bin/bash
set -e

DEPLOY_PATH="/var/www/naturaloptions"
DB_NAME="naturaloptions_db"
DB_USER="naturaloptions_user"
DB_PASS="NatOpt2024Secure!"

echo "Starting PostgreSQL deployment setup..."

# Update system
apt update
DEBIAN_FRONTEND=noninteractive apt upgrade -y

# Install essentials
apt install -y curl wget git build-essential nginx software-properties-common

# Install Node.js 20 if not present
if ! node --version 2>/dev/null | grep -q "v20"; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

# Install PostgreSQL 16
echo "Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib postgresql-client

# Start and enable PostgreSQL
systemctl enable postgresql
systemctl start postgresql

# Configure PostgreSQL
echo "Configuring PostgreSQL database..."
sudo -u postgres psql << EOF
-- Drop existing database if exists
DROP DATABASE IF EXISTS ${DB_NAME};
DROP USER IF EXISTS ${DB_USER};

-- Create user and database
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';
CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};

-- Grant schema permissions
\c ${DB_NAME}
GRANT ALL ON SCHEMA public TO ${DB_USER};
EOF

# Configure PostgreSQL for optimal performance
cat > /etc/postgresql/*/main/conf.d/optimization.conf << EOF
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

# Restart PostgreSQL to apply changes
systemctl restart postgresql

# Install PM2
npm install -g pm2

# Setup application directory
echo "Setting up application..."
mkdir -p ${DEPLOY_PATH}
cd ${DEPLOY_PATH}

# Extract application
tar xzf /tmp/deployment.tar.gz
rm /tmp/deployment.tar.gz

# Install dependencies
echo "Installing dependencies..."
NODE_ENV=production npm ci --only=production

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate --schema=./src/prisma/schema.prisma

# Create environment file with PostgreSQL connection
echo "Creating environment configuration..."
cat > .env << 'ENV'
# Application
NODE_ENV=production
PORT=3000

# Database - PostgreSQL with connection pooling
DATABASE_URL=postgresql://naturaloptions_user:NatOpt2024Secure!@localhost:5432/naturaloptions_db?schema=public&connection_limit=10

# NextAuth
NEXTAUTH_URL=http://212.86.104.9:3000
NEXTAUTH_SECRET=generate-secure-random-string-here-minimum-32-chars
AUTH_URL=http://212.86.104.9:3000
AUTH_TRUST_HOST=true
AUTH_SECRET=generate-secure-random-string-here-minimum-32-chars

# WooCommerce Integration
WOOCOMMERCE_URL=https://naturaloptions.co.ke
WOOCOMMERCE_CONSUMER_KEY=ck_your_consumer_key_here
WOOCOMMERCE_CONSUMER_SECRET=cs_your_consumer_secret_here
WOOCOMMERCE_WEBHOOK_SECRET=your_webhook_secret_here

# Payment Gateway - Stripe
STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret

# Payment Gateway - PayPal
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox

# Payment Gateway - M-Pesa (Kenya)
MPESA_CONSUMER_KEY=your_mpesa_consumer_key
MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
MPESA_PASSKEY=your_mpesa_passkey
MPESA_SHORTCODE=174379
MPESA_ENVIRONMENT=sandbox

# Email Configuration
EMAIL_FROM=noreply@naturaloptions.co.ke
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Optimization
NODE_OPTIONS=--max-old-space-size=768 --optimize-for-size
PM2_INSTANCES=2
ENV

# Run Prisma migrations
echo "Running database migrations..."
npx prisma migrate deploy --schema=./src/prisma/schema.prisma || \
npx prisma db push --schema=./src/prisma/schema.prisma

# Seed database if seed file exists
if [ -f "prisma/seed.js" ]; then
    echo "Seeding database..."
    node prisma/seed.js || true
fi

# Start PM2
echo "Starting application with PM2..."
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup systemd -u root --hp /root || true

# Configure Nginx with caching
echo "Configuring Nginx..."
mkdir -p /var/cache/nginx
cat > /etc/nginx/sites-available/naturaloptions << 'NGX'
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=app_cache:10m max_size=100m inactive=60m;

upstream naturaloptions_backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name 185.181.8.53;
    
    client_max_body_size 50M;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
    
    # Static files caching
    location /_next/static {
        expires 365d;
        add_header Cache-Control "public, immutable";
        proxy_cache app_cache;
        proxy_pass http://naturaloptions_backend;
    }
    
    # WooCommerce webhook endpoint
    location /api/webhooks/woocommerce {
        proxy_pass http://naturaloptions_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # Payment gateway webhooks
    location ~ ^/api/webhooks/(stripe|paypal|mpesa) {
        proxy_pass http://naturaloptions_backend;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # API endpoints
    location /api {
        proxy_pass http://naturaloptions_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
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
        
        # Cache HTML for 10 minutes
        proxy_cache app_cache;
        proxy_cache_valid 200 10m;
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
ufw allow 5432/tcp  # PostgreSQL
echo 'y' | ufw enable || true

# Create monitoring script
cat > ${DEPLOY_PATH}/monitor.sh << 'MONITOR'
#!/bin/bash
echo "=== Natural Options Status ==="
echo ""
echo "PM2 Status:"
pm2 list
echo ""
echo "PostgreSQL Status:"
sudo -u postgres psql -c "SELECT datname, numbackends FROM pg_stat_database WHERE datname = 'naturaloptions_db';"
echo ""
echo "Memory Usage:"
free -h
echo ""
echo "Nginx Status:"
systemctl status nginx --no-pager | head -5
MONITOR
chmod +x ${DEPLOY_PATH}/monitor.sh

echo "✅ Deployment complete!"
echo ""
echo "Application running at: http://185.181.8.53"
echo ""
pm2 list
