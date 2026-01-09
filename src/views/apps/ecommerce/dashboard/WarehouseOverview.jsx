'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'

// Components Imports
import OptionMenu from '@core/components/option-menu'

const WarehouseOverview = ({ warehouses = [], inventoryItems = [], stockMovements = [] }) => {
  // Calculate stats
  const activeWarehouses = warehouses.filter(w => w.status === 'active').length
  const totalInventoryItems = inventoryItems.length

  const lowStockItems = inventoryItems.filter(
    item => item.quantity <= (item.reorderLevel || 0) && item.quantity > 0
  ).length

  const outOfStockItems = inventoryItems.filter(item => item.quantity === 0).length
  const recentMovements = stockMovements.slice(0, 5)

  // Calculate total inventory value
  const totalValue = inventoryItems.reduce((sum, item) => {
    const price = parseFloat(item.sellingPrice || item.costPrice || 0)
    const qty = parseFloat(item.quantity || 0)

    return sum + price * qty
  }, 0)

  // Calculate capacity utilization (if warehouses have capacity data)
  const totalCapacity = warehouses.reduce((sum, w) => sum + (parseFloat(w.capacity) || 0), 0)
  const usedCapacity = inventoryItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0)
  const capacityPercent = totalCapacity > 0 ? (usedCapacity / totalCapacity) * 100 : 0

  return (
    <Card>
      <CardHeader
        title='Warehouse Overview'
        subheader={`${activeWarehouses} Active Warehouse${activeWarehouses !== 1 ? 's' : ''}`}
        action={<OptionMenu options={['View All Warehouses', 'Stock Report', 'Refresh']} />}
      />
      <CardContent className='flex flex-col gap-6'>
        {/* Key Metrics */}
        <Box className='flex justify-between items-center gap-4'>
          <Box className='flex flex-col gap-1'>
            <Typography variant='h4' color='text.primary'>
              {totalInventoryItems}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Total Items
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

        {/* Capacity Indicator */}
        {totalCapacity > 0 && (
          <Box className='flex flex-col gap-2'>
            <Box className='flex justify-between items-center'>
              <Typography variant='body2' color='text.secondary'>
                Warehouse Capacity
              </Typography>
              <Typography variant='body2' color='text.primary' className='font-medium'>
                {capacityPercent.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress
              variant='determinate'
              value={Math.min(capacityPercent, 100)}
              color={capacityPercent > 90 ? 'error' : capacityPercent > 70 ? 'warning' : 'primary'}
            />
          </Box>
        )}

        {/* Stock Alerts */}
        <Box className='flex gap-2 flex-wrap'>
          {outOfStockItems > 0 && (
            <Chip
              label={`${outOfStockItems} Out of Stock`}
              color='error'
              size='small'
              variant='tonal'
              icon={<i className='tabler-alert-triangle text-base' />}
            />
          )}
          {lowStockItems > 0 && (
            <Chip
              label={`${lowStockItems} Low Stock`}
              color='warning'
              size='small'
              variant='tonal'
              icon={<i className='tabler-alert-circle text-base' />}
            />
          )}
          {outOfStockItems === 0 && lowStockItems === 0 && (
            <Chip
              label='All Stock Levels Healthy'
              color='success'
              size='small'
              variant='tonal'
              icon={<i className='tabler-check text-base' />}
            />
          )}
        </Box>

        {/* Recent Movements Summary */}
        <Box className='flex flex-col gap-2'>
          <Typography variant='body2' color='text.secondary' className='font-medium'>
            Recent Activity ({recentMovements.length})
          </Typography>
          {recentMovements.length > 0 ? (
            <Box className='flex flex-col gap-2'>
              {recentMovements.map((movement, idx) => (
                <Box key={idx} className='flex items-center justify-between'>
                  <Typography variant='body2' noWrap className='flex-1'>
                    {movement.productName || 'Product'}
                  </Typography>
                  <Chip
                    label={movement.type}
                    size='small'
                    color={movement.type === 'inbound' ? 'success' : movement.type === 'outbound' ? 'error' : 'info'}
                    variant='outlined'
                  />
                </Box>
              ))}
            </Box>
          ) : (
            <Typography variant='body2' color='text.disabled'>
              No recent movements
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}

export default WarehouseOverview
