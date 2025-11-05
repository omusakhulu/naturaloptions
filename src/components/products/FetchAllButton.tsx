'use client'

import { useState } from 'react'

import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'

interface FetchAllButtonProps {
  onSuccess?: (count: number) => void
  onError?: (error: string) => void
}

export default function FetchAllButton({ onSuccess, onError }: FetchAllButtonProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleFetchAll = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/products/fetch-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to fetch products')
      }

      setMessage({
        type: 'success',
        text: `✅ ${data.message} (${data.count} products)`
      })

      if (onSuccess) {
        onSuccess(data.count)
      }

      // Reload the page after 2 seconds to show updated products
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setMessage({
        type: 'error',
        text: `❌ Error: ${errorMessage}`
      })

      if (onError) {
        onError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Button
        variant='contained'
        color='primary'
        onClick={handleFetchAll}
        disabled={loading}
        sx={{ width: 'fit-content' }}
      >
        {loading ? (
          <>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            Fetching Products...
          </>
        ) : (
          '🔄 Fetch All Products'
        )}
      </Button>

      {message && (
        <Alert severity={message.type} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}
    </Box>
  )
}
