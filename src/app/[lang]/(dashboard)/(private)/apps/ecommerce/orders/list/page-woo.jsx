// MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

// Component Imports
import OrderList from '@views/apps/ecommerce/orders/list'
import { getAllOrders, saveOrders } from '@/lib/db/orders'

/**
 * Fetches orders from WooCommerce API
 * @returns {Promise<Array>} Array of orders
 */
async function getWooCommerceOrders() {
  const requiredEnvVars = ['WOO_STORE_URL', 'WOO_CONSUMER_KEY', 'WOO_CONSUMER_SECRET']
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars.join(', '))
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
  }

  try {
    console.log('Fetching fresh orders from WooCommerce...')

    let WooRentalBridge
    try {
      const wooModule = await import('woorental-bridge')
      WooRentalBridge = wooModule.default || wooModule
    } catch (error) {
      console.warn('Failed to load woorental-bridge:', error.message)
      WooRentalBridge = class {
        constructor(config) {
          this.config = config
        }
      }
    }

    const wooConnector = new WooRentalBridge({
      storeUrl: process.env.WOO_STORE_URL,
      consumerKey: process.env.WOO_CONSUMER_KEY,
      consumerSecret: process.env.WOO_CONSUMER_SECRET,
      timeout: 60000
    })

    // Fetch orders with pagination
    let allOrders = []
    let page = 1
    const perPage = 100
    let hasMore = true

    while (hasMore) {
      try {
        const orders = await wooConnector.products.listOrders({
          status: 'any',
          per_page: perPage,
          page: page,
          orderby: 'date',
          order: 'desc'
        })

        if (!Array.isArray(orders) || orders.length === 0) {
          hasMore = false
        } else {
          allOrders = [...allOrders, ...orders]
          console.log(`📦 Fetched ${orders.length} orders from page ${page}`)
          page++
        }
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error)
        hasMore = false
      }
    }

    console.log(`Received ${allOrders.length} orders from WooCommerce`)

    // Save orders to database
    try {
      await saveOrders(allOrders)
      console.log(`✅ Saved ${allOrders.length} orders to database`)
    } catch (dbError) {
      console.warn('⚠️ Failed to save orders to database:', dbError instanceof Error ? dbError.message : 'Unknown error')
    }

    // Transform WooCommerce orders for display
    const transformedOrders = allOrders.map(order => ({
      id: order.id,
      orderNumber: order.order_number || `#${order.id}`,
      status: order.status || 'pending',
      total: order.total || '0',
      subtotal: order.subtotal || '0',
      shippingTotal: order.shipping_total || '0',
      taxTotal: order.tax_total || '0',
      discountTotal: order.discount_total || '0',
      paymentMethod: order.payment_method || '',
      paymentMethodTitle: order.payment_method_title || '',
      customerNote: order.customer_note || '',
      dateCreated: order.date_created ? new Date(order.date_created) : null,
      datePaid: order.date_paid ? new Date(order.date_paid) : null,
      dateCompleted: order.date_completed ? new Date(order.date_completed) : null,
      shippingAddress: order.shipping || {},
      billingAddress: order.billing || {},
      lineItems: order.line_items || [],
      customer: { id: order.customer_id } || {},
      _cachedAt: Date.now()
    }))

    console.log(`Transformed ${transformedOrders.length} orders for display`)
    return transformedOrders
  } catch (error) {
    console.error('Failed to fetch WooCommerce orders:', {
      name: error.name,
      message: error.message,
      status: error.response?.status
    })

    // Fall back to database if WooCommerce fails
    console.log('Falling back to database orders...')
    return []
  }
}

/**
 * Fetches orders from database
 * @returns {Promise<Array>} Array of orders
 */
async function getOrdersFromDatabase() {
  try {
    console.log('Fetching orders from database...')
    const dbOrders = await getAllOrders()

    if (!Array.isArray(dbOrders) || dbOrders.length === 0) {
      console.log('No orders found in database')
      return []
    }

    console.log(`Found ${dbOrders.length} orders in database`)

    // Transform database orders for display
    const transformedOrders = dbOrders.map(order => ({
      id: order.wooId,
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.total,
      subtotal: order.subtotal,
      shippingTotal: order.shippingTotal,
      taxTotal: order.taxTotal,
      discountTotal: order.discountTotal,
      paymentMethod: order.paymentMethod,
      paymentMethodTitle: order.paymentMethodTitle,
      customerNote: order.customerNote,
      dateCreated: order.dateCreated,
      datePaid: order.datePaid,
      dateCompleted: order.dateCompleted,
      shippingAddress: order.shippingAddress ? JSON.parse(order.shippingAddress) : {},
      billingAddress: order.billingAddress ? JSON.parse(order.billingAddress) : {},
      lineItems: order.lineItems ? JSON.parse(order.lineItems) : [],
      customer: order.customer ? JSON.parse(order.customer) : {},
      _cachedAt: Date.now()
    }))

    console.log(`Transformed ${transformedOrders.length} orders for display`)
    return transformedOrders
  } catch (error) {
    console.error('Failed to fetch orders from database:', error instanceof Error ? error.message : 'Unknown error')
    return []
  }
}

const OrdersListPage = async () => {
  // Try to fetch from WooCommerce first
  let ordersData = await getWooCommerceOrders()

  // If WooCommerce fails, fall back to database
  if (!ordersData || ordersData.length === 0) {
    console.log('No orders from WooCommerce, fetching from database...')
    ordersData = await getOrdersFromDatabase()
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <Typography variant='h4'>Orders</Typography>
        </div>
      </Grid>
      <Grid item xs={12}>
        {Array.isArray(ordersData) && ordersData.length > 0 ? (
          <OrderList orderData={ordersData} />
        ) : (
          <div className='flex items-center justify-center p-8'>
            <Typography variant='h6'>No orders found or failed to load orders.</Typography>
          </div>
        )}
      </Grid>
    </Grid>
  )
}

export default OrdersListPage
