// src/app/[lang]/admin/webhooks/page.jsx
'use client'

import { useState, useEffect } from 'react'

import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material'

import { registerWebhooks, listWebhooks, deleteWebhook } from '@/lib/webhooks'

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const fetchWebhooks = async () => {
    try {
      setLoading(true)
      const data = await listWebhooks()

      setWebhooks(data)
    } catch (err) {
      setError('Failed to fetch webhooks')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    try {
      setLoading(true)
      await registerWebhooks()
      setSuccess('Webhook registered successfully!')
      await fetchWebhooks()
    } catch (err) {
      setError('Failed to register webhook: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async id => {
    if (window.confirm('Are you sure you want to delete this webhook?')) {
      try {
        setLoading(true)
        await deleteWebhook(id)
        setSuccess('Webhook deleted successfully!')
        await fetchWebhooks()
      } catch (err) {
        setError('Failed to delete webhook: ' + (err.response?.data?.message || err.message))
      } finally {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchWebhooks()
  }, [])

  return (
    <div className='space-y-6 p-6'>
      <Card>
        <CardHeader title='Webhook Management' subheader='Register and manage WooCommerce webhooks' />
        <CardContent>
          <Box mb={4}>
            <Button
              variant='contained'
              color='primary'
              onClick={handleRegister}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Processing...' : 'Register Webhook'}
            </Button>
          </Box>

          <Typography variant='h6' gutterBottom>
            Registered Webhooks
          </Typography>

          {loading && webhooks.length === 0 ? (
            <Box display='flex' justifyContent='center' p={4}>
              <CircularProgress />
            </Box>
          ) : webhooks.length === 0 ? (
            <Typography>No webhooks registered yet.</Typography>
          ) : (
            <div className='space-y-4'>
              {webhooks.map(webhook => (
                <Card key={webhook.id} variant='outlined'>
                  <CardContent>
                    <div className='flex justify-between items-center'>
                      <div>
                        <Typography variant='subtitle1'>{webhook.name}</Typography>
                        <Typography variant='body2' color='textSecondary'>
                          {webhook.topic} - {webhook.status}
                        </Typography>
                        <Typography variant='body2' color='textSecondary' className='truncate'>
                          {webhook.delivery_url}
                        </Typography>
                      </div>
                      <Button
                        variant='outlined'
                        color='error'
                        size='small'
                        onClick={() => handleDelete(webhook.id)}
                        disabled={loading}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity='error' onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess(null)}>
        <Alert severity='success' onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </div>
  )
}
