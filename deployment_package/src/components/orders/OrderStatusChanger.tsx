'use client'

import { useState } from 'react'

import {
  Select,
  MenuItem,
  FormControl,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Box
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningIcon from '@mui/icons-material/Warning'
import ErrorIcon from '@mui/icons-material/Error'
import InfoIcon from '@mui/icons-material/Info'

interface OrderStatusChangerProps {
  orderId: number | string
  currentStatus: string
  onStatusChanged?: (newStatus: string) => void
  size?: 'small' | 'medium'
  variant?: 'select' | 'chip'
}

const ORDER_STATUSES = [
  { key: 'pending', label: 'Pending Payment', color: 'warning' as const, icon: <WarningIcon fontSize='small' /> },
  { key: 'processing', label: 'Processing', color: 'info' as const, icon: <InfoIcon fontSize='small' /> },
  { key: 'on-hold', label: 'On Hold', color: 'warning' as const, icon: <WarningIcon fontSize='small' /> },
  { key: 'completed', label: 'Completed', color: 'success' as const, icon: <CheckCircleIcon fontSize='small' /> },
  { key: 'cancelled', label: 'Cancelled', color: 'error' as const, icon: <ErrorIcon fontSize='small' /> },
  { key: 'refunded', label: 'Refunded', color: 'default' as const, icon: <InfoIcon fontSize='small' /> },
  { key: 'failed', label: 'Failed', color: 'error' as const, icon: <ErrorIcon fontSize='small' /> }
]

export default function OrderStatusChanger({
  orderId,
  currentStatus,
  onStatusChanged,
  size = 'small',
  variant = 'select'
}: OrderStatusChangerProps) {
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<string | null>(null)

  const getStatusInfo = (statusKey: string) => {
    return ORDER_STATUSES.find(s => s.key === statusKey) || ORDER_STATUSES[0]
  }

  const handleStatusChange = (newStatus: string) => {
    // Don't allow changing to the same status
    if (newStatus === status) return

    setPendingStatus(newStatus)
    setConfirmDialogOpen(true)
  }

  const confirmStatusChange = async () => {
    if (!pendingStatus) return

    setLoading(true)
    setError(null)
    setConfirmDialogOpen(false)

    try {
      const response = await fetch(`/api/woocommerce/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: pendingStatus })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update order status')
      }

      setStatus(pendingStatus)

      if (onStatusChanged) {
        onStatusChanged(pendingStatus)
      }

      console.log(`✅ Order ${orderId} status changed to ${pendingStatus}`)
    } catch (err: any) {
      console.error('Error updating order status:', err)
      setError(err.message)
    } finally {
      setLoading(false)
      setPendingStatus(null)
    }
  }

  const cancelStatusChange = () => {
    setConfirmDialogOpen(false)
    setPendingStatus(null)
  }

  const currentStatusInfo = getStatusInfo(status)
  const pendingStatusInfo = pendingStatus ? getStatusInfo(pendingStatus) : null

  if (variant === 'chip') {
    return (
      <>
        <FormControl size={size} disabled={loading}>
          <Select
            value={status}
            onChange={e => handleStatusChange(e.target.value)}
            renderValue={value => {
              const info = getStatusInfo(value)

              return (
                <Chip
                  icon={loading ? <CircularProgress size={16} /> : info.icon}
                  label={info.label}
                  color={info.color}
                  size={size}
                />
              )
            }}
            sx={{ minWidth: 150 }}
          >
            {ORDER_STATUSES.map(statusOption => (
              <MenuItem key={statusOption.key} value={statusOption.key}>
                <Box display='flex' alignItems='center' gap={1}>
                  {statusOption.icon}
                  <Typography>{statusOption.label}</Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Confirmation Dialog */}
        <Dialog open={confirmDialogOpen} onClose={cancelStatusChange} maxWidth='sm' fullWidth>
          <DialogTitle>Confirm Status Change</DialogTitle>
          <DialogContent>
            <Typography variant='body1' gutterBottom>
              Are you sure you want to change the order status?
            </Typography>
            <Box display='flex' alignItems='center' gap={2} mt={2}>
              <Chip
                icon={currentStatusInfo.icon}
                label={currentStatusInfo.label}
                color={currentStatusInfo.color}
              />
              <Typography>→</Typography>
              {pendingStatusInfo && (
                <Chip icon={pendingStatusInfo.icon} label={pendingStatusInfo.label} color={pendingStatusInfo.color} />
              )}
            </Box>
            <Alert severity='info' sx={{ mt: 2 }}>
              This will update the order status in WooCommerce and may trigger emails to the customer.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={cancelStatusChange}>Cancel</Button>
            <Button onClick={confirmStatusChange} variant='contained' autoFocus>
              Confirm
            </Button>
          </DialogActions>
        </Dialog>

        {/* Error Message */}
        {error && (
          <Alert severity='error' onClose={() => setError(null)} sx={{ mt: 1 }}>
            {error}
          </Alert>
        )}
      </>
    )
  }

  // Default: select variant
  return (
    <Box>
      <FormControl size={size} fullWidth disabled={loading}>
        <Select
          value={status}
          onChange={e => handleStatusChange(e.target.value)}
          displayEmpty
          startAdornment={loading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : currentStatusInfo.icon}
        >
          {ORDER_STATUSES.map(statusOption => (
            <MenuItem key={statusOption.key} value={statusOption.key}>
              <Box display='flex' alignItems='center' gap={1}>
                {statusOption.icon}
                <Typography>{statusOption.label}</Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={cancelStatusChange} maxWidth='sm' fullWidth>
        <DialogTitle>Confirm Status Change</DialogTitle>
        <DialogContent>
          <Typography variant='body1' gutterBottom>
            Are you sure you want to change the order status for Order #{orderId}?
          </Typography>
          <Box display='flex' alignItems='center' gap={2} mt={2} mb={2}>
            <Chip icon={currentStatusInfo.icon} label={currentStatusInfo.label} color={currentStatusInfo.color} />
            <Typography variant='h6'>→</Typography>
            {pendingStatusInfo && (
              <Chip icon={pendingStatusInfo.icon} label={pendingStatusInfo.label} color={pendingStatusInfo.color} />
            )}
          </Box>
          <Alert severity='info'>
            This will update the order status in WooCommerce and may trigger automated emails to the customer.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelStatusChange} color='inherit'>
            Cancel
          </Button>
          <Button onClick={confirmStatusChange} variant='contained' color='primary' autoFocus>
            Confirm Change
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Alert */}
      {error && (
        <Alert severity='error' onClose={() => setError(null)} sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
    </Box>
  )
}
