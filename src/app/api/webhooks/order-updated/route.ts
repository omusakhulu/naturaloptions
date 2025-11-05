import crypto from 'crypto'

import { NextResponse } from 'next/server'

import { createOrGetPackingSlip } from '@/lib/db/packingSlips'
import { processOrderCompletion, reverseOrderStockMovements } from '@/lib/services/warehouseStockService'

export async function POST(request: Request) {
  try {
    // Get the signature from headers
    const signature = request.headers.get('x-wc-webhook-signature')
    const topic = request.headers.get('x-wc-webhook-topic')

    if (!signature || !topic) {
      console.error('Missing required webhook headers', {
        signature: !!signature,
        topic: !!topic
      })

      return NextResponse.json({ error: 'Missing required headers' }, { status: 400 })
    }

    // Get the raw payload
    const payload = await request.text()

    // Verify the webhook signature
    const hmac = crypto.createHmac('sha256', process.env.WOOCOMMERCE_WEBHOOK_SECRET || '')
    const digest = hmac.update(payload).digest('base64')

    if (signature !== digest) {
      console.error('Invalid webhook signature', {
        received: signature,
        expected: digest
      })

      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const data = JSON.parse(payload)

    // Handle order updated webhook
    if (topic === 'order.updated') {
      await handleOrderUpdated(data)
    } else {
      console.warn(`Unhandled webhook topic: ${topic}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Order updated webhook error:', error)

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleOrderUpdated(order: any) {
  try {
    console.log(`📦 Order updated: ${order.id} (${order.status})`)

    // TODO: Implement order update processing logic
    // Example: Send status update email, update fulfillment, etc.

    console.log('Order update details:', {
      id: order.id,
      status: order.status,
      previousStatus: order.meta_data?.find((meta: any) => meta.key === '_previous_status')?.value,
      total: order.total,
      customerId: order.customer_id
    })

    // Here you would typically:
    // 1. Update order status in database
    // 2. Send status update email
    // 3. Update fulfillment status
    // 4. Trigger any status-specific business logic

    if (order.status === 'completed') {
      try {
        // Create packing slip
        const slip = await createOrGetPackingSlip({ wooOrderId: Number(order.id) })

        console.log('✅ Packing slip ensured for completed order', {
          wooOrderId: order.id,
          packingSlipNumber: slip.packingSlipNumber
        })

        // Process warehouse stock reduction
        const orderNumber = order.number || order.id.toString()
        const lineItems = order.line_items || []

        if (lineItems.length > 0) {
          console.log(`📦 Processing warehouse stock for order ${orderNumber} with ${lineItems.length} items`)
          
          const stockResult = await processOrderCompletion(
            Number(order.id),
            orderNumber,
            lineItems
          )

          if (stockResult.success && stockResult.processedItems > 0) {
            console.log(`✅ Warehouse stock reduced for order ${orderNumber}:`, {
              processedItems: stockResult.processedItems,
              skippedItems: stockResult.skippedItems,
              movements: stockResult.movements.length
            })
          } else {
            console.warn(`⚠️ Warehouse stock processing had issues for order ${orderNumber}:`, {
              errors: stockResult.errors,
              skippedItems: stockResult.skippedItems
            })
          }
        }
      } catch (e) {
        console.error('Failed to process completed order', {
          wooOrderId: order.id,
          error: (e as Error).message
        })
      }
    }

    // Handle order cancellation/refund - reverse stock movements
    if (order.status === 'cancelled' || order.status === 'refunded') {
      try {
        const orderNumber = order.number || order.id.toString()
        
        console.log(`🔄 Reversing warehouse stock for ${order.status} order ${orderNumber}`)
        
        const reverseResult = await reverseOrderStockMovements(orderNumber)

        if (reverseResult.success && reverseResult.processedItems > 0) {
          console.log(`✅ Warehouse stock reversed for order ${orderNumber}:`, {
            processedItems: reverseResult.processedItems,
            skippedItems: reverseResult.skippedItems
          })
        }
      } catch (e) {
        console.error('Failed to reverse warehouse stock', {
          wooOrderId: order.id,
          error: (e as Error).message
        })
      }
    }
  } catch (error) {
    console.error('Error processing order updated webhook:', error)
    throw error
  }
}
