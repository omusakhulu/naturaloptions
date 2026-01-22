import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api'

// Initialize the WooCommerce API client
const api = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || 'https://omnishop.omnispace3d.com', // Fallback to the test URL if not set in env
  consumerKey: process.env.NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_KEY || 'ck_d54ed054d0803d25e3de47b8bb5fed9c03cf0fad',
  consumerSecret: process.env.NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_SECRET || 'cs_bdcf4ac0f48fa175e438eda440011ef057a8d44d',
  version: 'wc/v3'
})

/**
 * Fetches orders from WooCommerce
 * @param {Object} params - Query parameters for the orders API
 * @returns {Promise<Array>} - Array of orders
 */
export const getWooCommerceOrders = async (params = {}) => {
  try {
    const { data } = await api.get('orders', {
      per_page: 20, // Maximum allowed by WooCommerce
      order: 'desc',
      orderby: 'date',
      ...params
    })

    return data
  } catch (error) {
    console.error('Error fetching WooCommerce orders:', error)
    throw error
  }
}

/**
 * Maps WooCommerce order data to the application's order format
 * @param {Array} wcOrders - Array of orders from WooCommerce API
 * @returns {Array} Mapped orders in the application's format
 */
export const mapWooCommerceOrders = wcOrders => {
  if (!Array.isArray(wcOrders)) {
    console.error('Invalid orders data:', wcOrders)

    return []
  }

  return wcOrders.map(order => ({
    id: order.id,
    order: `#${order.id}`,
    customer: {
      name: `${order.billing?.first_name || ''} ${order.billing?.last_name || ''}`.trim() || 'Guest',
      email: order.billing?.email || '',
      avatar: '/images/avatars/1.png' // Default avatar
    },
    date: order.date_created,
    status: order.status,
    payment: order.payment_method_title || 'N/A',
    total: order.total,
    method: {
      icon: order.payment_method === 'cod' ? 'tabler-cash' : 'tabler-credit-card',
      name: order.payment_method_title || 'N/A'
    }

    // Add any additional fields needed by your application
  }))
}
