const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function createAdmin() {
  console.log('🔐 Creating admin user...')

  try {
    // Hash password
    const password = await bcrypt.hash('admin123', 10)

    // Create admin user
    const admin = await prisma.user.upsert({
      where: { email: 'admin@naturaloptions.com' },
      update: {},
      create: {
        name: 'Admin User',
        email: 'admin@naturaloptions.com',
        password: password,
        role: 'ADMIN',
        active: true,
        image: '/images/avatars/1.png'
      }
    })

    console.log('✅ Admin user created successfully!')
    console.log('\n📧 Login Credentials:')
    console.log('   Email: admin@naturaloptions.com')
    console.log('   Password: admin123')
    console.log('\n🌐 Login at: http://localhost:3000/en/login')

  } catch (error) {
    console.error('❌ Error creating admin:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
