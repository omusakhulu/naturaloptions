'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Tooltip from '@mui/material/Tooltip'
import { useRouter } from 'next/navigation'

const RefreshButton = ({ variant = 'contained', size = 'medium', className = '' }) => {
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  const handleRefresh = async () => {
    setRefreshing(true)
    
    try {
      // Refresh the current page data
      router.refresh()
      
      // Small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.error('Error refreshing:', error)
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <Tooltip title='Refresh dashboard data' placement='left'>
      <Button
        variant={variant}
        size={size}
        onClick={handleRefresh}
        disabled={refreshing}
        startIcon={refreshing ? <CircularProgress size={16} /> : <i className='tabler-refresh' />}
        className={className}
      >
        {refreshing ? 'Refreshing...' : 'Refresh'}
      </Button>
    </Tooltip>
  )
}

export default RefreshButton
