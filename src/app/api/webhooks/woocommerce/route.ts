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

      case 'coupon.created':
      case 'coupon.updated':
        await handleCouponUpdate(data)
        break

      case 'coupon.deleted':
        await handleCouponDelete(data.id)
        break

      case 'order.created':
      case 'order.updated':
        await handleOrderUpdate(data)
        break

      case 'order.deleted':
        await handleOrderDelete(data.id)
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
        tags: JSON.stringify(productData.tags || []),
        attributes: JSON.stringify(productData.attributes || []),
        shippingClass: productData.shipping_class || null,
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
        tags: JSON.stringify(productData.tags || []),
        attributes: JSON.stringify(productData.attributes || []),
        shippingClass: productData.shipping_class || null
      }
    })
  } catch (error) {
    console.error('Error updating product from webhook:', error)
    throw error
  }
}

async function handleCouponUpdate(couponData: any) {
  try {
    await prisma.coupon.upsert({
      where: { wooId: couponData.id },
      update: {
        code: couponData.code,
        amount: couponData.amount,
        dateCreated: new Date(couponData.date_created),
        dateModified: new Date(couponData.date_modified),
        discountType: couponData.discount_type,
        description: couponData.description || null,
        expiryDate: couponData.date_expires ? new Date(couponData.date_expires) : null,
        usageLimit: couponData.usage_limit || null,
        usageCount: couponData.usage_count || 0,
        individualUse: couponData.individual_use || false,
        productIds: JSON.stringify(couponData.product_ids || []),
        excludeProductIds: JSON.stringify(couponData.excluded_product_ids || []),
        syncedAt: new Date()
      },
      create: {
        wooId: couponData.id,
        code: couponData.code,
        amount: couponData.amount,
        dateCreated: new Date(couponData.date_created),
        dateModified: new Date(couponData.date_modified),
        discountType: couponData.discount_type,
        description: couponData.description || null,
        expiryDate: couponData.date_expires ? new Date(couponData.date_expires) : null,
        usageLimit: couponData.usage_limit || null,
        usageCount: couponData.usage_count || 0,
        individualUse: couponData.individual_use || false,
        productIds: JSON.stringify(couponData.product_ids || []),
        excludeProductIds: JSON.stringify(couponData.excluded_product_ids || [])
      }
    })
  } catch (error) {
    console.error('Error updating coupon from webhook:', error)
    throw error
  }
}

async function handleCouponDelete(couponId: number) {
  try {
    await prisma.coupon.deleteMany({
      where: { wooId: couponId }
    })
  } catch (error) {
    console.error('Error deleting coupon from webhook:', error)
    throw error
  }
}

async function handleOrderUpdate(orderData: any) {
  try {
    await prisma.order.upsert({
      where: { wooId: orderData.id },
      update: {
        orderNumber: orderData.number,
        customerId: orderData.customer_id || null,
        status: orderData.status,
        total: orderData.total,
        subtotal: orderData.subtotal || null,
        shippingTotal: orderData.shipping_total || null,
        taxTotal: orderData.total_tax || null,
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
        updatedAt: new Date(),
        syncedAt: new Date()
      },
      create: {
        wooId: orderData.id,
        orderNumber: orderData.number,
        customerId: orderData.customer_id || null,
        status: orderData.status,
        total: orderData.total,
        subtotal: orderData.subtotal || null,
        shippingTotal: orderData.shipping_total || null,
        taxTotal: orderData.total_tax || null,
        discountTotal: orderData.discount_total || null,
        paymentMethod: orderData.payment_method || null,
        paymentMethodTitle: orderData.payment_method_title || null,
        customerNote: orderData.customer_note || null,
        dateCreated: orderData.date_created ? new Date(orderData.date_created) : null,
        datePaid: orderData.date_paid ? new Date(orderData.date_paid) : null,
        dateCompleted: orderData.date_completed ? new Date(orderData.date_completed) : null,
        shippingAddress: JSON.stringify(orderData.shipping || {}),
        billingAddress: JSON.stringify(orderData.billing || {}),
        lineItems: JSON.stringify(orderData.line_items || [])
      }
    })
  } catch (error) {
    console.error('Error updating order from webhook:', error)
    throw error
  }
}

async function handleOrderDelete(orderId: number) {
  try {
    await prisma.order.deleteMany({
      where: { wooId: orderId }
    })
  } catch (error) {
    console.error('Error deleting order from webhook:', error)
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
