import crypto from 'crypto'

import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { logger } from '@/utils/logger'

export async function POST(request: Request) {
  try {
    // Get the signature from headers
    const signature = request.headers.get('x-wc-webhook-signature')
    const topic = request.headers.get('x-wc-webhook-topic')

    if (!signature || !topic) {
      logger.error('Missing required webhook headers', {
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
      logger.error('Invalid webhook signature', {
        received: signature,
        expected: digest
      })

      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const data = JSON.parse(payload)

    // Handle different webhook events
    switch (topic) {
      case 'product.updated':
      case 'product.created':
        await handleProductUpdate(data)
        break
      case 'product.deleted':
        await handleProductDelete(data.id)
        break
      default:
        logger.warn(`Unhandled webhook topic: ${topic}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Webhook handler error:', error)

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleProductUpdate(product: any) {
  try {
    const { id, name, sku, price, status, stock_quantity, stock_status } = product

    await prisma.product.upsert({
      where: { wooId: id },
      update: {
        name,
        sku,
        price: price ? String(price) : null,
        status,
        stockQuantity: stock_quantity,
        stockStatus: stock_status,
        updatedAt: new Date()
      },
      create: {
        wooId: id,
        name,
        slug: product.slug || name?.toLowerCase().replace(/\s+/g, '-') || `product-${id}`,
        sku,
        price: price ? String(price) : null,
        status,
        stockQuantity: stock_quantity,
        stockStatus: stock_status
      }
    })

    logger.info(`Product ${id} updated via webhook`)
  } catch (error) {
    logger.error('Error updating product from webhook:', error)
    throw error
  }
}

async function handleProductDelete(productId: number) {
  try {
    await prisma.product.deleteMany({
      where: { wooId: productId }
    })
    logger.info(`Product ${productId} deleted via webhook`)
  } catch (error) {
    logger.error('Error deleting product from webhook:', error)
    throw error
  }
}
