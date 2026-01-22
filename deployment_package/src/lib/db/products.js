import { prisma } from '../prisma'

// Validate DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.warn('⚠️ DATABASE_URL environment variable is not set. Products will not be saved to database.')
}

/**
 * Save or update a product in the database
 */
export async function saveProduct(productData) {
  // Skip if DATABASE_URL is not configured
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ Skipping product save: DATABASE_URL not configured')

    
    return null
  }

  try {
    // Categories are stored as JSON in Product model, no separate processing needed
    console.log(`📝 Saving product: ${productData.name} (ID: ${productData.id})`)

    // Prepare product data
    const productUpdateData = {
      name: productData.name,
      slug: productData.slug,
      description: productData.description || null,
      shortDescription: productData.short_description || null,
      price: productData.price || null,
      regularPrice: productData.regular_price || null,
      salePrice: productData.sale_price || null,
      stockStatus: productData.stock_status || 'instock',
      stockQuantity: productData.stock_quantity || 0,
      sku: productData.sku || null,
      image: productData.images?.[0]?.src || null,
      images: JSON.stringify(productData.images || []),
      categories: JSON.stringify(productData.categories || []),
      rating: productData.rating || 0,
      ratingCount: productData.review_count || 0,
      status: productData.status || 'publish',
      syncedAt: new Date()
    }

    // Upsert the product
    const product = await prisma.product.upsert({
      where: { wooId: productData.id },
      update: productUpdateData,
      create: {
        wooId: productData.id,
        ...productUpdateData
      }
    })

    return product
  } catch (error) {
    console.error('Error saving product:', error)
    throw error
  }
}

/**
 * Save multiple products in batch
 */
export async function saveProducts(productsData) {
  // Skip if DATABASE_URL is not configured
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ Skipping products save: DATABASE_URL not configured')

    return []
  }

  try {
    // Categories are stored as JSON in Product model, no separate processing needed
    console.log(`📦 Saving ${productsData.length} products to database...`)

    // Save products in batches of 50 to avoid timeouts
    const BATCH_SIZE = 50
    const results = []

    for (let i = 0; i < productsData.length; i += BATCH_SIZE) {
      const batch = productsData.slice(i, i + BATCH_SIZE)
      console.log(`Processing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(productsData.length / BATCH_SIZE)}...`)

      const batchResults = await Promise.all(
        batch.map(product => saveProduct(product).catch(e => {
          console.error(`Error saving product ${product.id || 'unknown'}:`, e)

          return null
        }))
      )

      results.push(...batchResults.filter(Boolean))
    }

    console.log(`✅ Successfully saved ${results.length} products to database`)

    return results
  } catch (error) {
    console.error('Error saving products in batch:', error)
    throw error
  }
}

/**
 * Get all products from database
 */
export async function getAllProducts() {
  // Skip if DATABASE_URL is not configured
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ Skipping products fetch: DATABASE_URL not configured')

    return []
  }

  try {
    const products = await prisma.product.findMany({
      orderBy: { syncedAt: 'desc' }
    })

    return products
  } catch (error) {
    console.error('Error fetching products:', error)
    throw error
  }
}

/**
 * Get product by WooCommerce ID
 */
export async function getProductByWooId(wooId) {
  // Skip if DATABASE_URL is not configured
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ Skipping product fetch: DATABASE_URL not configured')

    return null
  }

  try {
    const product = await prisma.product.findUnique({
      where: { wooId }
    })

    return product
  } catch (error) {
    console.error('Error fetching product:', error)
    throw error
  }
}

/**
 * Delete product by WooCommerce ID
 */
export async function deleteProduct(wooId) {
  // Skip if DATABASE_URL is not configured
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ Skipping product delete: DATABASE_URL not configured')

    return null
  }

  try {
    const product = await prisma.product.delete({
      where: { wooId }
    })

    return product
  } catch (error) {
    console.error('Error deleting product:', error)
    throw error
  }
}

/**
 * Clear all products from database
 */
export async function clearAllProducts() {
  // Skip if DATABASE_URL is not configured
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ Skipping products clear: DATABASE_URL not configured')

    return { count: 0 }
  }

  try {
    const result = await prisma.product.deleteMany({})

    console.log(`Deleted ${result.count} products from database`)

    return result
  } catch (error) {
    console.error('Error clearing products:', error)
    throw error
  }
}
