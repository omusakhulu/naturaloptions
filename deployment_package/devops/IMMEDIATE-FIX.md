# IMMEDIATE FIX: Blank Page Issue

## Problem
The page loads HTML but appears blank - JavaScript/CSS files aren't loading properly.

## Access Your VPS Console
Since SSH is blocked, use your VPS provider's console:
- Login to your VPS provider (Kamatera/DigitalOcean/etc)
- Access server console/terminal

## Run These Commands in Console

### 1. Fix Nginx Static File Serving
```bash
cat > /etc/nginx/sites-available/naturaloptions << 'EOF'
server {
    listen 80;
    server_name _;
    
    # Serve Next.js static files DIRECTLY
    location ~ ^/_next/static/(.*)$ {
        root /var/www/naturaloptions;
        try_files /.next/static/$1 =404;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
    
    # Main app
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

systemctl reload nginx
```

### 2. Check Static Files Exist
```bash
ls -la /var/www/naturaloptions/.next/static/chunks/
```

If empty, rebuild:
```bash
cd /var/www/naturaloptions
rm -rf .next
NODE_OPTIONS="--max-old-space-size=1500" npm run build
```

### 3. Restart PM2
```bash
cd /var/www/naturaloptions
pm2 restart all
```

### 4. Test It Works
```bash
# Should return JavaScript content, not HTML
curl http://localhost/_next/static/chunks/main.js | head -c 50
```

### 5. Fix SSH Access
```bash
# Clear blocks
fail2ban-client unban --all
iptables -F
ufw allow 22
systemctl restart ssh
```

## Alternative Quick Fix

If above doesn't work, switch to development mode temporarily:

```bash
cd /var/www/naturaloptions
pm2 delete all
NODE_ENV=development pm2 start npm --name app -- run dev
```

Then visit: http://212.86.104.9:3000

## Check Browser Console
Press F12 in browser and check Console tab for errors. Common issues:
- 404 errors for JS/CSS files = Nginx config issue
- MIME type errors = Files being served as HTML
- Network errors = Firewall blocking

**Run the Nginx fix first - that's likely the issue!**
