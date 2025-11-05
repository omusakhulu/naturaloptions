// Next Imports
import { redirect } from 'next/navigation'

// Component Imports
import OrderDetails from '@views/apps/ecommerce/orders/details'
import { WooCommerceService } from '@/lib/woocommerce/woocommerce-service'

// Database Imports
import { getOrderByWooId } from '@/lib/db/orders'

const OrderDetailsPage = async props => {
  const params = await props.params

  if (!params || !params.id) {
    console.error('Order ID not provided')
    redirect('/not-found')
  }

  const orderId = parseInt(params.id)

  if (isNaN(orderId)) {
    console.error(`Invalid order ID: ${params.id}`)
    redirect('/not-found')
  }

  // Try WooCommerce live first for exact match
  let transformedOrder

  try {
    const woo = WooCommerceService.getInstance()
    const order = await woo.executeApiRequest(`/wp-json/wc/v3/orders/${orderId}`, 'GET')
    const dateCreated = order.date_created ? new Date(order.date_created) : null
    const datePaid = order.date_paid ? new Date(order.date_paid) : null
    const dateCompleted = order.date_completed ? new Date(order.date_completed) : null
    const normalizedNumber = String(order.number ?? order.order_number ?? order.id)

    const findMeta = (needles = []) => {
      try {
        const list = Array.isArray(order?.meta_data) ? order.meta_data : []
        const lowered = needles.map(k => String(k).toLowerCase())

        // direct key match
        let hit = list.find(m => lowered.includes(String(m?.key || m?.display_key || '').toLowerCase()))

        if (!hit) {
          // fuzzy includes on key
          hit = list.find(m => {
            const k = String(m?.key || m?.display_key || '').toLowerCase()

            return lowered.some(n => k.includes(n))
          })
        }

        const val = hit?.value ?? hit?.display_value ?? ''

        if (val) return val
      } catch {}

      return ''
    }

    // Try meta_data first, then fall back to billing/shipping custom fields commonly used
    let boothNumber = findMeta(['booth number', 'booth_number', 'booth'])
    let vatNumber = findMeta(['vat number', 'vat_number', 'vat'])

    if (!boothNumber)
      boothNumber = order?.billing?.booth_number || order?.shipping?.booth_number || order?.billing?.booth || ''
    if (!vatNumber) vatNumber = order?.billing?.vat_number || order?.shipping?.vat_number || order?.billing?.vat || ''

    transformedOrder = {
      id: order.id,
      order: normalizedNumber,
      orderNumber: normalizedNumber,
      status: order.status || 'pending',
      total: order.total || '0',
      subtotal: order.subtotal || order.total, // Woo may not send subtotal directly depending on plugins
      shippingTotal: order.shipping_total || '0',
      taxTotal: order.tax_total || '0',
      discountTotal: order.discount_total || '0',
      paymentMethod: order.payment_method || '',
      paymentMethodTitle: order.payment_method_title || '',
      customerNote: order.customer_note || '',
      dateCreated,
      datePaid,
      dateCompleted,
      shippingAddress: order.shipping || {},
      billingAddress: order.billing || {},
      lineItems: Array.isArray(order.line_items) ? order.line_items : [],
      boothNumber,
      vatNumber,
      customer: {
        id: order.customer_id,
        name:
          order.billing?.first_name && order.billing?.last_name
            ? `${order.billing.first_name} ${order.billing.last_name}`
            : 'Guest Customer',
        email: order.billing?.email || ''
      }
    }
  } catch (e) {
    // Fallback to DB
    const orderData = await getOrderByWooId(orderId)

    if (!orderData) {
      console.warn(`Order ${orderId} not found in database`)
      redirect('/not-found')
    }

    let boothNumber = ''
    let vatNumber = ''

    try {
      const meta = orderData.meta ? JSON.parse(orderData.meta) : {}

      boothNumber = meta?.boothNumber || meta?.booth_number || meta?.booth || ''
      vatNumber = meta?.vatNumber || meta?.vat_number || meta?.vat || ''
    } catch {}

    transformedOrder = {
      id: orderData.wooId,
      order: String(orderData.orderNumber || orderData.number || orderData.wooId),
      orderNumber: String(orderData.orderNumber || orderData.number || orderData.wooId),
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
      boothNumber,
      vatNumber,
      customer: orderData.customer ? JSON.parse(orderData.customer) : {}
    }
  }

  return <OrderDetails orderData={transformedOrder} order={orderId} locale={params.lang} />
}

export default OrderDetailsPage
