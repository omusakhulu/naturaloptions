#!/bin/bash

# Clean malware
sed -i '/tmp\/nigga/d' /etc/profile /root/.bashrc
sed -i '/tmp\/x86_64/d' /etc/profile /root/.bashrc

# Kill dev server
pkill -f "next dev"

# Create admin user
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
    console.log('Admin user created:', admin.email);
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('Admin user already exists');
    } else {
      throw error;
    }
  }
}

main().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
EOF

node create-admin.js

# Restart PM2 production
pm2 delete all
pm2 start ecosystem.config.js --env production

echo "Login with:"
echo "Email: admin@naturaloptions.com"
echo "Password: admin123"
