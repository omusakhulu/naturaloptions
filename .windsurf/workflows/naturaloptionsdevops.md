Phase 1: Local Authentication Setup
Before creating the scripts, you must enable passwordless login so Windsurf's AI agent can run commands without getting stuck at a password prompt.

Open the Windsurf Terminal (Ctrl + ~).

Run this command (type your current password one last time):

Bash

ssh-copy-id root@212.115.108.89
Verify: Type ssh root@212.115.108.89. If you log in without a password, you are ready. Exit the server to return to Windsurf (exit).

Phase 2: Create the DevOps Directory & Files
Create a folder named devops in the root of your naturaloptions project. Create the following 4 files inside it.

1. devops/config.env
Control center for your settings. Change APP_SUBFOLDER if you are deploying inside a subdirectory (e.g., /api or /client), otherwise leave it empty.

Bash

# Connection Details
SERVER_IP="212.115.108.89"
SERVER_USER="root"
APP_NAME="naturaloptions"

# Deployment Paths
# Base directory where all apps live
REMOTE_BASE_DIR="/var/www"
# Specific subfolder for this deployment (leave empty "" for root of app)
APP_SUBFOLDER="" 

# Computed Path (Do not change)
DEPLOY_PATH="${REMOTE_BASE_DIR}/${APP_NAME}/${APP_SUBFOLDER}"
2. devops/setup_server.sh
Run this once on a brand new VPS. It creates the environment.

Bash

#!/bin/bash
set -e
source ./devops/config.env

echo "🚧 Connecting to $SERVER_IP to provision infrastructure..."

ssh -t $SERVER_USER@$SERVER_IP <<EOF
    # 1. System Updates
    echo "Updating system packages..."
    export DEBIAN_FRONTEND=noninteractive
    apt-get update && apt-get upgrade -y

    # 2. Install Core Tools (Nginx, Git, UFW, Curl, Unzip)
    apt-get install -y nginx git curl ufw unzip

    # 3. Security: Firewall Setup
    ufw allow OpenSSH
    ufw allow 'Nginx Full'
    # Only enable if not already enabled to avoid lockout risk
    ufw --force enable

    # 4. Install Runtime (Node.js 20 LTS & PM2)
    # Change this section if you need Python/Go/PHP instead
    if ! command -v node &> /dev/null; then
        echo "Installing Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
        npm install -g pm2
    fi

    # 5. Directory Structure
    echo "Creating directory: $DEPLOY_PATH"
    mkdir -p $DEPLOY_PATH
    
    # Ownership (ensure root owns /var/www, but we have access)
    chown -R $SERVER_USER:$SERVER_USER $REMOTE_BASE_DIR

    # 6. Nginx Configuration (Basic Reverse Proxy)
    # Creates a default config pointing to port 3000
    cat > /etc/nginx/sites-available/$APP_NAME <<EOL
server {
    listen 80;
    server_name $SERVER_IP;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL
    
    # Enable Site
    ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl reload nginx

    echo "✅ Server Provisioned Successfully!"
EOF
3. devops/deploy.sh
Run this whenever you edit code.

Bash

#!/bin/bash
set -e
source ./devops/config.env

echo "🚀 Deploying $APP_NAME to $SERVER_IP..."

# 1. Sync Files (Rsync)
# This respects subfolders and excludes garbage files
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.env' \
  --exclude 'devops' \
  --exclude '.windsurfrules' \
  ./ $SERVER_USER@$SERVER_IP:$DEPLOY_PATH

# 2. Remote Build & Restart
ssh -t $SERVER_USER@$SERVER_IP <<EOF
    cd $DEPLOY_PATH

    echo "📦 Installing Dependencies..."
    # Detect package manager
    if [ -f "package.json" ]; then
        npm install --production
    elif [ -f "requirements.txt" ]; then
        pip install -r requirements.txt
    fi

    echo "🔄 Restarting Application..."
    # If PM2 is used (Node.js)
    if command -v pm2 &> /dev/null; then
        pm2 restart $APP_NAME || pm2 start npm --name "$APP_NAME" -- start
        pm2 save
    else
        # Fallback or other restart command
        systemctl restart nginx
    fi

    echo "✅ Deployment Complete at http://$SERVER_IP"
EOF
4. Make Scripts Executable
In your Windsurf terminal, run:

Bash

chmod +x devops/setup_server.sh devops/deploy.sh
Phase 3: Windsurf Integration
Create a file in your project root named .windsurfrules. This allows you to speak naturally to Cascade.

File: .windsurfrules

Markdown

# DevOps Capabilities

## Infrastructure
If I ask to "setup the server", "provision vps", or "initialize environment":
1.  Read `devops/config.env` to confirm the target IP.
2.  Execute `./devops/setup_server.sh` in the terminal.
3.  Monitor the output for permission errors.

## Deployment
If I ask to "deploy", "ship it", or "update the site":
1.  Ensure I have saved my changes.
2.  Execute `./devops/deploy.sh` in the terminal.
3.  If the rsync step fails, suggest checking the SSH connection.

## Troubleshooting
If a deployment fails:
1.  Analyze the terminal output.
2.  If it is an SSH error, remind me to check `ssh-copy-id`.
3.  If it is a Node/Python error, check the remote logs via `ssh root@212.115.108.89 'pm2 logs'`.
Phase 4: How to Use It
You can now use the Cascade chat window on the right side of Windsurf to control your infrastructure.

For the Brand New Server:

You type: "Initialize the new VPS."

Windsurf does: Connects to 212.115.108.89, installs Nginx/Node/Firewall, and sets up the folder structure.

For Daily Updates:

You type: "Deploy the app."

Windsurf does: Uploads only the changed files to the subfolder defined in your config and restarts the app.