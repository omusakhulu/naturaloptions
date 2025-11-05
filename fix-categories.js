import { prisma } from './src/lib/prisma'

async function fixCategories() {
  try {
    // Find all products
    const products = await prisma.product.findMany({
      select: {
        id: true,
        wooId: true,
        name: true,
        categories: true
      }
    })

    console.log(`Found ${products.length} products`)

    let fixedCount = 0

    for (const product of products) {
      try {
        // Parse the categories JSON
        const parsedCategories = JSON.parse(product.categories || '[]')

        // Check if categories are in the correct format
        if (Array.isArray(parsedCategories)) {
          // Check if any category is not in the expected format
          const needsFix = parsedCategories.some(cat =>
            typeof cat === 'object' && cat !== null &&
            !cat.name && !cat.label && !cat.title &&
            Object.keys(cat).length > 0
          )

          if (needsFix) {
            console.log(`Fixing product ${product.wooId} (${product.name})`)

            // Convert malformed categories to proper format
            const fixedCategories = parsedCategories.map(cat => {
              if (typeof cat === 'object' && cat !== null && !cat.name) {
                // Try to find a string property to use as name
                const stringProps = Object.entries(cat).filter(([key, value]) =>
                  typeof value === 'string' && value.trim().length > 0
                )

                if (stringProps.length > 0) {
                  return { name: stringProps[0][1], id: cat.id || 0 }
                }
              }
              return cat
            })

            // Update the product
            await prisma.product.update({
              where: { id: product.id },
              data: {
                categories: JSON.stringify(fixedCategories)
              }
            })

            fixedCount++
          }
        }
      } catch (error) {
        console.error(`Error processing product ${product.wooId}:`, error)
      }
    }

    console.log(`Fixed ${fixedCount} products with malformed categories`)

  } catch (error) {
    console.error('Error in fixCategories:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixCategories()
