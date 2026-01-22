const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function createUsersForAllRoles() {
  console.log('🔐 Creating users for all roles...\n')

  try {
    // Hash password (same for all users for easy testing)
    const password = await bcrypt.hash('password123', 10)

    // Define users for each role
    const users = [
      {
        name: 'Super Admin',
        email: 'superadmin@naturaloptions.com',
        password,
        role: 'SUPER_ADMIN',
        active: true,
        image: '/images/avatars/1.png'
      },
      {
        name: 'Admin User',
        email: 'admin@naturaloptions.com',
        password,
        role: 'ADMIN',
        active: true,
        image: '/images/avatars/2.png'
      },
      {
        name: 'Manager User',
        email: 'manager@naturaloptions.com',
        password,
        role: 'MANAGER',
        active: true,
        image: '/images/avatars/3.png'
      },
      {
        name: 'Sales User',
        email: 'sales@naturaloptions.com',
        password,
        role: 'SALES',
        active: true,
        image: '/images/avatars/4.png'
      },
      {
        name: 'Regular User',
        email: 'user@naturaloptions.com',
        password,
        role: 'USER',
        active: true,
        image: '/images/avatars/5.png'
      }
    ]

    // Create each user
    for (const userData of users) {
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {},
        create: userData
      })

      console.log(`✅ Created ${user.role}: ${user.name} (${user.email})`)
    }

    console.log('\n✅ All role users created successfully!')
    console.log('\n📧 Login Credentials (All users):')
    console.log('   Password: password123')
    console.log('\n📋 User List:')
    console.log('   🛡️  Super Admin: superadmin@naturaloptions.com')
    console.log('   🔐 Admin: admin@naturaloptions.com')
    console.log('   💼 Manager: manager@naturaloptions.com')
    console.log('   🛒 Sales: sales@naturaloptions.com')
    console.log('   👤 User: user@naturaloptions.com')
    console.log('\n🌐 Login at: http://localhost:3000/en/login')

  } catch (error) {
    console.error('❌ Error creating users:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

createUsersForAllRoles()
