'use client'

// MUI Imports
import Card from '@mui/material/Card'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import MuiLinearProgress from '@mui/material/LinearProgress'
import { styled } from '@mui/material/styles'

// Custom Components Imports
import CustomAvatar from '@core/components/mui/Avatar'

const LinearProgress = styled(MuiLinearProgress)(() => ({
  '&.MuiLinearProgress-colorInfo': { backgroundColor: 'var(--mui-palette-primary-main)' },
  '& .MuiLinearProgress-bar': {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0
  }
}))

const SalesOverview = ({ stats }) => {
  const monthTotal = stats ? (stats.monthlySales?.total / 1000).toFixed(1) + 'k' : '0'
  const growth = stats?.monthlySales?.growth || 0
  const growthLabel = `${growth > 0 ? '+' : ''}${growth}%`
  const monthlyOrders = stats?.orders?.monthly || 0
  const totalProducts = stats?.products?.total || 0

  // Progress value for linear bar: ratio of orders to products, capped at 100
  const progressValue = totalProducts > 0 ? Math.min(100, Math.round((monthlyOrders / (monthlyOrders + totalProducts)) * 100)) : 0

  return (
    <Card>
      <CardContent>
        <div className='flex items-start justify-between gap-3'>
          <div>
            <Typography>Sales Overview</Typography>
            <Typography variant='h4'>KSh {monthTotal}</Typography>
          </div>
          <Typography color={growth >= 0 ? 'success.main' : 'error.main'} className='font-medium'>
            {growthLabel}
          </Typography>
        </div>
        <div className='flex items-center justify-between mlb-[1.4375rem]'>
          <div className='flex flex-col plb-2.25'>
            <div className='flex items-center mbe-2.5 gap-x-[6px]'>
              <CustomAvatar skin='light' color='info' variant='rounded' size={24}>
                <i className='tabler-shopping-cart text-lg' />
              </CustomAvatar>
              <Typography>Orders</Typography>
            </div>
            <Typography variant='h5'>{monthlyOrders}</Typography>
            <Typography variant='body2' color='text.disabled'>
              orders
            </Typography>
          </div>
          <Divider flexItem orientation='vertical'>
            <CustomAvatar skin='light' size={24} className='text-xs text-textDisabled bg-actionHover'>
              VS
            </CustomAvatar>
          </Divider>
          <div className='flex items-end flex-col plb-2'>
            <div className='flex items-center mbe-2 gap-x-[6px]'>
              <Typography color='text.secondary' className='m'>
                Products
              </Typography>
              <CustomAvatar skin='light' variant='rounded' color='primary' size={24}>
                <i className='tabler-link text-lg' />
              </CustomAvatar>
            </div>
            <Typography variant='h5'>{totalProducts}</Typography>
            <Typography variant='body2' color='text.disabled'>
              products
            </Typography>
          </div>
        </div>
        <LinearProgress value={progressValue} color='info' variant='determinate' className='bs-2.5' />
      </CardContent>
    </Card>
  )
}

export default SalesOverview
