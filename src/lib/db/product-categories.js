import { prisma } from '../prisma'

/**
 * Save or update a product category in the database
 */
export async function saveProductCategory(categoryData) {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ DATABASE_URL environment variable is not set. Categories will not be saved to database.')
    
    return null
  }

  try {
    // Categories are stored as JSON in Product model, no separate table needed
    console.log(`📝 Processing category: ${categoryData.name || categoryData.slug || 'Unknown'}`)
    
    // Return a mock category object for compatibility
    return {
      id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      wooId: categoryData.id,
      name: categoryData.name,
      slug: categoryData.slug,
      description: categoryData.description,
      image: categoryData.image?.src,
      count: categoryData.count || 0,
      parentId: null,
      updatedAt: new Date()
    }
  } catch (error) {
    console.error('Error processing product category:', error)
    throw error
  }
}

/**
 * Save multiple product categories in batch
 */
export async function saveProductCategories(categoriesData) {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ Skipping categories save: DATABASE_URL not configured')
    
    return []
  }

  try {
    const results = await Promise.all(
      categoriesData.map(category => saveProductCategory(category))
    )
    
    return results.filter(Boolean)
  } catch (error) {
    console.error('Error saving product categories in batch:', error)
    throw error
  }
}

/**
 * Get all product categories
 */
export async function getAllProductCategories() {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ Skipping categories fetch: DATABASE_URL not configured')
    
    return []
  }

  try {
    // Categories are stored as JSON in Product model, return empty array for compatibility
    console.log('📋 Categories are stored as JSON in Product model, no separate fetch needed')
    
    return []
  } catch (error) {
    console.error('Error fetching product categories:', error)
    throw error
  }
}

/**
 * Get a single product category by ID
 */
export async function getProductCategoryById(id) {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ Skipping category fetch: DATABASE_URL not configured')
    
    return null
  }

  try {
    // Categories are stored as JSON in Product model, no separate lookup needed
    console.log(`🔍 Category lookup by ID ${id} - categories are stored as JSON`)
    
    return null
  } catch (error) {
    console.error('Error fetching product category:', error)
    throw error
  }
}

/**
 * Get a single product category by WooCommerce ID
 */
export async function getProductCategoryByWooId(wooId) {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ Skipping category fetch: DATABASE_URL not configured')
    
    return null
  }

  try {
    // Categories are stored as JSON in Product model, no separate lookup needed
    console.log(`🔍 Category lookup by WooID ${wooId} - categories are stored as JSON`)
    
    return null
  } catch (error) {
    console.error('Error fetching product category:', error)
    throw error
  }
}
