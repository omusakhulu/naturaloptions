// Next.js and external imports
import { NextResponse } from 'next/server'

// Internal imports
import { wooClient } from '@/lib/woocommerce'
import { logger } from '@/utils/logger'

export async function POST() {
  try {
    if (!process.env.WOOCOMMERCE_WEBHOOK_SECRET) {
      throw new Error('WOOCOMMERCE_WEBHOOK_SECRET is not set in environment variables')
    }

    // In src/app/api/webhooks/register/route.js
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/product-update`

    const webhookEvents = ['product.updated', 'product.created', 'product.deleted']

    const results = await Promise.all(
      webhookEvents.map(async event => {
        const response = await wooClient.post('webhooks', {
          name: `Webhook - ${event}`,
          topic: event,
          delivery_url: webhookUrl,
          secret: process.env.WOOCOMMERCE_WEBHOOK_SECRET,
          status: 'active',
          api_version: 'wc/v3' // Add API version
        })

        return response.data
      })
    )

    return NextResponse.json({ success: true, webhooks: results })
  } catch (error) {
    logger.error('Error registering webhooks:', error)

    return NextResponse.json({ error: error.message || 'Failed to register webhooks' }, { status: 500 })
  }
}
