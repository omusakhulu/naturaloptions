# Natural Options Platform - Manual Deployment Guide

## Server Details
- **IP Address**: 102.212.246.251
- **Username**: root
- **Password**: MotherFuckerJones2026!

## Quick Deploy Steps

### Step 1: Connect to Server
```bash
ssh root@102.212.246.251
# Enter password when prompted: MotherFuckerJones2026!
```

### Step 2: Run Server Setup Script
Once connected, run these commands:

```bash
# Download and run the setup script
wget https://raw.githubusercontent.com/your-repo/naturaloptions/main/devops/server-setup.sh
bash server-setup.sh
```

Or manually run these commands:

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PM2
npm install -g pm2

# Install MongoDB
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update && apt install -y mongodb-org
systemctl start mongod && systemctl enable mongod

# Install Nginx
apt install -y nginx

# Create app directory
mkdir -p /var/www/naturaloptions
cd /var/www/naturaloptions
```

### Step 3: Upload Application Files

From your local machine, create and upload the deployment package:

```bash
# On your local machine (in project directory)
tar czf deploy.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=.next/cache \
  --exclude=playwright-report \
  --exclude=test-results \
  .

# Upload to server
scp deploy.tar.gz root@102.212.246.251:/var/www/naturaloptions/
```

### Step 4: Extract and Install on Server

Back on the server:

```bash
cd /var/www/naturaloptions
tar xzf deploy.tar.gz
rm deploy.tar.gz

# Install dependencies
NODE_ENV=production npm ci --only=production

# Generate Prisma client
npx prisma generate --schema=./src/prisma/schema.prisma
```

### Step 5: Configure Environment

Create the `.env` file:

```bash
cat > /var/www/naturaloptions/.env << 'EOF'
# Application
NODE_ENV=production
PORT=3000
NEXTAUTH_URL=http://102.212.246.251:3000
NEXTAUTH_SECRET=generate-a-secure-random-string-here
AUTH_URL=http://102.212.246.251:3000
AUTH_TRUST_HOST=true
AUTH_SECRET=generate-a-secure-random-string-here

# Database
DATABASE_URL=mongodb://localhost:27017/naturaloptions_db?maxPoolSize=10&minPoolSize=2

# WooCommerce Integration
WOOCOMMERCE_URL=https://naturaloptions.co.ke
WOOCOMMERCE_CONSUMER_KEY=ck_[YOUR_KEY_HERE]
WOOCOMMERCE_CONSUMER_SECRET=cs_[YOUR_SECRET_HERE]
WOOCOMMERCE_WEBHOOK_SECRET=[YOUR_WEBHOOK_SECRET]

# Payment Gateways - Stripe
STRIPE_PUBLIC_KEY=pk_test_[YOUR_KEY]
STRIPE_SECRET_KEY=sk_test_[YOUR_KEY]
STRIPE_WEBHOOK_SECRET=whsec_[YOUR_SECRET]

# Payment Gateway - PayPal
PAYPAL_CLIENT_ID=[YOUR_CLIENT_ID]
PAYPAL_CLIENT_SECRET=[YOUR_SECRET]
PAYPAL_MODE=sandbox

# Payment Gateway - M-Pesa (Kenya)
MPESA_CONSUMER_KEY=[YOUR_KEY]
MPESA_CONSUMER_SECRET=[YOUR_SECRET]
MPESA_PASSKEY=[YOUR_PASSKEY]
MPESA_SHORTCODE=174379
MPESA_ENVIRONMENT=sandbox

# Optimizations
NODE_OPTIONS=--max-old-space-size=768
PM2_INSTANCES=2
EOF
```

### Step 6: Configure Nginx

```bash
cat > /etc/nginx/sites-available/naturaloptions << 'EOF'
server {
    listen 80;
    server_name 102.212.246.251;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOF

ln -sf /etc/nginx/sites-available/naturaloptions /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
```

### Step 7: Start Application with PM2

```bash
cd /var/www/naturaloptions
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup systemd -u root --hp /root
```

### Step 8: Configure Firewall

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
echo 'y' | ufw enable
```

## Verification Commands

```bash
# Check PM2 status
pm2 list
pm2 logs

# Check application health
curl http://localhost:3000/api/health

# Check MongoDB
systemctl status mongod

# Check Nginx
systemctl status nginx
```

## Access URLs

- **Application**: http://102.212.246.251
- **API Health**: http://102.212.246.251/api/health
- **WooCommerce Webhook**: http://102.212.246.251/api/webhooks/woocommerce

## WooCommerce Integration Setup

1. Log into your WordPress admin panel at https://naturaloptions.co.ke/wp-admin
2. Go to WooCommerce → Settings → Advanced → REST API
3. Generate API keys and update the `.env` file
4. Go to WooCommerce → Settings → Advanced → Webhooks
5. Create webhooks for:
   - Order Created → http://102.212.246.251/api/webhooks/woocommerce
   - Order Updated → http://102.212.246.251/api/webhooks/woocommerce
   - Product Created → http://102.212.246.251/api/webhooks/woocommerce
   - Product Updated → http://102.212.246.251/api/webhooks/woocommerce

## Payment Gateway Configuration

### Stripe
1. Get your keys from https://dashboard.stripe.com
2. Update the `.env` file with your keys
3. Set webhook endpoint: http://102.212.246.251/api/webhooks/stripe

### PayPal
1. Get credentials from https://developer.paypal.com
2. Update the `.env` file
3. Configure webhook: http://102.212.246.251/api/webhooks/paypal

### M-Pesa (Kenya)
1. Register at https://developer.safaricom.co.ke
2. Get your API credentials
3. Update the `.env` file
4. Configure callback URL: http://102.212.246.251/api/webhooks/mpesa

## Troubleshooting

### If the application doesn't start:
```bash
pm2 logs --err
cd /var/www/naturaloptions && npm run build
```

### If database connection fails:
```bash
mongosh
use naturaloptions_db
db.createUser({user: "app", pwd: "password", roles: [{role: "readWrite", db: "naturaloptions_db"}]})
```

### If Nginx shows 502 error:
```bash
pm2 restart all
nginx -t && systemctl restart nginx
```

## Monitoring

```bash
# Real-time monitoring
pm2 monit

# View logs
pm2 logs

# Resource usage
htop

# Database status
mongosh --eval "db.serverStatus()"
```
