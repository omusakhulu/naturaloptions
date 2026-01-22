# Deploying to IP with Subfolder (e.g., http://1.2.3.4/admin)

To deploy this application to a specific subfolder on a server using an IP address, follow these steps.

## 1. Application Configuration

The `next.config.mjs` is already configured to use the `BASEPATH` environment variable:

```javascript
basePath: process.env.BASEPATH,
```

### Environment Variables (.env)
On your server, your `.env` file must include:

```env
# The subfolder path (MUST start with / and NOT end with /)
# Example: if you want http://1.2.3.4/admin, use /admin
BASEPATH=/admin

# The full URL including the subfolder
NEXTAUTH_URL=http://your_vps_ip/admin

# Other required vars
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
NEXTAUTH_SECRET=your_generated_secret
NODE_ENV=production
```

## 2. Nginx Configuration

You need to configure Nginx to proxy requests from the subfolder to the Next.js application (running on port 3000 by default).

Edit your Nginx site configuration (e.g., `/etc/nginx/sites-available/default` or a new file):

```nginx
server {
    listen 80;
    server_name _; # Matches any request (IP or domain)

    # Proxy the subfolder to the Next.js app
    location /admin {
        proxy_pass http://localhost:3000/admin;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Important headers for Next.js/NextAuth
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Optional: Static files optimization if needed
    location /admin/_next/static {
        proxy_pass http://localhost:3000/admin/_next/static;
        proxy_cache_valid 60m;
        access_log off;
    }
}
```

## 3. Deployment Steps

1.  **Clone & Install**:
    ```bash
    git clone <your-repo> /var/www/my-app
    cd /var/www/my-app
    pnpm install
    ```

2.  **Build**:
    Ensure `BASEPATH` is set during the build phase if you are building on the server:
    ```bash
    export BASEPATH=/admin
    pnpm run build
    ```

3.  **Run with PM2**:
    ```bash
    pm2 start ecosystem.config.js --env production
    ```

## 4. Middleware Considerations
Next.js middleware automatically respects the `basePath`. You don't need to manually prepend `/admin` to your route checks in `src/middleware.ts` as `request.nextUrl.pathname` will be relative to the `basePath`.
