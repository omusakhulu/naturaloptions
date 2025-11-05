'use client'

import { useEffect } from 'react'

import { registerWebhooks } from '@/lib/woocommerce'

export default function WebhookInitializer() {
  useEffect(() => {
    // Only run on the client side in production
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      registerWebhooks().then(result => {
        if (result.success) {
          console.log('Webhooks registered successfully')
        } else {
          console.error('Failed to register webhooks:', result.error)
        }
      })
    }
  }, [])

  return null
}
