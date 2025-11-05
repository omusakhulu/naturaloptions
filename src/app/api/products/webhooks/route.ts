// src/app/api/products/webhooks/route.ts
import crypto from 'crypto'

import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Type definitions
interface ProductData {
  id: number
  name: string
  price: string
  status: string
  [key: string]: any
}

// WooCommerce webhook signature verification
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex')

  return signature === `sha256=${expectedSignature}`
}

// Handle product updates
async function handleProductUpdate(product: ProductData): Promise<void> {
  try {
    console.log('Syncing product:', product.id)

    // Prepare product data for update (without wooId since it's the key)
    const updateData = {
      name: product.name,
      price: String(parseFloat(product.price) || 0),
      status: product.status || 'publish'
    }

    // Prepare product data for create (includes all required fields)
    const createData = {
      wooId: product.id,  // Use number type
      name: product.name,
      slug: product.slug || product.name.toLowerCase().replace(/\s+/g, '-'),
      price: String(parseFloat(product.price) || 0),
      status: product.status || 'publish'
    }

    // Upsert product in database
    await prisma.product.upsert({
      where: { wooId: product.id },  // Use number type
      update: updateData,
      create: createData
    })

    console.log(`Product ${product.id} synced successfully`)
  } catch (error) {
    console.error('Error syncing product:', error)
    throw error
  }
}

// Handle WooCommerce product webhooks
export async function POST(request: Request) {
  try {
    const signature = request.headers.get('x-wc-webhook-signature')
    const eventType = request.headers.get('x-wc-webhook-topic')
    const secret = process.env.WOOCOMMERCE_WEBHOOK_SECRET || ''

    if (!signature) {
      return NextResponse.json({ error: 'Missing webhook signature' }, { status: 401 })
    }

    // Get raw payload for signature verification
    const payload = await request.text()

    // Verify webhook signature
    if (!verifyWebhookSignature(payload, signature, secret)) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
    }

    const product: ProductData = JSON.parse(payload)

    console.log(`🔔 Received WooCommerce webhook: ${eventType}`)
    console.log(`📦 Product ID: ${product.id}`)

    // Handle different webhook events
    switch (eventType) {
      case 'product.created':
      case 'product.updated':
        await handleProductUpdate(product)
        break
      case 'product.deleted':
        console.log(`🗑️ Product deleted: ${product.id}`)

        // TODO: Handle product deletion
        break
      default:
        console.log(`ℹ️ Unhandled event type: ${eventType}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Webhook error:', error)

    return NextResponse.json({ error: 'Error processing webhook' }, { status: 500 })
  }
}

// Disable body parsing to verify signature
export const config = {
  api: {
    bodyParser: false
  }
}
