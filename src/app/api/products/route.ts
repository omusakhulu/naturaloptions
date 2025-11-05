// src/app/api/products/webhooks/route.ts
import crypto from 'crypto'

import { NextResponse } from 'next/server'

import { wooClient } from '@/lib/woocommerce'

// In-memory rate limiting
const rateLimit = new Map<string, { timestamp: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS = 10 // Max 10 requests per minute per IP

// Type definitions
interface WebhookPayload {
  id: number
  name: string
  price: string
  status: string
  [key: string]: any
}

interface WebhookHeaders {
  'x-wc-webhook-signature'?: string
  'x-wc-webhook-topic'?: string
  'x-wc-webhook-id'?: string
  'x-forwarded-for'?: string | null
  [key: string]: any
}

export async function POST(request: Request) {
  const headers = Object.fromEntries(request.headers.entries()) as WebhookHeaders
  const ip = headers['x-forwarded-for']?.split(',')[0]?.trim() || '127.0.0.1'
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW

  // Clean up old entries
  for (const [ip, { timestamp }] of rateLimit.entries()) {
    if (timestamp < windowStart) rateLimit.delete(ip)
  }

  // Check rate limit
  const requestCount = Array.from(rateLimit.values()).filter(entry => entry.timestamp > windowStart).length

  if (requestCount >= MAX_REQUESTS) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  rateLimit.set(ip, { timestamp: now })

  try {
    // Verify webhook signature
    const signature = headers['x-wc-webhook-signature']
    const secret = process.env.WOOCOMMERCE_WEBHOOK_SECRET || process.env.WOOCOMMERCE_CONSUMER_SECRET || ''

    if (!signature) {
      return NextResponse.json({ error: 'Missing webhook signature' }, { status: 401 })
    }

    // Get raw payload
    const payload = await request.text()

    // Verify signature
    const hmac = crypto.createHmac('sha256', secret)
    const digest = 'sha256=' + hmac.update(payload).digest('hex')

    if (signature !== digest) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
    }

    // Parse and process the payload
    const data: WebhookPayload = JSON.parse(payload)
    const eventType = headers['x-wc-webhook-topic']
    const webhookId = headers['x-wc-webhook-id']

    console.log(`Webhook received: ${eventType} (${webhookId})`)

    // Route to appropriate handler
    switch (eventType) {
      case 'product.created':
      case 'product.updated':
        await handleProductUpdate(data)
        break
      case 'product.deleted':
        await handleProductDelete(data)
        break
      default:
        console.log(`Unhandled event type: ${eventType}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)

    return NextResponse.json({ error: 'Error processing webhook' }, { status: 500 })
  }
}

async function handleProductUpdate(product: WebhookPayload): Promise<void> {
  try {
    console.log('Syncing product:', product.id)

    // Example: Save to your database
    const productData = {
      wooId: product.id,
      name: product.name,
      price: product.price,
      status: product.status
    }

    // TODO: Implement your database update logic here
    // Example:
    // await prisma.product.upsert({
    //   where: { wooId: product.id },
    //   update: productData,
    //   create: productData,
    // });

    console.log(`Product ${product.id} synced successfully`)
  } catch (error) {
    console.error('Error syncing product:', error)
    throw error
  }
}

async function handleProductDelete(product: WebhookPayload): Promise<void> {
  try {
    console.log('Deleting product:', product.id)

    // TODO: Implement your product deletion logic here
  } catch (error) {
    console.error('Error deleting product:', error)
    throw error
  }
}

// Disable body parsing to verify signature
export const config = {
  api: {
    bodyParser: false
  }
}
