'use client'

import { useState } from 'react'

import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'

export default function GenerateInvoicesButton() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleGenerateInvoices = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/invoices/generate', {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `✅ ${data.message} - ${data.invoicesCreated} invoices created`
        })
      } else {
        setMessage({
          type: 'error',
          text: `❌ ${data.error}: ${data.message}`
        })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: `❌ Failed to generate invoices: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box className='flex flex-col gap-3'>
      <Button
        variant='contained'
        color='primary'
        onClick={handleGenerateInvoices}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} /> : null}
      >
        {loading ? 'Generating Invoices...' : '🔄 Generate Invoices from Orders'}
      </Button>
      {message && (
        <Alert severity={message.type} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}
    </Box>
  )
}
