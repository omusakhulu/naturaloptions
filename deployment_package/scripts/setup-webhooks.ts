import dotenv from 'dotenv'

import { WooCommerceService } from '../src/lib/woocommerce/woocommerce-service'

// Load environment variables
dotenv.config()

async function setupWebhooks() {
  try {
    // Get the webhook base URL from environment variables or use a default
    const webhookBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app-url.com'

    console.log('Setting up WooCommerce webhooks...')
    console.log(`Webhook Base URL: ${webhookBaseUrl}`)

    if (!process.env.WOOCOMMERCE_WEBHOOK_SECRET) {
      console.error('Error: WOOCOMMERCE_WEBHOOK_SECRET is not set in environment variables')
      process.exit(1)
    }

    const wooService = WooCommerceService.getInstance()

    // Setup webhooks
    const result = await wooService.setupWebhooks(webhookBaseUrl)

    if (result.success) {
      console.log('✅ Successfully set up webhooks:')
      result.webhooks.forEach(webhook => {
        console.log(`- ${webhook.name} (${webhook.topic})`)
      })
      console.log('\nWebhook setup completed successfully!')
    } else {
      console.error('❌ Failed to set up webhooks')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Error setting up webhooks:', error)
    process.exit(1)
  }
}

// Run the setup
setupWebhooks()
