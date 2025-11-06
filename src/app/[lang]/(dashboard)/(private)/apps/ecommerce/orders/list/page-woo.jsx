// MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

// Component Imports
import OrderList from '@views/apps/ecommerce/orders/list'
import { wooClient } from '@/lib/woocommerce'
import { getAllOrders, saveOrders } from '@/lib/db/orders'

/**
 * Fetches orders from WooCommerce API
 * @returns {Promise<Array>} Array of orders
 */
async function getWooCommerceOrders() {
  const requiredEnvVars = ['WOO_STORE_URL', 'WOO_CONSUMER_KEY', 'WOO_CONSUMER_SECRET']
  const missingVars = requiredEnvVars.filter(v => !process.env[v])

  if (missingVars.length) {
    console.warn('Missing Woo env vars; skipping Woo fetch')

return []
  }

  try {
    console.log('Fetching orders from WooCommerce via wooClient...')
    const perPage = 100
    let page = 1
    let hasMore = true
    const allOrders = []

    while (hasMore) {
      const res = await wooClient.get('orders', {
        status: 'any',
        per_page: perPage,
        page: page,
        orderby: 'date',
        order: 'desc'
      })

      const orders = res.data || []

      if (!Array.isArray(orders) || orders.length === 0) {
        hasMore = false
      } else {
        allOrders.push(...orders)
        console.log(`📦 fetched ${orders.length} orders page ${page}`)
        page += 1
      }
    }

    console.log(`Total Woo orders fetched: ${allOrders.length}`)

    try {
      await saveOrders(allOrders)
      console.log('Saved orders to DB')
    } catch (e) {
      console.warn('Failed saving Woo orders to DB:', e?.message)
    }

    return allOrders.map(o => ({
      id: o.id,
      orderNumber: o.order_number || `#${o.id}`,
      status: o.status,
      total: o.total,
      subtotal: o.subtotal,
      shippingTotal: o.shipping_total,
      taxTotal: o.tax_total,
      discountTotal: o.discount_total,
      paymentMethod: o.payment_method,
      paymentMethodTitle: o.payment_method_title,
      customerNote: o.customer_note,
      dateCreated: o.date_created ? new Date(o.date_created) : null,
      datePaid: o.date_paid ? new Date(o.date_paid) : null,
      dateCompleted: o.date_completed ? new Date(o.date_completed) : null,
      shippingAddress: o.shipping || {},
      billingAddress: o.billing || {},
      lineItems: o.line_items || [],
      customer: { id: o.customer_id },
      _cachedAt: Date.now()
    }))
  } catch (err) {
    console.error('WooClient orders fetch failed:', err?.message)

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
