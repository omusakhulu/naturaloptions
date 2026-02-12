import crypto from 'crypto'

import { NextResponse } from 'next/server'

import { rateLimit } from '@/lib/rate-limiter'

export async function POST(request: Request) {
  try {
    // Rate limiting: 30 requests per minute per IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const { limited } = rateLimit('webhook-order-created', ip, { maxRequests: 30, windowMs: 60_000 })

    if (limited) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

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
    const webhookSecret = process.env.WOOCOMMERCE_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error('WOOCOMMERCE_WEBHOOK_SECRET not configured')

      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    const hmac = crypto.createHmac('sha256', webhookSecret)
    const digest = hmac.update(payload).digest('base64')

    if (signature !== digest) {
      console.error('Invalid webhook signature', {
        received: signature,
        expected: digest
      })

      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    let data

    try {
      data = JSON.parse(payload)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

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
