const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seedPOSData() {
  try {
    console.log('🌱 Seeding POS and Accounting data...')

    // Create locations
    const mainLocation = await prisma.location.upsert({
      where: { id: 'main-store' },
      update: {},
      create: {
        id: 'main-store',
        name: 'Main Store',
        address: '123 Main St',
        city: 'Anytown',
        state: 'ST',
        zipCode: '12345',
        phone: '(555) 123-4567',
        isMainLocation: true,
        isActive: true
      }
    })

    const northBranch = await prisma.location.upsert({
      where: { id: 'north-branch' },
      update: {},
      create: {
        id: 'north-branch',
        name: 'North Branch',
        address: '456 North Ave',
        city: 'Northtown',
        state: 'ST',
        zipCode: '12346',
        phone: '(555) 234-5678',
        isMainLocation: false,
        isActive: true
      }
    })

    // Create POS Terminals
    await prisma.pOSTerminal.upsert({
      where: { id: 'terminal-1' },
      update: {},
      create: {
        id: 'terminal-1',
        name: 'Main Register',
        locationId: mainLocation.id,
        isActive: true
      }
    })

    await prisma.pOSTerminal.upsert({
      where: { id: 'terminal-2' },
      update: {},
      create: {
        id: 'terminal-2',
        name: 'Mobile POS 1',
        locationId: mainLocation.id,
        isActive: true
      }
    })

    // Create Chart of Accounts
    const assets = await prisma.chartOfAccounts.upsert({
      where: { accountCode: '1000' },
      update: {},
      create: {
        accountCode: '1000',
        accountName: 'Cash and Cash Equivalents',
        accountType: 'ASSET',
        isActive: true
      }
    })

    await prisma.chartOfAccounts.upsert({
      where: { accountCode: '1001' },
      update: {},
      create: {
        accountCode: '1001',
        accountName: 'Checking Account',
        accountType: 'ASSET',
        parentId: assets.id,
        isActive: true
      }
    })

    await prisma.chartOfAccounts.upsert({
      where: { accountCode: '1200' },
      update: {},
      create: {
        accountCode: '1200',
        accountName: 'Accounts Receivable',
        accountType: 'ASSET',
        isActive: true
      }
    })

    await prisma.chartOfAccounts.upsert({
      where: { accountCode: '2000' },
      update: {},
      create: {
        accountCode: '2000',
        accountName: 'Accounts Payable',
        accountType: 'LIABILITY',
        isActive: true
      }
    })

    await prisma.chartOfAccounts.upsert({
      where: { accountCode: '4000' },
      update: {},
      create: {
        accountCode: '4000',
        accountName: 'Sales Revenue',
        accountType: 'REVENUE',
        isActive: true
      }
    })

    await prisma.chartOfAccounts.upsert({
      where: { accountCode: '5000' },
      update: {},
      create: {
        accountCode: '5000',
        accountName: 'Cost of Goods Sold',
        accountType: 'EXPENSE',
        isActive: true
      }
    })

    // Create Payment Terms
    await prisma.paymentTerm.upsert({
      where: { name: 'Net 30' },
      update: {},
      create: {
        name: 'Net 30',
        days: 30,
        description: 'Payment due within 30 days'
      }
    })

    await prisma.paymentTerm.upsert({
      where: { name: 'Cash' },
      update: {},
      create: {
        name: 'Cash',
        days: 0,
        description: 'Payment due immediately'
      }
    })

    console.log('✅ POS and Accounting data seeded successfully!')
    console.log(`📍 Created locations: ${mainLocation.name}, ${northBranch.name}`)
    console.log('💳 Created POS terminals')
    console.log('📊 Created chart of accounts')
    console.log('💰 Created payment terms')

  } catch (error) {
    console.error('❌ Error seeding POS data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedPOSData()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
