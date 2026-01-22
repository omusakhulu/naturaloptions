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
import Avatar from '@mui/material/Avatar'

// Components Imports
import OptionMenu from '@core/components/option-menu'

const StockAlerts = ({ inventoryItems = [], lang = 'en' }) => {
  // Filter and sort items by urgency
  const outOfStock = inventoryItems.filter(item => item.quantity === 0)

  const lowStock = inventoryItems.filter(item => item.quantity > 0 && item.quantity <= (item.reorderLevel || 0))

  // Combine and sort by quantity (lowest first)
  const alertItems = [...outOfStock, ...lowStock].sort((a, b) => a.quantity - b.quantity).slice(0, 8) // Show top 8 alerts

  return (
    <Card>
      <CardHeader
        title='Stock Alerts'
        subheader={`${outOfStock.length} Out of Stock, ${lowStock.length} Low Stock`}
        action={<OptionMenu options={['View All Inventory', 'Generate Report', 'Refresh']} />}
      />
      <CardContent className='flex flex-col gap-4'>
        {alertItems.length > 0 ? (
          <Box className='flex flex-col gap-3'>
            {alertItems.map((item, idx) => {
              const isOutOfStock = item.quantity === 0
              const warehouseName = item.warehouse?.name || item.warehouseName || 'Unknown'

              return (
                <Box key={idx} className='flex items-center gap-3'>
                  <Avatar
                    variant='rounded'
                    sx={{
                      width: 38,
                      height: 38,
                      backgroundColor: isOutOfStock ? 'error.light' : 'warning.light'
                    }}
                  >
                    <i
                      className={`${isOutOfStock ? 'tabler-alert-triangle' : 'tabler-alert-circle'} text-xl`}
                      style={{
                        color: isOutOfStock ? 'var(--mui-palette-error-main)' : 'var(--mui-palette-warning-main)'
                      }}
                    />
                  </Avatar>
                  <Box className='flex flex-col gap-0.5 flex-1 min-w-0'>
                    <Typography variant='body2' className='font-medium truncate'>
                      {item.productName || item.name || 'Unknown Product'}
                    </Typography>
                    <Box className='flex items-center gap-2'>
                      <Typography variant='caption' color='text.secondary'>
                        {item.sku ? `SKU: ${item.sku}` : warehouseName}
                      </Typography>
                      {item.quantity > 0 && (
                        <Chip
                          label={`${item.quantity} left`}
                          size='small'
                          color='warning'
                          variant='outlined'
                          sx={{ height: 18, fontSize: '0.6875rem' }}
                        />
                      )}
                    </Box>
                  </Box>
                  <Chip
                    label={isOutOfStock ? 'Out' : 'Low'}
                    size='small'
                    color={isOutOfStock ? 'error' : 'warning'}
                    variant='tonal'
                  />
                </Box>
              )
            })}
          </Box>
        ) : (
          <Box className='flex flex-col items-center justify-center gap-2 py-8'>
            <Avatar
              variant='rounded'
              sx={{
                width: 64,
                height: 64,
                backgroundColor: 'success.light'
              }}
            >
              <i className='tabler-check text-4xl' style={{ color: 'var(--mui-palette-success-main)' }} />
            </Avatar>
            <Typography variant='h6' color='text.primary' className='text-center'>
              All Stock Levels Good
            </Typography>
            <Typography variant='body2' color='text.secondary' className='text-center'>
              No items are out of stock or running low
            </Typography>
          </Box>
        )}

        {/* Summary Stats */}
        {alertItems.length > 0 && (
          <Box className='flex justify-between items-center pt-2 border-t'>
            <Typography variant='body2' color='text.secondary'>
              Total Alerts
            </Typography>
            <Box className='flex gap-2'>
              <Chip label={`${outOfStock.length} Critical`} size='small' color='error' variant='outlined' />
              <Chip label={`${lowStock.length} Warning`} size='small' color='warning' variant='outlined' />
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default StockAlerts
