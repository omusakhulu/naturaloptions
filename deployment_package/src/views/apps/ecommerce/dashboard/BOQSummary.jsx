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

const BOQSummary = ({ boqs = [], lang = 'en' }) => {
  // Group by status
  const draftBOQs = boqs.filter(b => b.status === 'draft')
  const approvedBOQs = boqs.filter(b => b.status === 'approved')
  const sentBOQs = boqs.filter(b => b.status === 'sent')
  const completedBOQs = boqs.filter(b => b.status === 'completed')

  // Calculate total value of all BOQs
  const totalValue = boqs.reduce((sum, b) => {
    const total = parseFloat(b.total || 0)

    return sum + (isNaN(total) ? 0 : total)
  }, 0)

  // Get recent BOQs
  const recentBOQs = boqs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5)

  // Status color mapping
  const getStatusColor = status => {
    const s = String(status || 'draft').toLowerCase()

    if (s === 'completed') return 'success'
    if (s === 'approved') return 'info'
    if (s === 'sent') return 'warning'

    return 'default'
  }

  // Format status label
  const formatStatus = status => {
    return String(status || 'Draft')
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <Card>
      <CardHeader
        title='Bill of Quantities'
        subheader={`${boqs.length} Total BOQs`}
        action={<OptionMenu options={['View All BOQs', 'Export', 'Refresh']} />}
      />
      <CardContent className='flex flex-col gap-6'>
        {/* Key Metrics */}
        <Box className='flex justify-between items-center gap-4'>
          <Box className='flex flex-col gap-1'>
            <Typography variant='h4' color='primary.main'>
              {boqs.length}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Total BOQs
            </Typography>
          </Box>
          <Box className='flex flex-col gap-1 text-right'>
            <Typography variant='h5' color='success.main'>
              KSh {totalValue.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Total Value
            </Typography>
          </Box>
        </Box>

        {/* Status Distribution */}
        <Box className='grid grid-cols-2 gap-3'>
          <Box className='flex items-center gap-2 p-2 rounded border border-solid border-default/20 bg-default/10'>
            <Avatar
              variant='rounded'
              sx={{
                width: 32,
                height: 32,
                backgroundColor: 'action.hover'
              }}
            >
              <i className='tabler-file-text text-lg' />
            </Avatar>
            <Box className='flex flex-col'>
              <Typography variant='h6'>{draftBOQs.length}</Typography>
              <Typography variant='caption' color='text.secondary'>
                Draft
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
              <i className='tabler-check text-lg' style={{ color: 'var(--mui-palette-info-main)' }} />
            </Avatar>
            <Box className='flex flex-col'>
              <Typography variant='h6' color='info.main'>
                {approvedBOQs.length}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                Approved
              </Typography>
            </Box>
          </Box>
          <Box className='flex items-center gap-2 p-2 rounded border border-solid border-warning-main/20 bg-warning-main/10'>
            <Avatar
              variant='rounded'
              sx={{
                width: 32,
                height: 32,
                backgroundColor: 'warning.light'
              }}
            >
              <i className='tabler-send text-lg' style={{ color: 'var(--mui-palette-warning-main)' }} />
            </Avatar>
            <Box className='flex flex-col'>
              <Typography variant='h6' color='warning.main'>
                {sentBOQs.length}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                Sent
              </Typography>
            </Box>
          </Box>
          <Box className='flex items-center gap-2 p-2 rounded border border-solid border-success-main/20 bg-success-main/10'>
            <Avatar
              variant='rounded'
              sx={{
                width: 32,
                height: 32,
                backgroundColor: 'success.light'
              }}
            >
              <i className='tabler-circle-check text-lg' style={{ color: 'var(--mui-palette-success-main)' }} />
            </Avatar>
            <Box className='flex flex-col'>
              <Typography variant='h6' color='success.main'>
                {completedBOQs.length}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                Completed
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Recent BOQs */}
        <Box className='flex flex-col gap-3'>
          <Typography variant='body2' color='text.secondary' className='font-medium'>
            Recent BOQs
          </Typography>
          {recentBOQs.length > 0 ? (
            <Box className='flex flex-col gap-2'>
              {recentBOQs.map((boq, idx) => (
                <Box key={idx} className='flex items-center justify-between gap-2'>
                  <Box className='flex flex-col gap-0.5 flex-1 min-w-0'>
                    <Typography variant='body2' className='font-medium truncate'>
                      {boq.boqNumber || `BOQ-${boq.id}`}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {boq.projectName || 'Unnamed Project'}
                    </Typography>
                  </Box>
                  <Chip
                    label={formatStatus(boq.status)}
                    size='small'
                    color={getStatusColor(boq.status)}
                    variant='tonal'
                  />
                </Box>
              ))}
            </Box>
          ) : (
            <Typography variant='body2' color='text.disabled'>
              No BOQs created yet
            </Typography>
          )}
        </Box>

        {/* Action Button */}
        <Button
          component={Link}
          href={`/${lang}/apps/boq/list`}
          variant='outlined'
          color='primary'
          size='small'
          fullWidth
        >
          View All BOQs
        </Button>
      </CardContent>
    </Card>
  )
}

export default BOQSummary
