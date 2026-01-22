/**
 * Initialize Dual Stock System
 * 
 * This script sets initial values for actualStock and websiteStock
 * for all existing products in the database.
 * 
 * Run: node scripts/initialize-dual-stock.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function initializeDualStock() {
  console.log('🚀 Starting dual stock initialization...\n')

  try {
    // Get all products
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        stockQuantity: true,
        actualStock: true,
        websiteStock: true
      }
    })

    console.log(`📦 Found ${products.length} products\n`)

    let updated = 0
    let skipped = 0

    for (const product of products) {
      // Skip if already initialized
      if (product.actualStock > 0 || product.websiteStock > 0) {
        console.log(`⏭️  Skipping "${product.name}" - already initialized`)
        skipped++
        continue
      }

      // Use stockQuantity as initial value for both
      const initialStock = product.stockQuantity || 0

      await prisma.product.update({
        where: { id: product.id },
        data: {
          actualStock: initialStock,
          websiteStock: initialStock,
          reservedStock: 0,
          lowStockAlert: 10,
          autoSyncStock: false,
          lastStockSync: null
        }
      })

      console.log(`✅ Initialized "${product.name}" with ${initialStock} units`)
      updated++
    }

    console.log('\n' + '='.repeat(50))
    console.log(`✨ Initialization complete!`)
    console.log(`   Updated: ${updated} products`)
    console.log(`   Skipped: ${skipped} products`)
    console.log('='.repeat(50) + '\n')

    // Show summary
    const summary = await prisma.product.aggregate({
      _sum: {
        actualStock: true,
        websiteStock: true,
        reservedStock: true
      },
      _count: true
    })

    console.log('📊 Stock Summary:')
    console.log(`   Total Products: ${summary._count}`)
    console.log(`   Total Actual Stock: ${summary._sum.actualStock || 0}`)
    console.log(`   Total Website Stock: ${summary._sum.websiteStock || 0}`)
    console.log(`   Total Reserved: ${summary._sum.reservedStock || 0}`)
    console.log('')

  } catch (error) {
    console.error('❌ Error initializing dual stock:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the initialization
initializeDualStock()
  .then(() => {
    console.log('✅ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Failed:', error)
    process.exit(1)
  })
