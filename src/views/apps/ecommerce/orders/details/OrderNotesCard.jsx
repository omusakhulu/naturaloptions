'use client'

import { useEffect, useState } from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'

export default function OrderNotesCard({ orderData }) {
  const orderId = orderData?.id || orderData?.orderNumber || ''
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState([])

  useEffect(() => {
    const load = async () => {
      if (!orderId) return setLoading(false)

      try {
        const res = await fetch(`/api/woocommerce/orders/${orderId}/notes`, { cache: 'no-store' })
        const json = await res.json()

        if (res.ok && json?.success) setNotes(Array.isArray(json.notes) ? json.notes : [])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [orderId])

  const getLabelColor = n => {
    if (n?.customer_note || n?.note_type === 'customer') return { label: 'Customer note', color: 'primary' }
    if (n?.note_type === 'system') return { label: 'System note', color: 'secondary' }

    return { label: 'Private note', color: 'default' }
  }

  return (
    <Card>
      <CardContent className='flex flex-col gap-6'>
        <Typography variant='h5'>Order Notes</Typography>
        {loading ? (
          <Box className='flex items-center justify-center p-6'>
            <CircularProgress size={22} />
          </Box>
        ) : notes.length === 0 ? (
          <Typography color='text.secondary'>No notes on this order.</Typography>
        ) : (
          <Box className='flex flex-col gap-4'>
            {notes.map(n => {
              const { label, color } = getLabelColor(n)
              const created = n?.date_created ? new Date(n.date_created) : null

              return (
                <Box
                  key={n.id}
                  className='flex flex-col gap-1'
                  sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}
                >
                  <Box className='flex items-center gap-2'>
                    <Chip size='small' color={color} label={label} />
                    {created ? (
                      <Typography variant='body2' color='text.secondary'>
                        {created.toLocaleString()}
                      </Typography>
                    ) : null}
                  </Box>
                  <Typography variant='body2' color='text.primary' sx={{ whiteSpace: 'pre-wrap' }}>
                    {typeof n?.note === 'string' ? n.note : ''}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    By: {n?.author || 'system'}
                  </Typography>
                </Box>
              )
            })}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
