// MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

// Component Imports
import OrderEditForm from '@views/apps/ecommerce/orders/edit/OrderEditForm'

// Database Imports
import { getOrderByWooId } from '@/lib/db/orders'

const OrderEditPage = async props => {
  const params = await props.params
  const orderId = parseInt(params.id)

  // Fetch order from database
  let orderData = await getOrderByWooId(orderId)

  if (!orderData) {
    return (
      <Grid container spacing={6}>
        <Grid size={12}>
          <Typography variant='h4'>Order not found</Typography>
        </Grid>
      </Grid>
    )
  }

  // Transform database order for display
  const transformedOrder = {
    id: orderData.wooId,
    order: orderData.wooId,
    orderNumber: orderData.orderNumber,
    status: orderData.status,
    total: orderData.total,
    subtotal: orderData.subtotal,
    shippingTotal: orderData.shippingTotal,
    taxTotal: orderData.taxTotal,
    discountTotal: orderData.discountTotal,
    paymentMethod: orderData.paymentMethod,
    paymentMethodTitle: orderData.paymentMethodTitle,
    customerNote: orderData.customerNote,
    dateCreated: orderData.dateCreated,
    datePaid: orderData.datePaid,
    dateCompleted: orderData.dateCompleted,
    shippingAddress: orderData.shippingAddress ? JSON.parse(orderData.shippingAddress) : {},
    billingAddress: orderData.billingAddress ? JSON.parse(orderData.billingAddress) : {},
    lineItems: orderData.lineItems ? JSON.parse(orderData.lineItems) : [],
    customer: orderData.customer ? JSON.parse(orderData.customer) : {},
    date: orderData.dateCreated,
    time: orderData.dateCreated ? new Date(orderData.dateCreated).toLocaleTimeString() : ''
  }

  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        <Typography variant='h4'>Edit Order #{params.id}</Typography>
      </Grid>
      <Grid size={12}>
        <OrderEditForm orderData={transformedOrder} />
      </Grid>
    </Grid>
  )
}

export default OrderEditPage
