// MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

// Component Imports
import OrderList from '@views/apps/ecommerce/orders/list'
import { getAllOrders, saveOrders } from '@/lib/db/orders'
import { WooCommerceService } from '@/lib/woocommerce/woocommerce-service'

/**
 * Fetches orders from WooCommerce API
 * @returns {Promise<Array>} Array of orders
 */
async function getWooCommerceOrders() {
  // Service handles auth via env; continue if present

  try {
    const woo = WooCommerceService.getInstance()

    // Fetch orders with pagination (per_page=100)
    let allOrders = []
    let page = 1
    const perPage = 100
    let hasMore = true
    const maxPages = 3

    while (hasMore) {
      if (page > maxPages) {
        hasMore = false
        break
      }
      try {
        const orders = await woo.executeApiRequest(
          `/wp-json/wc/v3/orders?status=any&orderby=date&order=desc&per_page=${perPage}&page=${page}`,
          'GET'
        )

        if (!Array.isArray(orders) || orders.length === 0) {
          hasMore = false
        } else {
          allOrders = [...allOrders, ...orders]
          page++
        }
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error)
        hasMore = false
      }
    }

    // Save orders to database
    try {
      await saveOrders(allOrders)
    } catch (dbError) {
      console.warn('⚠️ Failed to save orders to database:', dbError instanceof Error ? dbError.message : 'Unknown error')
    }

    // Transform WooCommerce orders for display
    const transformedOrders = allOrders.map(order => {
      const dateCreated = order.date_created ? new Date(order.date_created) : new Date()
      const normalizedNumber = String(order.number ?? order.order_number ?? order.id)
      return {
        id: order.id,
        order: normalizedNumber,
        orderNumber: normalizedNumber,
        date: dateCreated,
        time: dateCreated.toLocaleTimeString(),
        status: order.status || 'pending',
        total: order.total || '0',
        subtotal: order.subtotal || '0',
        shippingTotal: order.shipping_total || '0',
        taxTotal: order.tax_total || '0',
        discountTotal: order.discount_total || '0',
        paymentMethod: order.payment_method || '',
        paymentMethodTitle: order.payment_method_title || '',
        customerNote: order.customer_note || '',
        dateCreated: dateCreated,
        datePaid: order.date_paid ? new Date(order.date_paid) : null,
        dateCompleted: order.date_completed ? new Date(order.date_completed) : null,
        shippingAddress: order.shipping || {},
        billingAddress: order.billing || {},
        lineItems: order.line_items || [],
        customer: {
          id: order.customer_id,
          name: order.billing?.first_name && order.billing?.last_name ? `${order.billing.first_name} ${order.billing.last_name}` : 'Guest Customer'
        },
        email: order.billing?.email || '',
        _cachedAt: Date.now()
      }
    })

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
    const dbOrders = await getAllOrders({ take: 500 })

    if (!Array.isArray(dbOrders) || dbOrders.length === 0) return []

    // Transform database orders for display
    const transformedOrders = dbOrders.map(order => ({
      id: order.wooId,
      orderNumber: String(order.orderNumber || order.number || order.wooId),
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
