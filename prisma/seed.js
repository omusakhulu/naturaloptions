const { PrismaClient, Prisma } = require('@prisma/client')
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
      email: 'superadmin@naturaloptions.com',
      password,
      role: 'SUPER_ADMIN',
      active: true,
      image: '/images/avatars/1.png'
    },

    // Admins
    {
      name: 'Admin User',
      email: 'admin@naturaloptions.com',
      password,
      role: 'ADMIN',
      active: true,
      image: '/images/avatars/2.png'
    },
    {
      name: 'John Administrator',
      email: 'john.admin@naturaloptions.com',
      password,
      role: 'ADMIN',
      active: true,
      image: '/images/avatars/3.png'
    },

    // Managers
    {
      name: 'Sarah Manager',
      email: 'sarah.manager@naturaloptions.com',
      password,
      role: 'MANAGER',
      active: true,
      image: '/images/avatars/4.png'
    },
    {
      name: 'Mike Operations',
      email: 'mike.ops@naturaloptions.com',
      password,
      role: 'MANAGER',
      active: true,
      image: '/images/avatars/5.png'
    },
    {
      name: 'Lisa Project Manager',
      email: 'lisa.pm@naturaloptions.com',
      password,
      role: 'MANAGER',
      active: true,
      image: '/images/avatars/6.png'
    },

    // Sales Staff
    {
      name: 'David Sales',
      email: 'david.sales@naturaloptions.com',
      password,
      role: 'SALES',
      active: true,
      image: '/images/avatars/7.png'
    },
    {
      name: 'Emma Thompson',
      email: 'emma.sales@naturaloptions.com',
      password,
      role: 'SALES',
      active: true,
      image: '/images/avatars/8.png'
    },
    {
      name: 'Robert Wilson',
      email: 'robert.sales@naturaloptions.com',
      password,
      role: 'SALES',
      active: true,
      image: '/images/avatars/2.png'
    },
    {
      name: 'Jennifer Brown',
      email: 'jennifer.sales@naturaloptions.com',
      password,
      role: 'SALES',
      active: true,
      image: '/images/avatars/3.png'
    },

    // POS & Accounting Staff
    {
      name: 'Alex Cashier',
      email: 'alex.cashier@naturaloptions.com',
      password,
      role: 'CASHIER',
      active: true,
      image: '/images/avatars/4.png'
    },
    {
      name: 'Rachel Accountant',
      email: 'rachel.accountant@naturaloptions.com',
      password,
      role: 'ACCOUNTANT',
      active: true,
      image: '/images/avatars/5.png'
    },
    {
      name: 'Kevin Cashier',
      email: 'kevin.cashier@naturaloptions.com',
      password,
      role: 'CASHIER',
      active: true,
      image: '/images/avatars/6.png'
    },

    // Regular Users
    {
      name: 'Tom Field Worker',
      email: 'tom.field@naturaloptions.com',
      password,
      role: 'USER',
      active: true,
      image: '/images/avatars/7.png'
    },
    {
      name: 'James Driver',
      email: 'james.driver@naturaloptions.com',
      password,
      role: 'USER',
      active: true,
      image: '/images/avatars/8.png'
    },
    {
      name: 'Maria Garcia',
      email: 'maria.user@naturaloptions.com',
      password,
      role: 'USER',
      active: true,
      image: '/images/avatars/1.png'
    },
    {
      name: 'Carlos Martinez',
      email: 'carlos.user@naturaloptions.com',
      password,
      role: 'USER',
      active: true,
      image: '/images/avatars/2.png'
    },
    {
      name: 'Ana Rodriguez',
      email: 'ana.user@naturaloptions.com',
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

  // =============================
  // ACCOUNTING MASTER DATA
  // =============================
  console.log('\n🏦 Seeding payment terms...')
  const net15 = await prisma.paymentTerm.upsert({
    where: { name: 'Net 15' },
    update: {},
    create: { name: 'Net 15', days: 15, description: 'Payment due in 15 days' }
  })
  const net30 = await prisma.paymentTerm.upsert({
    where: { name: 'Net 30' },
    update: {},
    create: { name: 'Net 30', days: 30, description: 'Payment due in 30 days' }
  })

  console.log('\n💳 Seeding payment accounts...')
  const cash = await prisma.paymentAccount.upsert({
    where: { accountCode: undefined, id: 'seed-cash' } // Workaround: use upsert via id by catching failure below
  }).catch(async () => {
    // Upsert requires a unique field; ensure existence by finding by name
    const existing = await prisma.paymentAccount.findFirst({ where: { name: 'Cash' } })
    return existing || prisma.paymentAccount.create({ data: { name: 'Cash', type: 'Cash', balance: new Prisma.Decimal(10000), status: 'Active' } })
  })
  const bank = await prisma.paymentAccount.findFirst({ where: { name: 'Bank' } }) ||
    await prisma.paymentAccount.create({ data: { name: 'Bank', type: 'Bank', balance: new Prisma.Decimal(250000), status: 'Active' } })

  // =============================
  // CONTACTS (VENDORS & CUSTOMERS)
  // =============================
  console.log('\n👔 Seeding vendors...')
  const vendorA = await prisma.vendor.upsert({
    where: { email: 'supplier.alpha@vendor.test' },
    update: {},
    create: {
      name: 'Supplier Alpha',
      email: 'supplier.alpha@vendor.test',
      phone: '+254700000111',
      address: 'Industrial Area, Nairobi',
      paymentTermId: net30.id,
      isActive: true,
      profile: JSON.stringify({ mobile: '+254700000111', taxNumber: 'PIN-A1B2C3', addressLine1: 'Plot 21', city: 'Nairobi' }),
      shippingAddress: 'Industrial Area, Nairobi'
    }
  })
  const vendorB = await prisma.vendor.upsert({
    where: { email: 'supplier.beta@vendor.test' },
    update: {},
    create: {
      name: 'Supplier Beta',
      email: 'supplier.beta@vendor.test',
      phone: '+254700000222',
      address: 'Mombasa Road, Nairobi',
      paymentTermId: net15.id,
      isActive: true
    }
  })

  console.log('\n🧾 Seeding vendor bills...')
  await prisma.bill.upsert({
    where: { billNumber: 'BILL-2025-0001' },
    update: {},
    create: { billNumber: 'BILL-2025-0001', vendorId: vendorA.id, billDate: new Date(), amount: new Prisma.Decimal(12500), paidAmount: new Prisma.Decimal(5000), status: 'PARTIALLY_PAID' }
  })
  await prisma.bill.upsert({
    where: { billNumber: 'BILL-2025-0002' },
    update: {},
    create: { billNumber: 'BILL-2025-0002', vendorId: vendorB.id, billDate: new Date(), amount: new Prisma.Decimal(9800), paidAmount: new Prisma.Decimal(0), status: 'UNPAID' }
  })

  console.log('\n👤 Seeding customers...')
  const customer1 = await prisma.customer.upsert({
    where: { email: 'alice.customer@test.com' },
    update: {},
    create: { wooId: 10001, email: 'alice.customer@test.com', firstName: 'Alice', lastName: 'Customer' }
  })
  const customer2 = await prisma.customer.upsert({
    where: { email: 'bob.customer@test.com' },
    update: {},
    create: { wooId: 10002, email: 'bob.customer@test.com', firstName: 'Bob', lastName: 'Customer' }
  })

  // =============================
  // CATALOG & SALES
  // =============================
  console.log('\n📦 Seeding products...')
  const product1 = await prisma.product.upsert({
    where: { slug: 'non-woven-bag' },
    update: {},
    create: { wooId: 50001, name: 'Non Woven Bag', slug: 'non-woven-bag', regularPrice: '50', salePrice: '30', stockQuantity: 200, sku: 'SKU-NWB-001' }
  })
  const product2 = await prisma.product.upsert({
    where: { slug: 'youth-clock-tshirt' },
    update: {},
    create: { wooId: 50002, name: 'Youth Clock T-Shirt', slug: 'youth-clock-tshirt', regularPrice: '1400', salePrice: '1200', stockQuantity: 35, sku: 'SKU-YCT-001' }
  })

  console.log('\n🛒 Seeding orders & invoices...')
  const order1 = await prisma.order.upsert({
    where: { orderNumber: 'WO-10001' },
    update: {},
    create: { wooId: 20001, orderNumber: 'WO-10001', customerId: customer1.wooId, status: 'processing', total: '2200', dateCreated: new Date() }
  })
  const order2 = await prisma.order.upsert({
    where: { orderNumber: 'WO-10002' },
    update: {},
    create: { wooId: 20002, orderNumber: 'WO-10002', customerId: customer2.wooId, status: 'completed', total: '650', dateCreated: new Date() }
  })

  await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-2025-0001' },
    update: {},
    create: { invoiceNumber: 'INV-2025-0001', wooOrderId: order1.wooId, customerId: customer1.wooId, amount: '2200', invoiceStatus: 'sent', date: new Date() }
  })
  await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-2025-0002' },
    update: {},
    create: { invoiceNumber: 'INV-2025-0002', wooOrderId: order2.wooId, customerId: customer2.wooId, amount: '650', invoiceStatus: 'paid', date: new Date() }
  })

  // =============================
  // LOGISTICS & STOCK
  // =============================
  console.log('\n📦 Seeding stock transfers...')
  await prisma.stockTransferRecord.upsert({
    where: { reference: 'ST-0001' },
    update: {},
    create: { reference: 'ST-0001', from: 'Main Warehouse', to: 'Shop Front', status: 'Completed', date: new Date(), notes: 'Initial transfer' }
  })
  await prisma.stockTransferRecord.upsert({
    where: { reference: 'ST-0002' },
    update: {},
    create: { reference: 'ST-0002', from: 'Shop Front', to: 'Event Van', status: 'Dispatch', date: new Date() }
  })

  console.log('\n🛠️  Seeding stock adjustments...')
  await prisma.stockAdjustmentRecord.upsert({
    where: { reference: 'SA-0001' },
    update: {},
    create: { reference: 'SA-0001', location: 'Main Warehouse', reason: 'Damage', items: JSON.stringify([{ sku: 'SKU-NWB-001', qty: -3 }]), date: new Date() }
  })

  // =============================
  // EXPENSES
  // =============================
  console.log('\n💸 Seeding expenses...')
  const existingExpenses = await prisma.expense.count()
  if (existingExpenses === 0) {
    const today = new Date()
    const mkDate = (offset) => new Date(today.getTime() - offset * 24 * 3600 * 1000)
    await prisma.expense.createMany({
      data: [
        { amount: new Prisma.Decimal(2000), category: 'Office Supplies', accountId: (cash.id || cash?.id), date: mkDate(0), note: 'Printer ink' },
        { amount: new Prisma.Decimal(950), category: 'Utilities', accountId: (bank.id || bank?.id), date: mkDate(1), note: 'Electricity bill' },
        { amount: new Prisma.Decimal(12000), category: 'Logistics', accountId: (bank.id || bank?.id), date: mkDate(3), note: 'Truck service' }
      ]
    })
  }

  console.log('\n✅ Database seed completed!')
  console.log('\n🔑 Login Credentials:')
  console.log('   Email: any of the emails above')
  console.log('   Password: password123')
  console.log('\n📧 Example logins:')
  console.log('   Super Admin: superadmin@naturaloptions.com')
  console.log('   Admin: admin@naturaloptions.com')
  console.log('   Manager: sarah.manager@naturaloptions.com')
  console.log('   Accountant: rachel.accountant@naturaloptions.com')
  console.log('   Cashier: alex.cashier@naturaloptions.com')
  console.log('   Sales: david.sales@naturaloptions.com')
  console.log('   User: tom.field@naturaloptions.com')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
