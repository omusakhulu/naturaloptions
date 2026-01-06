const { PrismaClient, Prisma } = require('@prisma/client')

const prisma = new PrismaClient()

// Helper functions for random data
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)]
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const randomDecimal = (min, max) => new Prisma.Decimal((Math.random() * (max - min) + min).toFixed(2))
const randomDate = (daysAgo = 30) => {
  const date = new Date()
  date.setDate(date.getDate() - randomInt(0, daysAgo))
  return date
}
const randomSentence = () => {
  const words = ['Order', 'processed', 'successfully', 'payment', 'received', 'stock', 'adjusted', 'customer', 'updated', 'shipped', 'delivered', 'cancelled']
  return Array.from({ length: 5 }, () => randomElement(words)).join(' ') + '.'
}
const randomName = (type) => {
  if (type === 'first') return randomElement(['John', 'Jane', 'Alice', 'Bob', 'Michael', 'Emma', 'David', 'Sarah', 'Peter', 'Mary'])
  return randomElement(['Smith', 'Doe', 'Johnson', 'Brown', 'Wilson', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White'])
}

async function main() {
  console.log('🌱 Starting Comprehensive Report Data Seed...')

  // 1. Get or Create Base Data (Users, Locations, Products, Accounts)
  console.log('👥 Ensuring users exist...')
  let users = await prisma.user.findMany()
  if (users.length === 0) {
    console.log('No users found, creating default admin...')
    const admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@test.com',
        role: 'SUPER_ADMIN',
        active: true
      }
    })
    users = [admin]
  }
  const cashiers = users.filter(u => ['CASHIER', 'SUPER_ADMIN', 'ADMIN'].includes(u.role)) || users

  console.log('🏬 Ensuring locations exist...')
  let locations = await prisma.location.findMany()
  if (locations.length === 0) {
    locations = [
      await prisma.location.create({ data: { name: 'Main Store', isActive: true, isMainLocation: true } }),
      await prisma.location.create({ data: { name: 'Downtown Branch', isActive: true } })
    ]
  }

  console.log('📦 Ensuring products exist...')
  let products = await prisma.product.findMany()
  if (products.length === 0) {
    products = [
      await prisma.product.create({ data: { wooId: 101, name: 'Essential Oil - Lavender', slug: 'essential-oil-lavender', price: '15.00', regularPrice: '15.00', sku: 'EO-LAV-01', actualStock: 100 } }),
      await prisma.product.create({ data: { wooId: 102, name: 'Organic Honey 500g', slug: 'organic-honey-500g', price: '12.00', regularPrice: '12.00', sku: 'HON-ORG-01', actualStock: 50 } }),
      await prisma.product.create({ data: { wooId: 103, name: 'Herbal Tea Mix', slug: 'herbal-tea-mix', price: '8.50', regularPrice: '8.50', sku: 'TEA-HERB-01', actualStock: 200 } })
    ]
  }

  console.log('🏦 Ensuring payment accounts exist...')
  let accounts = await prisma.paymentAccount.findMany()
  if (accounts.length === 0) {
    accounts = [
      await prisma.paymentAccount.create({ data: { name: 'Main Cash', type: 'CASH', balance: 5000 } }),
      await prisma.paymentAccount.create({ data: { name: 'Business Bank', type: 'BANK', balance: 50000 } })
    ]
  }

  console.log('� Ensuring vendors exist...')
  let vendors = await prisma.vendor.findMany()
  if (vendors.length === 0) {
    vendors = [
      await prisma.vendor.create({ data: { name: 'Global Supplies Ltd', email: 'info@globalsupplies.com' } }),
      await prisma.vendor.create({ data: { name: 'Local Farm Coop', email: 'sales@localfarm.co.ke' } })
    ]
  }

  console.log('🏠 Ensuring warehouses exist...')
  let warehouses = await prisma.warehouse.findMany()
  if (warehouses.length === 0) {
    warehouses = [
      await prisma.warehouse.create({ data: { name: 'Main Warehouse', code: 'W-MAIN', status: 'active' } })
    ]
  }

  // 2. Seed POS Customers (Real data for Customer Groups Report)
  console.log('👥 Seeding POS Customers...')
  const posCustomers = []
  for (let i = 0; i < 15; i++) {
    const firstName = randomName('first')
    const lastName = randomName('last')
    const cust = await prisma.pOSCustomer.upsert({
      where: { customerNumber: `CUST-${1000 + i}` },
      update: {},
      create: {
        customerNumber: `CUST-${1000 + i}`,
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@test.com`,
        phone: `+2547${randomInt(10000000, 99999999)}`,
        loyaltyPoints: randomInt(0, 1500),
        totalSpent: 0,
        isActive: true
      }
    })
    posCustomers.push(cust)
  }

  // 3. Seed POS Terminals and Cash Drawers (Real data for Register Report)
  console.log('�️ Seeding POS Terminals & Cash Drawers...')
  const terminals = []
  for (const loc of locations) {
    const term = await prisma.pOSTerminal.upsert({
      where: { id: `term-${loc.id}` },
      update: {},
      create: { id: `term-${loc.id}`, name: `${loc.name} Register`, locationId: loc.id, isActive: true }
    })
    terminals.push(term)

    await prisma.cashDrawer.create({
      data: {
        terminalId: term.id,
        employeeId: randomElement(cashiers).id,
        openingAmount: 200,
        status: 'CLOSED',
        openedAt: randomDate(5),
        closedAt: new Date(),
        closingAmount: 1500,
        expectedAmount: 1500,
        discrepancy: 0
      }
    })
  }

  // 4. Seed POS Sales & Payments (Real data for Sales, Tax, Product Sell, Sales Rep, Sell Payment reports)
  console.log('🛍️ Seeding POS Sales & Payments...')
  for (let i = 0; i < 50; i++) {
    const saleDate = randomDate(30)
    const terminal = randomElement(terminals)
    const cashier = randomElement(cashiers)
    const customer = Math.random() > 0.3 ? randomElement(posCustomers) : null
    
    const numItems = randomInt(1, 4)
    let subtotal = 0
    const items = []
    
    for (let j = 0; j < numItems; j++) {
      const prod = randomElement(products)
      const qty = randomInt(1, 3)
      const price = parseFloat(prod.price || '10')
      const total = qty * price
      subtotal += total
      items.push({ productId: prod.id, quantity: qty, unitPrice: price, total: total })
    }

    const tax = subtotal * 0.16
    const total = subtotal + tax

    await prisma.pOSSale.create({
      data: {
        saleNumber: `SALE-${Date.now()}-${i}`,
        terminalId: terminal.id,
        employeeId: cashier.id,
        customerId: customer?.id,
        subtotal: subtotal,
        taxAmount: tax,
        totalAmount: total,
        paymentMethod: 'CASH',
        paymentStatus: 'COMPLETED',
        status: 'COMPLETED',
        saleDate: saleDate,
        saleItems: {
          create: items
        },
        payments: {
          create: {
            amount: total,
            paymentMethod: 'CASH',
            paymentDate: saleDate,
            status: 'COMPLETED'
          }
        }
      }
    })
  }

  // 5. Seed WooCommerce Orders (Real data for Unified Sales & Tax reports)
  console.log('🌐 Seeding WooCommerce Orders...')
  for (let i = 0; i < 25; i++) {
    const wooId = 6000 + i
    const date = randomDate(30)
    const total = randomDecimal(20, 500)
    const tax = new Prisma.Decimal((parseFloat(total) * 0.16).toFixed(2))
    const subt = new Prisma.Decimal((parseFloat(total) - parseFloat(tax)).toFixed(2))

    await prisma.order.upsert({
      where: { wooId: wooId },
      update: {},
      create: {
        wooId: wooId,
        orderNumber: `WC-${wooId}`,
        status: 'completed',
        total: total.toString(),
        subtotal: subt.toString(),
        taxTotal: tax.toString(),
        dateCreated: date,
        datePaid: date,
        paymentMethod: 'bacs',
        paymentMethodTitle: 'Bank Transfer',
        lineItems: JSON.stringify([
          { name: 'Seeded Woo Product A', quantity: 1, total: '50.00' },
          { name: 'Seeded Woo Product B', quantity: 2, total: '30.00' }
        ])
      }
    })
  }

  // 6. Seed Bills & Purchase Returns (Real data for Purchase, Supplier reports)
  console.log('🧾 Seeding Bills & Purchase Returns...')
  for (const v of vendors) {
    for (let i = 0; i < 8; i++) {
      const billAmount = randomDecimal(500, 5000)
      const paid = Math.random() > 0.5 ? billAmount : randomDecimal(0, parseFloat(billAmount))
      
      await prisma.bill.create({
        data: {
          billNumber: `BILL-${Date.now()}-${v.id.slice(0,4)}-${i}`,
          vendorId: v.id,
          billDate: randomDate(60),
          amount: billAmount,
          paidAmount: paid,
          status: paid.equals(billAmount) ? 'PAID' : 'PARTIALLY_PAID',
          reference: `REF-${i}`
        }
      })

      if (Math.random() > 0.7) {
        await prisma.purchaseReturn.create({
          data: {
            vendorId: v.id,
            amount: randomDecimal(50, 200),
            date: new Date(),
            reason: 'Quality issue'
          }
        })
      }
    }
  }

  // 7. Seed Inventory & Stock Movements (Real data for Stock, Adjustment reports)
  console.log('� Seeding Inventory & Stock Adjustments...')
  for (const w of warehouses) {
    for (const p of products) {
      const inv = await prisma.inventoryItem.create({
        data: {
          warehouseId: w.id,
          sku: p.sku || `SKU-${p.id}`,
          productName: p.name,
          quantity: randomInt(10, 100),
          costPrice: parseFloat(p.price || '10') * 0.7,
          sellingPrice: parseFloat(p.price || '10')
        }
      })

      // Stock adjustment
      await prisma.productStockMovement.create({
        data: {
          productId: p.id,
          type: 'ADJUSTMENT',
          quantity: randomInt(-5, 5),
          beforeActual: 50,
          afterActual: 50 + randomInt(-5, 5),
          reason: randomElement(['Damage', 'Found', 'Miscount']),
          userName: randomElement(users).name || 'System',
          createdAt: randomDate(10)
        }
      })
    }
  }

  // 8. Seed Expenses (Real data for Expense Report)
  console.log('💸 Seeding Expenses...')
  for (let i = 0; i < 20; i++) {
    await prisma.expense.create({
      data: {
        amount: randomDecimal(10, 500),
        category: randomElement(['Rent', 'Utilities', 'Marketing', 'Office Supplies', 'Travel']),
        date: randomDate(30),
        accountId: randomElement(accounts).id,
        note: 'Sample seeded expense'
      }
    })
  }

  // 9. Seed Activity Logs (Real data for Activity Log Report)
  console.log('📝 Seeding Activity Logs...')
  for (let i = 0; i < 30; i++) {
    await prisma.activityLog.create({
      data: {
        performedById: randomElement(users).id,
        entityType: randomElement(['ORDER', 'PRODUCT', 'INVOICE', 'CUSTOMER', 'WAREHOUSE']),
        entityId: 'seeded-id',
        action: randomElement(['CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE']),
        description: randomSentence(),
        createdAt: randomDate(15)
      }
    })
  }

  console.log('✅ Comprehensive Report Data Seed Completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error Seeding Data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
