/**
 * Maps WooCommerce product data to the application's product format
 * @param {Array} wcProducts - Array of products from WooCommerce API
 * @returns {Array} Mapped products in the application's format
 */
// Import the getValidCategory function to ensure we only use valid categories
import { getValidCategory } from './categories'

export const mapWooCommerceProducts = wcProducts => {
  if (!Array.isArray(wcProducts)) {
    console.error('Invalid products data:', wcProducts)

    return []
  }

  return wcProducts.map(product => {
    // Preserve the original categories for reference
    const originalCategories = product.categories || []

    // Get the category name as a string (ensure it's always a string)
    let categoryName = 'Uncategorized'

    try {
      if (typeof originalCategories === 'string') {
        categoryName = originalCategories.trim() || 'Uncategorized'
      } else if (Array.isArray(originalCategories)) {
        // Use the improved getValidCategory function
        const validCategory = getValidCategory(originalCategories)
        categoryName = typeof validCategory === 'string' ? validCategory : 'Uncategorized'
      } else {
        categoryName = 'Uncategorized'
      }
    } catch (error) {
      console.warn('Error getting valid category for product', product.id, error)
      categoryName = 'Uncategorized'
    }

    return {
      id: product.id,
      productName: product.name,
      productBrand: product.sku || 'N/A',

      // Ensure category is always a string
      category: categoryName,

      // Keep the original categories array for reference
      categories: originalCategories,
      stock: product.stock_status === 'instock',
      stock_quantity: product.stock_quantity,
      sku: product.sku,
      price: product.price,
      image: product.images?.[0]?.src || '/images/apps/ecommerce/product-blank.png',
      status: product.status === 'publish' ? 'Published' : 'Draft',
      rating: product.average_rating || 0,

      // Add any additional mappings as needed
      description: product.description,
      regular_price: product.regular_price,
      sale_price: product.sale_price,
      catalog_visibility: product.catalog_visibility
    }
  })
}

/**
 * Maps a single WooCommerce product to the application's format
 * @param {Object} product - Single product from WooCommerce API
 * @returns {Object} Mapped product in the application's format
 */
export const mapWooCommerceProduct = product => {
  if (!product) return null

  const originalCategories = product.categories || []

  // Get the category name as a string (ensure it's always a string)
  const categoryName = typeof originalCategories === 'string'
    ? originalCategories
    : (() => {
        try {
          const result = getValidCategory(originalCategories)
          // Ensure the result is always a string
          return typeof result === 'string' ? result : 'Uncategorized'
        } catch (error) {
          console.warn('Error getting valid category:', error)
          return 'Uncategorized'
        }
      })()

  return {
    id: product.id,
    productName: product.name,
    productBrand: product.sku || 'N/A',
    category: categoryName, // Ensure this is a string
    categories: originalCategories,
    stock: product.stock_status === 'instock',
    stock_quantity: product.stock_quantity,
    sku: product.sku,
    price: product.price,
    image: product.images?.[0]?.src || '/images/apps/ecommerce/product-blank.png',
    status: product.status === 'publish' ? 'Published' : 'Draft',
    rating: product.average_rating || 0,

    // Add any additional fields from WooCommerce that you need
    description: product.description,
    regular_price: product.regular_price,
    sale_price: product.sale_price,
    stock_quantity: product.stock_quantity,
    catalog_visibility: product.catalog_visibility

    // Add any other WooCommerce fields you want to include
  }
}
