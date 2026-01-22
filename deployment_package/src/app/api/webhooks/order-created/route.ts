import crypto from 'crypto'

import { NextResponse } from 'next/server'

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

    // Handle order created webhook
    if (topic === 'order.created') {
      await handleOrderCreated(data)
    } else {
      console.warn(`Unhandled webhook topic: ${topic}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Order created webhook error:', error)

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleOrderCreated(order: any) {
  try {
    console.log(`🆕 Order created: ${order.id} (${order.status})`)

    // TODO: Implement order processing logic
    // Example: Send confirmation email, update inventory, etc.

    console.log('Order details:', {
      id: order.id,
      status: order.status,
      total: order.total,
      customerId: order.customer_id
    })

    // Here you would typically:
    // 1. Save order to database
    // 2. Send confirmation email
    // 3. Update inventory
    // 4. Trigger any business logic

  } catch (error) {
    console.error('Error processing order created webhook:', error)
    throw error
  }
}
