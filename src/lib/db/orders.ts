import { prisma } from '@/lib/prisma'

if (!process.env.DATABASE_URL) {
  console.warn('⚠️ DATABASE_URL environment variable is not set. Orders will not be saved to database.')
}

export interface OrderData {
  id: number
  order_number?: string
  status?: string
  total?: string
  subtotal?: string
  shipping_total?: string
  tax_total?: string
  discount_total?: string
  payment_method?: string
  payment_method_title?: string
  customer_note?: string
  date_created?: string
  date_paid?: string
  date_completed?: string
  shipping?: any
  billing?: any
  line_items?: any[]
  customer_id?: number
}

/**
 * Save or update an order in the database
 */
export async function saveOrder(orderData: OrderData) {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ Skipping order save: DATABASE_URL not configured')

    return null
  }

  try {
    const order = await prisma.order.upsert({
      where: { wooId: orderData.id },
      update: {
        orderNumber: orderData.order_number || `#${orderData.id}`,
        customerId: orderData.customer_id || null,
        status: orderData.status || 'pending',
        total: orderData.total || null,
        subtotal: orderData.subtotal || null,
        shippingTotal: orderData.shipping_total || null,
        taxTotal: orderData.tax_total || null,
        discountTotal: orderData.discount_total || null,
        paymentMethod: orderData.payment_method || null,
        paymentMethodTitle: orderData.payment_method_title || null,
        customerNote: orderData.customer_note || null,
        dateCreated: orderData.date_created ? new Date(orderData.date_created) : null,
        datePaid: orderData.date_paid ? new Date(orderData.date_paid) : null,
        dateCompleted: orderData.date_completed ? new Date(orderData.date_completed) : null,
        shippingAddress: JSON.stringify(orderData.shipping || {}),
        billingAddress: JSON.stringify(orderData.billing || {}),
        lineItems: JSON.stringify(orderData.line_items || []),
        customer: JSON.stringify(orderData.customer_id ? { id: orderData.customer_id } : {}),
        syncedAt: new Date()
      },
      create: {
        wooId: orderData.id,
        orderNumber: orderData.order_number || `#${orderData.id}`,
        customerId: orderData.customer_id || null,
        status: orderData.status || 'pending',
        total: orderData.total || null,
        subtotal: orderData.subtotal || null,
        shippingTotal: orderData.shipping_total || null,
        taxTotal: orderData.tax_total || null,
        discountTotal: orderData.discount_total || null,
        paymentMethod: orderData.payment_method || null,
        paymentMethodTitle: orderData.payment_method_title || null,
        customerNote: orderData.customer_note || null,
        dateCreated: orderData.date_created ? new Date(orderData.date_created) : null,
        datePaid: orderData.date_paid ? new Date(orderData.date_paid) : null,
        dateCompleted: orderData.date_completed ? new Date(orderData.date_completed) : null,
        shippingAddress: JSON.stringify(orderData.shipping || {}),
        billingAddress: JSON.stringify(orderData.billing || {}),
        lineItems: JSON.stringify(orderData.line_items || []),
        customer: JSON.stringify(orderData.customer_id ? { id: orderData.customer_id } : {}),
        syncedAt: new Date()
      }
    })

    return order
  } catch (error) {
    console.error('Error saving order:', error instanceof Error ? error.message : 'Unknown error')
    throw error
  }
}

/**
 * Save multiple orders to database
 */
export async function saveOrders(ordersData: OrderData[]) {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ Skipping orders save: DATABASE_URL not configured')

    return []
  }

  try {
    const savedOrders = await Promise.all(ordersData.map(order => saveOrder(order)))

    return savedOrders
  } catch (error) {
    console.error('Error saving orders:', error instanceof Error ? error.message : 'Unknown error')
    throw error
  }
}

/**
 * Get all orders from database
 */
export async function getAllOrders() {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ Skipping orders fetch: DATABASE_URL not configured')

    return []
  }

  try {
    const orders = await prisma.order.findMany({
      orderBy: { dateCreated: 'desc' }
    })

    return orders
  } catch (error) {
    console.error('Error fetching orders:', error instanceof Error ? error.message : 'Unknown error')

    return []
  }
}

/**
 * Get order by WooCommerce ID
 */
export async function getOrderByWooId(wooId: number) {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ Skipping order fetch: DATABASE_URL not configured')

    return null
  }

  try {
    const order = await prisma.order.findUnique({
      where: { wooId }
    })

    return order
  } catch (error) {
    console.error('Error fetching order:', error instanceof Error ? error.message : 'Unknown error')

    return null
  }
}

/**
 * Delete order by WooCommerce ID
 */
export async function deleteOrder(wooId: number) {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ Skipping order delete: DATABASE_URL not configured')

    return null
  }

  try {
    const order = await prisma.order.delete({
      where: { wooId }
    })

    return order
  } catch (error) {
    console.error('Error deleting order:', error instanceof Error ? error.message : 'Unknown error')

    return null
  }
}

/**
 * Clear all orders from database
 */
export async function clearAllOrders() {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ Skipping orders clear: DATABASE_URL not configured')

    return null
  }

  try {
    const result = await prisma.order.deleteMany({})

    return result
  } catch (error) {
    console.error('Error clearing orders:', error instanceof Error ? error.message : 'Unknown error')

    return null
  }
}

/**
 * Get all orders for a specific customer
 */
export async function getOrdersByCustomerId(customerId: number) {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ Skipping orders fetch: DATABASE_URL not configured')

    return []
  }

  try {
    const orders = await prisma.order.findMany({
      where: { customerId },
      orderBy: { dateCreated: 'desc' }
    })

    return orders
  } catch (error) {
    console.error('Error fetching orders by customer ID:', error instanceof Error ? error.message : 'Unknown error')

    return []
  }
}
