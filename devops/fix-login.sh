#!/bin/bash

# Fix login issues for Natural Options
# Run this on server 212.86.104.9

set -e

echo "🔧 Fixing login issues..."

# 1. Clean malware from bash files
echo "🧹 Removing malware entries..."
sed -i '/tmp\/nigga/d' /etc/profile /root/.bashrc
sed -i '/tmp\/x86_64/d' /etc/profile /root/.bashrc

# 2. Kill dev server and fix PM2
echo "⏹️ Stopping dev server..."
pkill -f "next dev" || true
pm2 delete all || true

# 3. Create admin user in database
echo "👤 Creating admin user..."
cd /var/www/naturaloptions

cat > create-admin.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  try {
    const admin = await prisma.user.create({
      data: {
        email: 'admin@naturaloptions.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN',
        active: true,
        emailVerified: new Date()
      }
    });
    console.log('✅ Admin user created:', admin.email);
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('Admin user already exists');
    } else {
      throw error;
    }
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
EOF

node create-admin.js

# 4. Fix environment variables
echo "📝 Updating environment..."
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://naturaloptions_user:NatOpt2024Secure!@localhost:5432/naturaloptions_db?schema=public

# Auth - IMPORTANT: These must match
NEXTAUTH_URL=http://212.86.104.9
NEXTAUTH_SECRET=your-secret-key-here-at-least-32-characters-long
AUTH_URL=http://212.86.104.9
AUTH_SECRET=your-secret-key-here-at-least-32-characters-long
AUTH_TRUST_HOST=true

# Remove basepath for clean URLs
BASEPATH=
NEXT_PUBLIC_BASEPATH=

# Optimization
NODE_OPTIONS=--max-old-space-size=768
EOF

# 5. Start production server
echo "🚀 Starting production server..."
pm2 start ecosystem.config.js --env production
pm2 save

# 6. Show status
echo ""
echo "✅ Fix complete!"
echo ""
echo "Login credentials:"
echo "  Email: admin@naturaloptions.com"
echo "  Password: admin123"
echo ""
echo "URL: http://212.86.104.9"
echo ""
pm2 status
