import { prisma } from '@/lib/prisma'

// Validate DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.warn('⚠️ DATABASE_URL environment variable is not set. Products will not be saved to database.')
}

export interface ProductData {
  id: number
  wooId?: number
  name: string
  slug: string
  description?: string
  short_description?: string
  price?: string
  regular_price?: string
  sale_price?: string
  stock_status?: string
  stock_quantity?: number
  sku?: string
  images?: Array<{ src: string }>
  categories?: Array<{ id: number; name: string; slug?: string }>
  rating?: number
  review_count?: number
  status?: string
}

/**
 * Save or update a product in the database
 */
export async function saveProduct(productData: ProductData) {
  // Skip if DATABASE_URL is not configured
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ Skipping product save: DATABASE_URL not configured')

    return null
  }

  try {
    const product = await prisma.product.upsert({
      where: { wooId: productData.id },
      update: {
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
      },
      create: {
        wooId: productData.id,
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
export async function saveProducts(productsData: ProductData[]) {
  // Skip if DATABASE_URL is not configured
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ Skipping products save: DATABASE_URL not configured')

    return []
  }

  try {
    const results = await Promise.all(productsData.map(product => saveProduct(product)))

    console.log(`Successfully saved ${results.length} products to database`)

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
      orderBy: [
        { syncedAt: 'desc' },
        { createdAt: 'desc' } // Fallback to createdAt if syncedAt is null
      ]
    })

    return products
  } catch (error) {
    console.error('Error fetching products:', error)
    throw error
  }
}

/**
 * Get product by WooCommerce ID
 * @param wooId - The WooCommerce product ID (can be number or string)
 */
export async function getProductByWooId(wooId: number | string) {
  // Skip if DATABASE_URL is not configured
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ Skipping database query: DATABASE_URL not configured')

    return null
  }

  try {
    // Convert string ID to number if needed
    const id = typeof wooId === 'string' ? parseInt(wooId, 10) : wooId

    if (isNaN(id)) {
      console.warn(`Invalid WooCommerce ID: ${wooId}`)

      return null
    }

    const product = await prisma.product.findUnique({
      where: { wooId: id }
    })

    if (!product) {
      console.log(`Product with WooCommerce ID ${wooId} not found in database`)

      return null
    }

    return product
  } catch (error) {
    console.error('Error fetching product by WooCommerce ID:', error)

    return null
  }
}

/**
 * Delete product by WooCommerce ID
 */
export async function deleteProduct(wooId: number) {
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
    console.warn('⚠️ Skipping clear all products: DATABASE_URL not configured')

    return { count: 0 }
  }

  try {
    const result = await prisma.product.deleteMany()

    console.log(`🗑️ Deleted ${result.count} products from database`)

    return result
  } catch (error) {
    console.error('❌ Error clearing products:', error)
    throw error
  }
}

/**
 * Get all unique categories from products
 */
export async function getAllCategories() {
  // Skip if DATABASE_URL is not configured
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ Skipping get all categories: DATABASE_URL not configured')

    return []
  }

  try {
    // Get all products with their categories
    const products = await prisma.product.findMany({
      select: {
        categories: true
      }
    })

    // Extract and deduplicate categories
    const categoryMap = new Map()

    products.forEach(product => {
      if (product.categories && Array.isArray(product.categories)) {
        product.categories.forEach(cat => {
          if (cat && cat.id) {
            categoryMap.set(cat.id, {
              id: cat.id,
              name: cat.name || `Category ${cat.id}`,
              slug: cat.slug || `category-${cat.id}`
            })
          }
        })
      }
    })

    return Array.from(categoryMap.values())
  } catch (error) {
    console.error('❌ Error fetching categories from database:', error)

    return []
  }
}
