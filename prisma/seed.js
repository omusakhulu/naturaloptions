const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Hash password for all users
  const password = await bcrypt.hash('password123', 10)

  // Create users for each role
  const users = [
    // Super Admins
    {
      name: 'Super Admin User',
      email: 'superadmin@omnishop.com',
      password,
      role: 'SUPER_ADMIN',
      active: true,
      image: '/images/avatars/1.png'
    },

    // Admins
    {
      name: 'Admin User',
      email: 'admin@omnishop.com',
      password,
      role: 'ADMIN',
      active: true,
      image: '/images/avatars/2.png'
    },
    {
      name: 'John Administrator',
      email: 'john.admin@omnishop.com',
      password,
      role: 'ADMIN',
      active: true,
      image: '/images/avatars/3.png'
    },

    // Managers
    {
      name: 'Sarah Manager',
      email: 'sarah.manager@omnishop.com',
      password,
      role: 'MANAGER',
      active: true,
      image: '/images/avatars/4.png'
    },
    {
      name: 'Mike Operations',
      email: 'mike.ops@omnishop.com',
      password,
      role: 'MANAGER',
      active: true,
      image: '/images/avatars/5.png'
    },
    {
      name: 'Lisa Project Manager',
      email: 'lisa.pm@omnishop.com',
      password,
      role: 'MANAGER',
      active: true,
      image: '/images/avatars/6.png'
    },

    // Sales Staff
    {
      name: 'David Sales',
      email: 'david.sales@omnishop.com',
      password,
      role: 'SALES',
      active: true,
      image: '/images/avatars/7.png'
    },
    {
      name: 'Emma Thompson',
      email: 'emma.sales@omnishop.com',
      password,
      role: 'SALES',
      active: true,
      image: '/images/avatars/8.png'
    },
    {
      name: 'Robert Wilson',
      email: 'robert.sales@omnishop.com',
      password,
      role: 'SALES',
      active: true,
      image: '/images/avatars/2.png'
    },
    {
      name: 'Jennifer Brown',
      email: 'jennifer.sales@omnishop.com',
      password,
      role: 'SALES',
      active: true,
      image: '/images/avatars/3.png'
    },

    // Regular Users
    {
      name: 'Tom Field Worker',
      email: 'tom.field@omnishop.com',
      password,
      role: 'USER',
      active: true,
      image: '/images/avatars/4.png'
    },
    {
      name: 'James Driver',
      email: 'james.driver@omnishop.com',
      password,
      role: 'USER',
      active: true,
      image: '/images/avatars/5.png'
    },
    {
      name: 'Maria Garcia',
      email: 'maria.user@omnishop.com',
      password,
      role: 'USER',
      active: true,
      image: '/images/avatars/6.png'
    },
    {
      name: 'Carlos Martinez',
      email: 'carlos.user@omnishop.com',
      password,
      role: 'USER',
      active: true,
      image: '/images/avatars/7.png'
    },
    {
      name: 'Ana Rodriguez',
      email: 'ana.user@omnishop.com',
      password,
      role: 'USER',
      active: true,
      image: '/images/avatars/8.png'
    }
  ]

  // Create each user
  for (const userData of users) {
    try {
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {},
        create: userData
      })
      
      console.log(`✅ Created ${user.role}: ${user.name} (${user.email})`)
    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error.message)
    }
  }

  console.log('\n📊 User Summary:')
  const userCounts = await prisma.user.groupBy({
    by: ['role'],
    _count: true
  })

  userCounts.forEach(({ role, _count }) => {
    console.log(`   ${role}: ${_count} users`)
  })

  console.log('\n✅ Database seed completed!')
  console.log('\n🔑 Login Credentials:')
  console.log('   Email: any of the emails above')
  console.log('   Password: password123')
  console.log('\n📧 Example logins:')
  console.log('   Super Admin: superadmin@omnishop.com')
  console.log('   Admin: admin@omnishop.com')
  console.log('   Manager: sarah.manager@omnishop.com')
  console.log('   Sales: david.sales@omnishop.com')
  console.log('   User: tom.field@omnishop.com')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
