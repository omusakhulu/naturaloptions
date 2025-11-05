'use client'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'

// Components Imports
import OptionMenu from '@core/components/option-menu'

const PackingSlipsSummary = ({ packingSlips = [], lang = 'en' }) => {
  // Group by status
  const statusGroups = packingSlips.reduce((acc, slip) => {
    const status = slip.status || 'awaiting_collection'

    acc[status] = (acc[status] || 0) + 1

    return acc
  }, {})

  const awaitingCollection = statusGroups.awaiting_collection || 0
  const enRoute = statusGroups.en_route || 0
  const delivered = statusGroups.delivered || 0
  const collected = statusGroups.collected || 0

  // Get recent packing slips
  const recentSlips = packingSlips.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5)

  // Status color mapping
  const getStatusColor = status => {
    const s = String(status || '').toLowerCase()

    if (s === 'delivered' || s === 'collected') return 'success'
    if (s === 'en_route') return 'info'
    if (s === 'awaiting_collection') return 'warning'

    return 'default'
  }

  // Format status label
  const formatStatus = status => {
    return String(status || '')
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <Card>
      <CardHeader
        title='Packing Slips'
        subheader={`${packingSlips.length} Total`}
        action={<OptionMenu options={['View All Slips', 'Export', 'Refresh']} />}
      />
      <CardContent className='flex flex-col gap-6'>
        {/* Status Summary Grid */}
        <Box className='grid grid-cols-2 gap-4'>
          <Box className='flex flex-col gap-1 p-3 rounded border border-solid border-warning-main/20 bg-warning-main/10'>
            <Typography variant='h4' color='warning.main'>
              {awaitingCollection}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Awaiting Collection
            </Typography>
          </Box>
          <Box className='flex flex-col gap-1 p-3 rounded border border-solid border-info-main/20 bg-info-main/10'>
            <Typography variant='h4' color='info.main'>
              {enRoute}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              En Route
            </Typography>
          </Box>
          <Box className='flex flex-col gap-1 p-3 rounded border border-solid border-success-main/20 bg-success-main/10'>
            <Typography variant='h4' color='success.main'>
              {delivered}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Delivered
            </Typography>
          </Box>
          <Box className='flex flex-col gap-1 p-3 rounded border border-solid border-success-main/20 bg-success-main/10'>
            <Typography variant='h4' color='success.main'>
              {collected}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Collected
            </Typography>
          </Box>
        </Box>

        {/* Recent Packing Slips */}
        <Box className='flex flex-col gap-3'>
          <Typography variant='body2' color='text.secondary' className='font-medium'>
            Recent Packing Slips
          </Typography>
          {recentSlips.length > 0 ? (
            <Box className='flex flex-col gap-2'>
              {recentSlips.map((slip, idx) => (
                <Box key={idx} className='flex items-center justify-between gap-2'>
                  <Box className='flex flex-col gap-0.5 flex-1 min-w-0'>
                    <Typography variant='body2' className='font-medium truncate'>
                      {slip.packingSlipNumber || `PS-${slip.wooOrderId}`}
                    </Typography>
                    {slip.boothNumber && (
                      <Typography variant='caption' color='text.secondary'>
                        Booth {slip.boothNumber}
                      </Typography>
                    )}
                  </Box>
                  <Chip
                    label={formatStatus(slip.status)}
                    size='small'
                    color={getStatusColor(slip.status)}
                    variant='tonal'
                  />
                </Box>
              ))}
            </Box>
          ) : (
            <Typography variant='body2' color='text.disabled'>
              No packing slips created yet
            </Typography>
          )}
        </Box>

        {/* Action Button */}
        <Button
          component={Link}
          href={`/${lang}/apps/packing-slips/list`}
          variant='outlined'
          color='primary'
          size='small'
          fullWidth
        >
          View All Packing Slips
        </Button>
      </CardContent>
    </Card>
  )
}

export default PackingSlipsSummary
