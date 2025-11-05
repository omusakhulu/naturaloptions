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
import Avatar from '@mui/material/Avatar'

// Components Imports
import OptionMenu from '@core/components/option-menu'

const TentQuotesSummary = ({ quotes = [], lang = 'en' }) => {
  // Group by status
  const pendingQuotes = quotes.filter(q => q.status === 'pending' || !q.status)
  const approvedQuotes = quotes.filter(q => q.status === 'approved')
  const convertedQuotes = quotes.filter(q => q.status === 'converted')
  const rejectedQuotes = quotes.filter(q => q.status === 'rejected')

  // Calculate total value of pending quotes
  const pendingValue = pendingQuotes.reduce((sum, q) => sum + (parseFloat(q.total || 0)), 0)

  // Get recent quotes
  const recentQuotes = quotes
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5)

  // Status color mapping
  const getStatusColor = status => {
    const s = String(status || 'pending').toLowerCase()
    if (s === 'approved') return 'success'
    if (s === 'converted') return 'info'
    if (s === 'rejected') return 'error'
    return 'warning'
  }

  // Format status label
  const formatStatus = status => {
    return String(status || 'Pending')
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <Card>
      <CardHeader
        title='Event Tent Quotes'
        subheader={`${quotes.length} Total Quotes`}
        action={<OptionMenu options={['View All Quotes', 'Create New Quote', 'Export']} />}
      />
      <CardContent className='flex flex-col gap-6'>
        {/* Key Metrics */}
        <Box className='flex justify-between items-center gap-4'>
          <Box className='flex flex-col gap-1'>
            <Typography variant='h4' color='warning.main'>
              {pendingQuotes.length}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Pending Quotes
            </Typography>
          </Box>
          <Box className='flex flex-col gap-1 text-right'>
            <Typography variant='h5' color='success.main'>
              ${pendingValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Potential Value
            </Typography>
          </Box>
        </Box>

        {/* Status Summary */}
        <Box className='grid grid-cols-2 gap-3'>
          <Box className='flex items-center gap-2 p-2 rounded border border-solid border-success-main/20 bg-success-main/10'>
            <Avatar
              variant='rounded'
              sx={{
                width: 32,
                height: 32,
                backgroundColor: 'success.light'
              }}
            >
              <i className='tabler-check text-lg' style={{ color: 'var(--mui-palette-success-main)' }} />
            </Avatar>
            <Box className='flex flex-col'>
              <Typography variant='h6' color='success.main'>
                {approvedQuotes.length}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                Approved
              </Typography>
            </Box>
          </Box>
          <Box className='flex items-center gap-2 p-2 rounded border border-solid border-info-main/20 bg-info-main/10'>
            <Avatar
              variant='rounded'
              sx={{
                width: 32,
                height: 32,
                backgroundColor: 'info.light'
              }}
            >
              <i className='tabler-package text-lg' style={{ color: 'var(--mui-palette-info-main)' }} />
            </Avatar>
            <Box className='flex flex-col'>
              <Typography variant='h6' color='info.main'>
                {convertedQuotes.length}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                Converted
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Recent Quotes */}
        <Box className='flex flex-col gap-3'>
          <Typography variant='body2' color='text.secondary' className='font-medium'>
            Recent Quotes
          </Typography>
          {recentQuotes.length > 0 ? (
            <Box className='flex flex-col gap-2'>
              {recentQuotes.map((quote, idx) => (
                <Box key={idx} className='flex items-center justify-between gap-2'>
                  <Box className='flex flex-col gap-0.5 flex-1 min-w-0'>
                    <Typography variant='body2' className='font-medium truncate'>
                      {quote.contactName || 'Unknown Client'}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {quote.eventVenue || 'No venue'} • ${parseFloat(quote.total || 0).toFixed(2)}
                    </Typography>
                  </Box>
                  <Chip
                    label={formatStatus(quote.status)}
                    size='small'
                    color={getStatusColor(quote.status)}
                    variant='tonal'
                  />
                </Box>
              ))}
            </Box>
          ) : (
            <Typography variant='body2' color='text.disabled'>
              No quotes created yet
            </Typography>
          )}
        </Box>

        {/* Action Button */}
        <Button
          component={Link}
          href={`/${lang}/apps/tent-quotes/create`}
          variant='contained'
          color='primary'
          size='small'
          fullWidth
          startIcon={<i className='tabler-plus' />}
        >
          Create New Quote
        </Button>
      </CardContent>
    </Card>
  )
}

export default TentQuotesSummary
