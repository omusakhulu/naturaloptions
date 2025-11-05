import crypto from 'crypto'

import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest
): Promise<NextResponse> {
  try {
    // 1. Get webhook headers
    const signature = request.headers.get('x-wc-webhook-signature')
    const topic = request.headers.get('x-wc-webhook-topic')
    const deliveryId = request.headers.get('x-wc-webhook-id')
    const event = request.headers.get('x-wc-webhook-event')

    // Log received headers for debugging
    const headers = {
      'x-wc-webhook-signature': !!signature,
      'x-wc-webhook-topic': !!topic,
      'x-wc-webhook-id': !!deliveryId,
      'x-wc-webhook-event': !!event,
      'user-agent': request.headers.get('user-agent')
    }

    console.log('Received webhook headers:', headers)

    // Validate required headers
    const missingHeaders: string[] = [
      !signature && 'x-wc-webhook-signature',
      !topic && 'x-wc-webhook-topic',
      !deliveryId && 'x-wc-webhook-id',
      !event && 'x-wc-webhook-event'
    ].filter((x): x is string => Boolean(x))

    if (missingHeaders.length > 0) {
      const errorMessage = `Missing required webhook headers: ${missingHeaders.join(', ')}`

      console.error(errorMessage, {
        signature: !!signature,
        topic: !!topic,
        deliveryId: !!deliveryId,
        event: !!event
      })

      return NextResponse.json(
        {
          error: errorMessage,
          missingHeaders,
          receivedHeaders: {
            'x-wc-webhook-signature': !!signature,
            'x-wc-webhook-topic': !!topic,
            'x-wc-webhook-id': !!deliveryId,
            'x-wc-webhook-event': !!event
          }
        },
        { status: 400 }
      )
    }

    // Verify webhook secret
    const webhookSecret = process.env.WOOCOMMERCE_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error('WOOCOMMERCE_WEBHOOK_SECRET is not set')

      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Read and verify the payload
    const payload = await request.text()

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('base64')

    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature', {
        received: signature,
        expected: expectedSignature
      })

      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const data = JSON.parse(payload)

    // Enhanced logging for debugging
    console.log('=== Webhook Payload ===')
    console.log('Headers:', headers)
    console.log('Topic:', topic)
    console.log('Event:', event)
    console.log('Delivery ID:', deliveryId)
    console.log('Payload data:', JSON.stringify(data, null, 2))
    console.log('========================')

    // 2. Handle different webhook events
    switch (topic) {
      case 'product.created':
      case 'product.updated':
        await handleProductUpdate(data)
        break

      case 'product.deleted':
        await handleProductDelete(data.id)
        break

      // Add more webhook handlers as needed

      default:
        console.log(`Unhandled webhook event: ${topic}`, { event, data })
    }

    return NextResponse.json(
      { received: true, event, topic },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error processing webhook:', error)

    return NextResponse.json(
      { 
        error: 'Error processing webhook',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function handleProductUpdate(productData: any) {
  try {
    // Update or create product in database
    await prisma.product.upsert({
      where: { wooId: productData.id },
      update: {
        name: productData.name,
        slug: productData.slug,
        description: productData.description || null,
        shortDescription: productData.short_description || null,
        price: productData.price || null,
        regularPrice: productData.regular_price || null,
        salePrice: productData.sale_price || null,
        stockStatus: productData.stock_status || 'instock',
        stockQuantity: productData.stock_quantity || 0,
        sku: productData.sku || null,
        image: productData.images?.[0]?.src || null,
        images: JSON.stringify(productData.images || []),
        categories: JSON.stringify(productData.categories || []),
        status: productData.status || 'publish',
        updatedAt: new Date()
      },
      create: {
        wooId: productData.id,
        name: productData.name,
        slug: productData.slug,
        description: productData.description || null,
        shortDescription: productData.short_description || null,
        price: productData.price || null,
        regularPrice: productData.regular_price || null,
        salePrice: productData.sale_price || null,
        stockStatus: productData.stock_status || 'instock',
        stockQuantity: productData.stock_quantity || 0,
        sku: productData.sku || null,
        image: productData.images?.[0]?.src || null,
        images: JSON.stringify(productData.images || []),
        categories: JSON.stringify(productData.categories || []),
        status: productData.status || 'publish'
      }
    })
  } catch (error) {
    console.error('Error updating product from webhook:', error)
    throw error
  }
}

async function handleProductDelete(productId: number) {
  try {
    // Delete product from database
    await prisma.product.deleteMany({
      where: { wooId: productId }
    })
  } catch (error) {
    console.error('Error deleting product from webhook:', error)
    throw error
  }
}
