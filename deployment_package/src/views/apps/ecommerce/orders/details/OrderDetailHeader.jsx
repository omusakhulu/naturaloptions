'use client'

// React Imports
import { useEffect, useState } from 'react'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'

// Component Imports
import ConfirmationDialog from '@components/dialogs/confirmation-dialog'
import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

export const paymentStatus = {
  1: { text: 'Paid', color: 'success' },
  2: { text: 'Pending', color: 'warning' },
  3: { text: 'Cancelled', color: 'secondary' },
  4: { text: 'Failed', color: 'error' }
}
export const statusChipColor = {
  pending: { color: 'warning' },
  processing: { color: 'info' },
  'on-hold': { color: 'secondary' },
  completed: { color: 'success' },
  cancelled: { color: 'error' },
  refunded: { color: 'secondary' },
  failed: { color: 'error' },
  Delivered: { color: 'success' },
  'Out for Delivery': { color: 'primary' },
  'Ready to Pickup': { color: 'info' },
  Dispatched: { color: 'warning' }
}

const OrderDetailHeader = ({ orderData, order, locale = 'en' }) => {
  // Vars
  const buttonProps = (children, color, variant) => ({
    children,
    color,
    variant
  })

  // Local state for invoice lifecycle
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [invoiceStatus, setInvoiceStatus] = useState('draft')
  const [slipLoading, setSlipLoading] = useState(false)
  const [generatingSlip, setGeneratingSlip] = useState(false)
  const [slipExists, setSlipExists] = useState(false)

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)

      try {
        const res = await fetch(`/api/invoices/by-order/${order}/status`, { cache: 'no-store' })
        const json = await res.json()

        if (res.ok && json?.success && json?.invoice) {
          setInvoiceStatus(json.invoice.invoiceStatus || json.invoice.status || 'draft')
        } else {
          setInvoiceStatus('draft')
        }

        // moved handleGenerateSlip to component scope
      } catch {
      } finally {
        if (active) setLoading(false)
      }
    }

    if (order) load()

    return () => {
      active = false
    }
  }, [order])

  useEffect(() => {
    let active = true

    const loadSlip = async () => {
      if (!order) return
      setSlipLoading(true)

      try {
        const res = await fetch(`/api/packing-slips/${order}`, { cache: 'no-store' })
        const json = await res.json()

        if (active) setSlipExists(!!json?.slip)
      } catch {
        if (active) setSlipExists(false)
      } finally {
        if (active) setSlipLoading(false)
      }
    }

    loadSlip()

    return () => {
      active = false
    }
  }, [order])

  const handleSave = async () => {
    if (!order) return
    setSaving(true)

    try {
      const res = await fetch(`/api/invoices/by-order/${order}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceStatus })
      })

      await res.json()
    } catch {
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateSlip = async () => {
    if (!order) return
    setGeneratingSlip(true)

    try {
      const res = await fetch(`/api/packing-slips/${order}`, { method: 'POST' })

      await res.json()
      setSlipExists(true)
    } catch {
    } finally {
      setGeneratingSlip(false)
    }
  }

  return (
    <div className='flex flex-col gap-y-4 sm:gap-y-3'>
      <div className='flex flex-col items-start gap-2'>
        <div className='flex items-center gap-2'>
          <Typography variant='h5'>{`Order #${order}`}</Typography>
          <Chip
            variant='tonal'
            label={orderData?.status}
            color={statusChipColor[orderData?.status]?.color || 'default'}
            size='small'
          />
          <Chip variant='tonal' label='Invoice' color='default' size='small' />
          <FormControl size='small'>
            <InputLabel id='invoice-status-label'>Invoice Status</InputLabel>
            <Select
              labelId='invoice-status-label'
              label='Invoice Status'
              value={invoiceStatus}
              onChange={e => setInvoiceStatus(e.target.value)}
              disabled={loading || saving}
              sx={{ minWidth: 170 }}
            >
              <MenuItem value='draft'>Draft</MenuItem>
              <MenuItem value='sent'>Sent</MenuItem>
              <MenuItem value='partially_paid'>Partially Paid</MenuItem>
              <MenuItem value='paid'>Paid</MenuItem>
            </Select>
          </FormControl>
          <Button variant='contained' size='small' disabled={saving || loading} onClick={handleSave}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
          <Chip variant='tonal' label={orderData?.paymentMethodTitle || 'N/A'} color='default' size='small' />
        </div>
      </div>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <Typography>
          {(() => {
            const dateStr = orderData?.date || orderData?.dateCreated

            if (!dateStr) return 'Date not available'
            const date = new Date(dateStr)

            if (isNaN(date.getTime())) return 'Invalid Date'

            return `${date.toDateString()}, ${date.toLocaleTimeString()} (ET)`
          })()}
        </Typography>
        <div className='flex gap-2'>
          <Button
            component={Link}
            href={getLocalizedUrl(`/apps/ecommerce/orders/edit/${order}`, locale)}
            variant='tonal'
            color='primary'
          >
            Edit Order
          </Button>
          <Button
            component={Link}
            href={getLocalizedUrl(`/apps/packing-slips/view/${order}`, locale)}
            variant='tonal'
            color='secondary'
            disabled={!slipExists || slipLoading}
          >
            {slipLoading ? 'Checking Slip...' : 'View Packing Slip'}
          </Button>
          <Button variant='contained' color='success' onClick={handleGenerateSlip} disabled={generatingSlip}>
            {generatingSlip ? 'Generating...' : slipExists ? 'Re-generate Slip' : 'Generate Slip'}
          </Button>
          <OpenDialogOnElementClick
            element={Button}
            elementProps={buttonProps('Delete Order', 'error', 'tonal')}
            dialog={ConfirmationDialog}
            dialogProps={{ type: 'delete-order' }}
          />
        </div>
      </div>
    </div>
  )
}

export default OrderDetailHeader
