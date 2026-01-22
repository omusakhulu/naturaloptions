# URGENT: Get Natural Options Running on 212.86.104.9

## SSH is Blocked - Use VPS Console

### Step 1: Access Server Console
Login to your VPS provider's control panel and access the server console/terminal directly (not SSH).

### Step 2: Run This Complete Fix

Copy and paste these commands in the console:

```bash
cd /var/www/naturaloptions

# Fix NPM dependencies
npm install --legacy-peer-deps --ignore-scripts

# Generate Prisma
npx prisma generate --schema=./src/prisma/schema.prisma

# Build the application
NODE_OPTIONS="--max-old-space-size=2048" npm run build

# Create correct environment file
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://naturaloptions_user:NatOpt2024Secure!@localhost:5432/naturaloptions_db?schema=public
NEXTAUTH_URL=http://212.86.104.9
NEXTAUTH_SECRET=change-this-to-a-very-long-random-string-at-least-32-characters
AUTH_URL=http://212.86.104.9
AUTH_TRUST_HOST=true
BASEPATH=
EOF

# Push database schema
npx prisma db push --schema=./src/prisma/schema.prisma

# Restart PM2
pm2 delete all
pm2 start ecosystem.config.js --env production
pm2 save

# Fix Nginx
cat > /etc/nginx/sites-available/naturaloptions << 'EOF'
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/naturaloptions /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
systemctl restart nginx

# Test it
curl -I http://localhost:3000
pm2 logs --lines 50
```

### Step 3: Fix SSH Access

```bash
# Unblock SSH
ufw allow from any to any port 22
fail2ban-client unban --all
systemctl restart ssh
```

## Alternative: Upload Fixed Build via FTP/SFTP

If you have FTP/SFTP access through your VPS provider:

1. Download: https://transfer.sh/[upload-link] (I'll create this)
2. Upload to server `/tmp/fixed-build.tar.gz`
3. Run in console:
```bash
cd /var/www/naturaloptions
tar xzf /tmp/fixed-build.tar.gz
pm2 restart all
```

## Check if Working

Visit: **http://212.86.104.9**

You should see the login page. If not, check logs:
```bash
pm2 logs --err --lines 100
```
