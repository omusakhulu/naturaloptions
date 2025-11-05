// MUI Imports
import { useState } from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import MenuItem from '@mui/material/MenuItem'

import classnames from 'classnames'

import CustomTextField from '@core/components/mui/TextField'

// Third-party Imports

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

const OrderCard = ({ orderData = [] }) => {
  // Hooks
  const isBelowMdScreen = useMediaQuery(theme => theme.breakpoints.down('md'))
  const isBelowSmScreen = useMediaQuery(theme => theme.breakpoints.down('sm'))
  const [period, setPeriod] = useState('all')

  const now = Date.now()
  const daysMap = { '7d': 7, '30d': 30, '90d': 90 }
  const threshold = period === 'all' ? null : new Date(now - (daysMap[period] || 0) * 24 * 60 * 60 * 1000)

  const filtered = (orderData || []).filter(o => {
    const d = new Date(o.dateCreated || o.date || 0)

    return !threshold || (d instanceof Date && !isNaN(d) && d >= threshold)
  })

  const counts = filtered.reduce(
    (acc, o) => {
      const s = String(o.status || '').toLowerCase()

      if (s === 'pending') acc.pending += 1
      else if (s === 'completed') acc.completed += 1
      else if (s === 'refunded') acc.refunded += 1
      else if (s === 'failed') acc.failed += 1

      return acc
    },
    { pending: 0, completed: 0, refunded: 0, failed: 0 }
  )

  const parseAmount = v => {
    const n = parseFloat(String(v || '').replace(/[^0-9.-]/g, ''))

    return isNaN(n) ? 0 : n
  }

  const pendingRevenue = filtered.reduce((sum, o) => {
    const s = String(o.status || '').toLowerCase()

    return s === 'pending' || s === 'processing' ? sum + parseAmount(o.total) : sum
  }, 0)

  const grossSales = filtered.reduce((sum, o) => {
    const s = String(o.status || '').toLowerCase()

    return s === 'completed' ? sum + parseAmount(o.total) : sum
  }, 0)

  const data = [
    { value: counts.pending, title: 'Pending Payment', icon: 'tabler-calendar-stats' },
    { value: counts.completed, title: 'Completed', icon: 'tabler-checks' },
    { value: counts.refunded, title: 'Refunded', icon: 'tabler-wallet' },
    { value: counts.failed, title: 'Failed', icon: 'tabler-alert-octagon' },
    { value: pendingRevenue, title: 'Pending Revenue', icon: 'tabler-cash' },
    { value: grossSales, title: 'Gross Sales', icon: 'tabler-currency-dollar' }
  ]

  return (
    <Card>
      <CardContent>
        <div className='flex items-center justify-end mbs-2'>
          <CustomTextField
            select
            size='small'
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className='min-is-40'
          >
            <MenuItem value='all'>All</MenuItem>
            <MenuItem value='7d'>Last 7 days</MenuItem>
            <MenuItem value='30d'>Last 30 days</MenuItem>
            <MenuItem value='90d'>Last 90 days</MenuItem>
          </CustomTextField>
        </div>
        <Grid container spacing={6}>
          {data.map((item, index) => (
            <Grid
              size={{ xs: 12, sm: 6, md: 2 }}
              key={index}
              className={classnames({
                '[&:nth-of-type(odd)>div]:pie-6 [&:nth-of-type(odd)>div]:border-ie':
                  isBelowMdScreen && !isBelowSmScreen,
                '[&:not(:last-child)>div]:pie-6 [&:not(:last-child)>div]:border-ie': !isBelowMdScreen
              })}
            >
              <div className='flex justify-between gap-4'>
                <div className='flex flex-col items-start'>
                  <Typography variant='h4'>{item.value.toLocaleString()}</Typography>
                  <Typography>{item.title}</Typography>
                </div>
                <CustomAvatar variant='rounded' size={42} skin='light'>
                  <i className={classnames(item.icon, 'text-[26px]')} />
                </CustomAvatar>
              </div>
              {isBelowMdScreen && !isBelowSmScreen && index < data.length - 2 && (
                <Divider
                  className={classnames('mbs-6', {
                    'mie-6': index % 2 === 0
                  })}
                />
              )}
              {isBelowSmScreen && index < data.length - 1 && <Divider className='mbs-6' />}
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  )
}

export default OrderCard
