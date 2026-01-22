'use client'

import { useState } from 'react'

import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'

export default function FetchAllCustomersButton() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleFetchAll = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/customers/fetch-all', { method: 'POST' })
      const data = await response.json()

      if (!response.ok) throw new Error(data?.error || data?.message || 'Failed to fetch customers')
      setMessage({ type: 'success', text: data?.message || 'Fetched customers' })
      setTimeout(() => window.location.reload(), 1500)
    } catch (e: any) {
      setMessage({ type: 'error', text: e?.message || 'Unknown error' })
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
            <CircularProgress size={20} sx={{ mr: 1 }} /> Fetching Customers...
          </>
        ) : (
          '🔄 Fetch All Customers'
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
