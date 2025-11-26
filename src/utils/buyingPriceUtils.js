/**
 * Utility functions for managing product buying prices locally
 * Buying prices are stored in localStorage for stock calculations
 */

const BUYING_PRICE_STORAGE_KEY = 'product_buying_prices'

/**
 * Get all buying prices from localStorage
 * @returns {Object} - Map of SKU to buying price
 */
export const getAllBuyingPrices = () => {
  if (typeof window === 'undefined') return {}
  
  try {
    const stored = localStorage.getItem(BUYING_PRICE_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error('Error reading buying prices from localStorage:', error)
    return {}
  }
}

/**
 * Get buying price for a specific product by SKU
 * @param {string} sku - Product SKU
 * @returns {number|null} - Buying price or null if not found
 */
export const getBuyingPriceBySku = (sku) => {
  if (!sku) return null
  
  const prices = getAllBuyingPrices()
  return prices[sku] ? parseFloat(prices[sku]) : null
}

/**
 * Set buying price for a product by SKU
 * @param {string} sku - Product SKU
 * @param {number} price - Buying price
 */
export const setBuyingPriceBySku = (sku, price) => {
  if (!sku || typeof price !== 'number' || price < 0) return false
  
  if (typeof window === 'undefined') return false
  
  try {
    const prices = getAllBuyingPrices()
    prices[sku] = price.toFixed(2) // Store as string with 2 decimal places
    localStorage.setItem(BUYING_PRICE_STORAGE_KEY, JSON.stringify(prices))
    return true
  } catch (error) {
    console.error('Error saving buying price to localStorage:', error)
    return false
  }
}

/**
 * Remove buying price for a product by SKU
 * @param {string} sku - Product SKU
 */
export const removeBuyingPriceBySku = (sku) => {
  if (!sku) return false
  
  if (typeof window === 'undefined') return false
  
  try {
    const prices = getAllBuyingPrices()
    delete prices[sku]
    localStorage.setItem(BUYING_PRICE_STORAGE_KEY, JSON.stringify(prices))
    return true
  } catch (error) {
    console.error('Error removing buying price from localStorage:', error)
    return false
  }
}

/**
 * Calculate total buying cost for inventory
 * @param {Array} items - Array of items with sku and quantity
 * @returns {number} - Total buying cost
 */
export const calculateTotalBuyingCost = (items) => {
  if (!Array.isArray(items)) return 0
  
  return items.reduce((total, item) => {
    const buyingPrice = getBuyingPriceBySku(item.sku)
    const quantity = parseInt(item.quantity) || 0
    const cost = buyingPrice ? buyingPrice * quantity : 0
    return total + cost
  }, 0)
}

/**
 * Calculate profit margin for a product
 * @param {string} sku - Product SKU
 * @param {number} sellingPrice - Current selling price
 * @returns {number|null} - Profit margin percentage or null if buying price not found
 */
export const calculateProfitMargin = (sku, sellingPrice) => {
  const buyingPrice = getBuyingPriceBySku(sku)
  if (!buyingPrice || !sellingPrice || buyingPrice >= sellingPrice) return null
  
  const profit = sellingPrice - buyingPrice
  return ((profit / sellingPrice) * 100).toFixed(2)
}

/**
 * Get products with buying prices for reporting
 * @param {Array} products - Array of products with sku and price
 * @returns {Array} - Products with buying price and profit calculations
 */
export const enrichProductsWithBuyingPrices = (products) => {
  if (!Array.isArray(products)) return []
  
  return products.map(product => {
    const buyingPrice = getBuyingPriceBySku(product.sku)
    const sellingPrice = parseFloat(product.price || product.regular_price) || 0
    
    return {
      ...product,
      buyingPrice,
      profitMargin: buyingPrice ? calculateProfitMargin(product.sku, sellingPrice) : null,
      profitAmount: buyingPrice ? sellingPrice - buyingPrice : null
    }
  })
}
