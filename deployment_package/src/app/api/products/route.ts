// src/app/api/products/webhooks/route.ts
import crypto from 'crypto'

import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import cache, { cacheWrapper, CacheTTL } from '@/lib/cache'

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

    // Prepare product data for upsert
    const productData = {
      wooId: product.id,
      name: product.name || 'Unnamed Product',
      slug: product.slug || `product-${product.id}`,
      description: product.description || null,
      shortDescription: product.short_description || null,
      price: product.price || '0',
      regularPrice: product.regular_price || null,
      salePrice: product.sale_price || null,
      stockStatus: product.stock_status || 'instock',
      stockQuantity: product.stock_quantity || 0,
      websiteStock: product.stock_quantity || 0,
      sku: product.sku || null,
      image: product.images?.[0]?.src || null,
      images: JSON.stringify(product.images || []),
      categories: JSON.stringify(product.categories || []),
      tags: JSON.stringify(product.tags || []),
      attributes: JSON.stringify(product.attributes || []),
      shippingClass: product.shipping_class || null,
      rating: parseFloat(product.average_rating) || 0,
      ratingCount: product.rating_count || 0,
      status: product.status || 'publish',
      syncedAt: new Date()
    }

    // Upsert product in database
    await prisma.product.upsert({
      where: { wooId: product.id },
      update: {
        ...productData,
        updatedAt: new Date()
      },
      create: productData
    })

    // Record stock movement if stock changed
    const existingProduct = await prisma.product.findUnique({
      where: { wooId: product.id }
    })

    if (existingProduct && existingProduct.websiteStock !== product.stock_quantity) {
      await prisma.productStockMovement.create({
        data: {
          productId: existingProduct.id,
          type: 'SYNC',
          quantity: (product.stock_quantity || 0) - existingProduct.websiteStock,
          beforeActual: existingProduct.actualStock,
          afterActual: existingProduct.actualStock,
          beforeWebsite: existingProduct.websiteStock,
          afterWebsite: product.stock_quantity || 0,
          reference: `WOO-SYNC-${product.id}`,
          reason: 'WooCommerce webhook sync',
          userName: 'system'
        }
      })
    }

    console.log(`Product ${product.id} synced successfully`)
  } catch (error) {
    console.error('Error syncing product:', error)
    throw error
  }
}

async function handleProductDelete(product: WebhookPayload): Promise<void> {
  try {
    console.log('Deleting product:', product.id)

    // Find the product by WooCommerce ID
    const existingProduct = await prisma.product.findUnique({
      where: { wooId: product.id }
    })

    if (!existingProduct) {
      console.log(`Product ${product.id} not found in database, skipping delete`)
      return
    }

    // Option 1: Soft delete by setting status to 'trash'
    await prisma.product.update({
      where: { wooId: product.id },
      data: {
        status: 'trash',
        stockStatus: 'outofstock',
        updatedAt: new Date(),
        syncedAt: new Date()
      }
    })

    // Record the deletion as a stock movement
    await prisma.productStockMovement.create({
      data: {
        productId: existingProduct.id,
        type: 'ADJUSTMENT',
        quantity: -existingProduct.actualStock,
        beforeActual: existingProduct.actualStock,
        afterActual: 0,
        beforeWebsite: existingProduct.websiteStock,
        afterWebsite: 0,
        reference: `WOO-DELETE-${product.id}`,
        reason: 'Product deleted from WooCommerce',
        userName: 'system'
      }
    })

    // Zero out stock levels
    await prisma.product.update({
      where: { wooId: product.id },
      data: {
        actualStock: 0,
        websiteStock: 0,
        reservedStock: 0
      }
    })

    console.log(`Product ${product.id} marked as deleted successfully`)
  } catch (error) {
    console.error('Error deleting product:', error)
    throw error
  }
}

async function handleProductStatusUpdate(product: WebhookPayload): Promise<void> {
  try {
    console.log('Updating product status:', product.id, '->', product.status)

    const existingProduct = await prisma.product.findUnique({
      where: { wooId: product.id }
    })

    if (!existingProduct) {
      console.log(`Product ${product.id} not found, creating new product`)
      await handleProductUpdate(product)
      return
    }

    // Update status and related fields
    await prisma.product.update({
      where: { wooId: product.id },
      data: {
        status: product.status,
        stockStatus: product.stock_status || existingProduct.stockStatus,
        updatedAt: new Date(),
        syncedAt: new Date()
      }
    })

    // If product is being unpublished, optionally update inventory visibility
    if (product.status === 'draft' || product.status === 'private') {
      // Could trigger notifications or other business logic here
      console.log(`Product ${product.id} status changed to ${product.status}`)
    }

    console.log(`Product ${product.id} status updated to ${product.status}`)
  } catch (error) {
    console.error('Error updating product status:', error)
    throw error
  }
}

// Disable body parsing to verify signature
export const config = {
  api: {
    bodyParser: false
  }
}
