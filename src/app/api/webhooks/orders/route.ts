import crypto from 'crypto'

import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

interface OrderLineItem {
  id: number
  name: string
  product_id: number
  variation_id: number
  quantity: number
  sku: string
  price: string
  subtotal: string
  total: string
}

interface OrderWebhookPayload {
  id: number
  number: string
  status: string
  total: string
  subtotal: string
  shipping_total: string
  tax_total: string
  discount_total: string
  payment_method: string
  payment_method_title: string
  customer_note: string
  date_created: string
  date_paid: string
  date_completed: string
  billing: Record<string, any>
  shipping: Record<string, any>
  line_items: OrderLineItem[]
  customer_id: number
  [key: string]: any
}

export async function POST(request: Request) {
  const headers = Object.fromEntries(request.headers.entries())
  
  try {
    // Verify webhook signature
    const signature = headers['x-wc-webhook-signature']
    const secret = process.env.WOOCOMMERCE_WEBHOOK_SECRET || process.env.WOOCOMMERCE_CONSUMER_SECRET || ''

    if (!signature) {
      return NextResponse.json({ error: 'Missing webhook signature' }, { status: 401 })
    }

    const payload = await request.text()
    
    // Verify signature
    const hmac = crypto.createHmac('sha256', secret)
    const digest = 'sha256=' + hmac.update(payload).digest('hex')

    if (signature !== digest) {
      console.warn('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
    }

    const data: OrderWebhookPayload = JSON.parse(payload)
    const eventType = headers['x-wc-webhook-topic']

    console.log(`Order webhook received: ${eventType} for order #${data.number}`)

    switch (eventType) {
      case 'order.created':
        await handleOrderCreated(data)
        break
      case 'order.updated':
        await handleOrderUpdated(data)
        break
      case 'order.deleted':
        await handleOrderDeleted(data)
        break
      default:
        console.log(`Unhandled order event: ${eventType}`)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Order webhook error:', error)
    return NextResponse.json({ error: 'Error processing webhook' }, { status: 500 })
  }
}

async function handleOrderCreated(order: OrderWebhookPayload): Promise<void> {
  try {
    console.log(`Processing new order #${order.number}`)

    // Upsert the order in the database
    await prisma.order.upsert({
      where: { wooId: order.id },
      update: {
        status: order.status,
        total: order.total,
        subtotal: order.subtotal,
        shippingTotal: order.shipping_total,
        taxTotal: order.tax_total,
        discountTotal: order.discount_total,
        paymentMethod: order.payment_method,
        paymentMethodTitle: order.payment_method_title,
        customerNote: order.customer_note,
        datePaid: order.date_paid ? new Date(order.date_paid) : null,
        dateCompleted: order.date_completed ? new Date(order.date_completed) : null,
        billingAddress: JSON.stringify(order.billing),
        shippingAddress: JSON.stringify(order.shipping),
        lineItems: JSON.stringify(order.line_items),
        customer: JSON.stringify({ id: order.customer_id }),
        syncedAt: new Date()
      },
      create: {
        wooId: order.id,
        orderNumber: order.number,
        customerId: order.customer_id || null,
        status: order.status,
        total: order.total,
        subtotal: order.subtotal,
        shippingTotal: order.shipping_total,
        taxTotal: order.tax_total,
        discountTotal: order.discount_total,
        paymentMethod: order.payment_method,
        paymentMethodTitle: order.payment_method_title,
        customerNote: order.customer_note,
        dateCreated: order.date_created ? new Date(order.date_created) : new Date(),
        datePaid: order.date_paid ? new Date(order.date_paid) : null,
        dateCompleted: order.date_completed ? new Date(order.date_completed) : null,
        billingAddress: JSON.stringify(order.billing),
        shippingAddress: JSON.stringify(order.shipping),
        lineItems: JSON.stringify(order.line_items),
        customer: JSON.stringify({ id: order.customer_id }),
        syncedAt: new Date()
      }
    })

    // Process inventory deduction for new orders in processing/completed status
    if (['processing', 'completed', 'on-hold'].includes(order.status)) {
      await reconcileInventoryForOrder(order, 'reserve')
    }

    console.log(`Order #${order.number} created and synced`)
  } catch (error) {
    console.error('Error handling order created:', error)
    throw error
  }
}

async function handleOrderUpdated(order: OrderWebhookPayload): Promise<void> {
  try {
    console.log(`Processing order update #${order.number}, status: ${order.status}`)

    // Get existing order to check status change
    const existingOrder = await prisma.order.findUnique({
      where: { wooId: order.id }
    })

    const previousStatus = existingOrder?.status

    // Update the order
    await prisma.order.update({
      where: { wooId: order.id },
      data: {
        status: order.status,
        total: order.total,
        subtotal: order.subtotal,
        shippingTotal: order.shipping_total,
        taxTotal: order.tax_total,
        discountTotal: order.discount_total,
        paymentMethod: order.payment_method,
        paymentMethodTitle: order.payment_method_title,
        customerNote: order.customer_note,
        datePaid: order.date_paid ? new Date(order.date_paid) : null,
        dateCompleted: order.date_completed ? new Date(order.date_completed) : null,
        billingAddress: JSON.stringify(order.billing),
        shippingAddress: JSON.stringify(order.shipping),
        lineItems: JSON.stringify(order.line_items),
        syncedAt: new Date()
      }
    })

    // Handle inventory based on status transitions
    if (previousStatus !== order.status) {
      await handleStatusTransition(order, previousStatus || '', order.status)
    }

    console.log(`Order #${order.number} updated`)
  } catch (error) {
    console.error('Error handling order updated:', error)
    throw error
  }
}

async function handleOrderDeleted(order: OrderWebhookPayload): Promise<void> {
  try {
    console.log(`Processing order deletion #${order.number}`)

    const existingOrder = await prisma.order.findUnique({
      where: { wooId: order.id }
    })

    if (existingOrder) {
      // Release any reserved stock
      await reconcileInventoryForOrder(order, 'release')

      // Soft delete by updating status
      await prisma.order.update({
        where: { wooId: order.id },
        data: {
          status: 'trash',
          syncedAt: new Date()
        }
      })
    }

    console.log(`Order #${order.number} marked as deleted`)
  } catch (error) {
    console.error('Error handling order deleted:', error)
    throw error
  }
}

async function handleStatusTransition(
  order: OrderWebhookPayload,
  fromStatus: string,
  toStatus: string
): Promise<void> {
  console.log(`Order #${order.number} status: ${fromStatus} -> ${toStatus}`)

  // Status groups for inventory handling
  const reserveStatuses = ['processing', 'on-hold']
  const completeStatuses = ['completed']
  const cancelStatuses = ['cancelled', 'refunded', 'failed']

  // Moving from pending to processing/on-hold: Reserve stock
  if (!reserveStatuses.includes(fromStatus) && reserveStatuses.includes(toStatus)) {
    await reconcileInventoryForOrder(order, 'reserve')
  }

  // Moving to completed: Deduct from actual stock
  if (!completeStatuses.includes(fromStatus) && completeStatuses.includes(toStatus)) {
    await reconcileInventoryForOrder(order, 'complete')
  }

  // Moving to cancelled/refunded: Release reserved stock
  if (!cancelStatuses.includes(fromStatus) && cancelStatuses.includes(toStatus)) {
    await reconcileInventoryForOrder(order, 'release')
  }

  // Refunded from completed: Add stock back
  if (completeStatuses.includes(fromStatus) && toStatus === 'refunded') {
    await reconcileInventoryForOrder(order, 'refund')
  }
}

async function reconcileInventoryForOrder(
  order: OrderWebhookPayload,
  action: 'reserve' | 'complete' | 'release' | 'refund'
): Promise<void> {
  console.log(`Reconciling inventory for order #${order.number}, action: ${action}`)

  for (const item of order.line_items) {
    try {
      // Find product by WooCommerce product ID
      const product = await prisma.product.findUnique({
        where: { wooId: item.product_id }
      })

      if (!product) {
        console.warn(`Product not found for WooCommerce ID ${item.product_id}`)
        continue
      }

      const quantity = item.quantity

      switch (action) {
        case 'reserve':
          // Reserve stock for pending/processing orders
          await prisma.product.update({
            where: { id: product.id },
            data: {
              reservedStock: { increment: quantity }
            }
          })

          await createStockMovement(product.id, {
            type: 'SALE',
            quantity: -quantity,
            beforeActual: product.actualStock,
            afterActual: product.actualStock,
            reference: `ORDER-${order.number}`,
            reason: `Stock reserved for order #${order.number}`,
            notes: `Product: ${item.name}, Qty: ${quantity}`
          })
          break

        case 'complete':
          // Deduct from actual stock when order is completed
          const newActual = Math.max(0, product.actualStock - quantity)
          
          await prisma.product.update({
            where: { id: product.id },
            data: {
              actualStock: newActual,
              reservedStock: { decrement: Math.min(product.reservedStock, quantity) }
            }
          })

          await createStockMovement(product.id, {
            type: 'SALE',
            quantity: -quantity,
            beforeActual: product.actualStock,
            afterActual: newActual,
            reference: `ORDER-${order.number}`,
            reason: `Sold via order #${order.number}`,
            notes: `Product: ${item.name}, Qty: ${quantity}`
          })

          // Check for low stock alert
          if (newActual <= product.lowStockAlert) {
            console.log(`LOW STOCK ALERT: ${product.name} is at ${newActual} units`)
            // TODO: Trigger notification
          }
          break

        case 'release':
          // Release reserved stock for cancelled orders
          await prisma.product.update({
            where: { id: product.id },
            data: {
              reservedStock: { decrement: Math.min(product.reservedStock, quantity) }
            }
          })

          await createStockMovement(product.id, {
            type: 'ADJUSTMENT',
            quantity: quantity,
            beforeActual: product.actualStock,
            afterActual: product.actualStock,
            reference: `ORDER-${order.number}-CANCEL`,
            reason: `Stock released from cancelled order #${order.number}`,
            notes: `Product: ${item.name}, Qty: ${quantity}`
          })
          break

        case 'refund':
          // Add stock back for refunded orders
          const refundedActual = product.actualStock + quantity
          
          await prisma.product.update({
            where: { id: product.id },
            data: {
              actualStock: refundedActual
            }
          })

          await createStockMovement(product.id, {
            type: 'RETURN',
            quantity: quantity,
            beforeActual: product.actualStock,
            afterActual: refundedActual,
            reference: `ORDER-${order.number}-REFUND`,
            reason: `Stock returned from refunded order #${order.number}`,
            notes: `Product: ${item.name}, Qty: ${quantity}`
          })
          break
      }

      console.log(`Inventory reconciled for product ${product.name}: ${action}`)
    } catch (error) {
      console.error(`Error reconciling inventory for item ${item.product_id}:`, error)
    }
  }
}

async function createStockMovement(
  productId: string,
  data: {
    type: 'SALE' | 'PURCHASE' | 'ADJUSTMENT' | 'TRANSFER' | 'SYNC' | 'RETURN' | 'DAMAGE' | 'RECOUNT'
    quantity: number
    beforeActual: number
    afterActual: number
    reference?: string
    reason?: string
    notes?: string
  }
): Promise<void> {
  await prisma.productStockMovement.create({
    data: {
      productId,
      type: data.type,
      quantity: data.quantity,
      beforeActual: data.beforeActual,
      afterActual: data.afterActual,
      reference: data.reference || null,
      reason: data.reason || null,
      notes: data.notes || null,
      userName: 'system'
    }
  })
}

export const config = {
  api: {
    bodyParser: false
  }
}
