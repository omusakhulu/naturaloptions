// MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

// Component Imports
import OrderList from '@views/apps/ecommerce/orders/list'
import { getAllOrders } from '@/lib/db/orders'

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
  // Fetch orders from database
  const ordersData = await getOrdersFromDatabase()

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
