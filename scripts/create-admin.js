/**
 * Create First Admin User Script (JavaScript version)
 * Run: node scripts/create-admin.js
 */

const readline = require('readline')

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function createAdmin() {
  console.log('\n🔐 Create Super Admin User\n')
  console.log('This script will create a super admin user for your system.\n')

  try {
    // Get admin details
    const name = await question('Admin Name: ')
    const email = await question('Admin Email: ')
    const password = await question('Admin Password (min 8 chars): ')

    // Validate inputs
    if (!name || !email || !password) {
      console.error('\n❌ All fields are required!')
      process.exit(1)
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(email)) {
      console.error('\n❌ Invalid email format!')
      process.exit(1)
    }

    // Validate password length
    if (password.length < 8) {
      console.error('\n❌ Password must be at least 8 characters!')
      process.exit(1)
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      console.error(`\n❌ User with email ${email} already exists!`)
      process.exit(1)
    }

    // Hash password
    console.log('\n⏳ Hashing password...')
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create admin user
    console.log('⏳ Creating admin user...')

    const admin = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        active: true,
        emailVerified: new Date()
      }
    })

    console.log('\n✅ Super Admin user created successfully!')
    console.log('\n📧 Email:', admin.email)
    console.log('👤 Name:', admin.name)
    console.log('🔑 Role:', admin.role)
    console.log('\n🎉 You can now login at: http://localhost:3000/login\n')
  } catch (error) {
    console.error('\n❌ Error creating admin:', error.message)
    process.exit(1)
  } finally {
    rl.close()
    await prisma.$disconnect()
  }
}

createAdmin()
