'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import CircularProgress from '@mui/material/CircularProgress'
import SyncIcon from '@mui/icons-material/Sync'

const SyncPriceButton = ({ productId, onSyncComplete }) => {
  const [loading, setLoading] = useState(false)

  const handleSync = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/products/${productId}/sync-price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync price')
      }

      toast.success(data.message || 'Price synced successfully')
      
      // Call the callback if provided
      if (onSyncComplete) {
        onSyncComplete(data.data)
      }
    } catch (error) {
      console.error('Error syncing price:', error)
      toast.error(error.message || 'Failed to sync price')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Tooltip title="Sync Price">
      <IconButton 
        size="small" 
        onClick={handleSync}
        disabled={loading}
        color="primary"
      >
        {loading ? (
          <CircularProgress size={20} />
        ) : (
          <SyncIcon fontSize="small" />
        )}
      </IconButton>
    </Tooltip>
  )
}

export default SyncPriceButton
