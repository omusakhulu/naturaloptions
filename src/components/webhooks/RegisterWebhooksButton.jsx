'use client'

import { useState } from 'react'

import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

export default function RegisterWebhooksButton() {
  const [isLoading, setIsLoading] = useState(false)

  const registerWebhooks = async () => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/webhooks/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to register webhooks')
      }

      toast.success('Webhooks registered successfully', {
        description: result.details?.join('\n') || 'All webhooks are up to date'
      })
    } catch (error) {
      console.error('Webhook registration error:', error)
      toast.error('Failed to register webhooks', {
        description: error.message
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={registerWebhooks} disabled={isLoading} className='w-full sm:w-auto'>
      {isLoading ? 'Registering...' : 'Register Webhooks'}
    </Button>
  )
}
