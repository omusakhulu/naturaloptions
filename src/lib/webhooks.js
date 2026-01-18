// src/lib/webhooks.js
import crypto from 'crypto'
import { wooClient } from './woocommerce'

export function verifyWebhook(payload, signature) {
  // Skip verification if no signature provided
  if (!signature) {
    console.warn('[Webhook] No signature provided, skipping verification')
    return true
  }

  const secret = process.env.WOOCOMMERCE_WEBHOOK_SECRET || process.env.WOOCOMMERCE_CONSUMER_SECRET
  
  if (!secret) {
    console.warn('[Webhook] No webhook secret configured, skipping verification')
    return true
  }

  try {
    const hash = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('base64')
    
    return hash === signature
  } catch (error) {
    console.error('[Webhook] Verification error:', error)
    return false
  }
}

export async function registerWebhooks() {
  try {
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/products/webhooks`
    const secret = process.env.WOOCOMMERCE_WEBHOOK_SECRET || process.env.WOOCOMMERCE_CONSUMER_SECRET

    const webhookData = {
      name: 'Natural Options Product Sync',
      topic: 'product.updated', // Start with product updates
      delivery_url: webhookUrl,
      secret: secret,
      status: 'active'
    }

    // First, delete any existing webhooks to avoid duplicates
    const existingWebhooks = await listWebhooks()

    for (const webhook of existingWebhooks) {
      await deleteWebhook(webhook.id)
    }

    // Create new webhook
    const response = await wooClient.post('webhooks', webhookData)

    console.log('Webhook registered:', response.data)

    return response.data
  } catch (error) {
    console.error('Error registering webhook:', error.response?.data || error.message)
    throw error
  }
}

export async function listWebhooks() {
  try {
    const response = await wooClient.get('webhooks')

    return response.data
  } catch (error) {
    console.error('Error listing webhooks:', error)
    throw error
  }
}

export async function deleteWebhook(webhookId) {
  try {
    const response = await wooClient.delete(`webhooks/${webhookId}`, {
      params: { force: true }
    })

    return response.data
  } catch (error) {
    console.error('Error deleting webhook:', error)
    throw error
  }
}
