'use client'

import { useEffect } from 'react'

export default function WebhookInitializer() {
  useEffect(() => {
    // Only run on the client side in production
    // Call the API route instead of importing woocommerce client directly
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      fetch('/api/webhooks/register', { method: 'POST' })
        .then(res => res.json())
        .then(result => {
          if (result.success) {
            console.log('Webhooks registered successfully')
          } else {
            console.error('Failed to register webhooks:', result.error)
          }
        })
        .catch(err => {
          console.error('Error registering webhooks:', err)
        })
    }
  }, [])

  return null
}
