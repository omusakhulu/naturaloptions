#!/bin/bash
set -e
source ./devops/config.env

echo "🚀 Deploying $APP_NAME to $SERVER_IP..."

# 1. Sync .env
if [ -f ".env" ]; then
    scp .env $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/.env
fi

# 2. Sync Files
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'devops' \
  --exclude '.windsurfrules' \
  ./ $SERVER_USER@$SERVER_IP:$DEPLOY_PATH

# 3. Remote Build & Verify
ssh -t $SERVER_USER@$SERVER_IP <<REMOTE_SCRIPT
    cd $DEPLOY_PATH

    echo "📦 Installing Dependencies..."
    npm install --legacy-peer-deps

    echo "🧱 Generating Prisma Client..."
    npx prisma generate --schema=./src/prisma/schema.prisma

    echo "🏗️ Building Next.js Application (The Fix)..."
    # This creates the .next directory required for production
    npm run build

    echo "🏗️ Pushing Schema to Database..."
    npx prisma db push --schema=./src/prisma/schema.prisma --accept-data-loss

    echo "🌱 Seeding Database..."
    if [ -f "prisma/seed.js" ]; then
        node prisma/seed.js
    elif [ -f "src/prisma/seed.js" ]; then
        node src/prisma/seed.js
    else
        npm run seed || echo "⚠️ Seed script failed."
    fi

    echo "🔄 Restarting Application with PM2..."
    pm2 restart $APP_NAME || pm2 start npm --name "$APP_NAME" -- start
    pm2 save

    echo "🩺 Verifying Service..."
    sleep 5
    curl -I http://localhost:$APP_PORT
    echo "✅ Deployment & Build Complete!"
REMOTE_SCRIPT
