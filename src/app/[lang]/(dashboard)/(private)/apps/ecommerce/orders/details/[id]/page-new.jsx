// Next Imports
import { redirect } from 'next/navigation'

// Component Imports
import OrderDetails from '@views/apps/ecommerce/orders/details'

// Database Imports
import { getOrderByWooId } from '@/lib/db/orders'

const OrderDetailsPage = async props => {
  const params = await props.params
  const orderId = parseInt(params.id)

  // Try to fetch from database first
  let orderData = await getOrderByWooId(orderId)

  if (!orderData) {
    console.warn(`Order ${orderId} not found in database`)
    redirect('/not-found')
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
    customer: orderData.customer ? JSON.parse(orderData.customer) : {}
  }

  return <OrderDetails orderData={transformedOrder} order={params.id} />
}

export default OrderDetailsPage
