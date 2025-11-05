'use client'

// React Imports
import { Fragment, useState } from 'react'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Tab from '@mui/material/Tab'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'

// Components Imports
import OptionMenu from '@core/components/option-menu'

// Helper function to get status color
const getStatusColor = status => {
  const s = String(status || '').toLowerCase()

  if (s === 'completed') return 'success'
  if (s === 'processing') return 'info'
  if (s === 'pending') return 'warning'
  if (s === 'cancelled' || s === 'failed') return 'error'
  if (s === 'on-hold') return 'default'

  return 'primary'
}

const Orders = ({ recentOrders = [], lang = 'en' }) => {
  // States
  const [value, setValue] = useState('all')

  const handleChange = (event, newValue) => {
    setValue(newValue)
  }

  const normalizeBucket = statusRaw => {
    const s = String(statusRaw || '').toLowerCase()

    if (s === 'pending') return 'pending'
    if (s === 'processing') return 'preparing'
    if (s === 'completed') return 'completed'
    if (s === 'on-hold') return 'new'

    // Treat other terminal/other states as 'shipping' bucket in this UI
    return 'shipping'
  }

  const grouped = recentOrders.reduce(
    (acc, o) => {
      const bucket = normalizeBucket(o.status || o.orderStatus)

      acc[bucket].push(o)

      return acc
    },
    { pending: [], new: [], preparing: [], completed: [], shipping: [] }
  )

  const shown = value === 'all' ? recentOrders : (grouped[value] || [])

  return (
    <Card>
      <CardHeader
        title='Recent Orders'
        subheader={`${shown.length} shown`}
        action={<OptionMenu options={['Show all orders', 'Share', 'Refresh']} />}
        className='pbe-4'
      />
      <TabContext value={value}>
        <TabList variant='fullWidth' onChange={handleChange} aria-label='full width tabs example'>
          <Tab value='all' label='All Orders' />
          <Tab value='pending' label='Pending Payment' />
          <Tab value='new' label='New' />
          <Tab value='preparing' label='Preparing' />
          <Tab value='completed' label='Completed' />
          <Tab value='shipping' label='Shipping' />
        </TabList>
        <TabPanel value={value} className='pbs-0'>
          <CardContent>
            {/* Table Headers */}
            <Box className='flex items-center justify-between gap-4 pbs-2 pbe-3 border-b'>
              <Box className='flex-1'>
                <Typography variant='caption' color='text.secondary' className='uppercase font-semibold'>
                  Order & Documents
                </Typography>
              </Box>
              <Box>
                <Typography variant='caption' color='text.secondary' className='uppercase font-semibold'>
                  Status
                </Typography>
              </Box>
            </Box>
            {shown.map((order, index) => {
              const billing = (() => {
                try {
                  return typeof order.billingAddress === 'string'
                    ? JSON.parse(order.billingAddress)
                    : order.billingAddress || {}
                } catch {
                  return {}
                }
              })()

              const orderNumber = order.number || order.orderNumber || `#${order.id}`
              const invoiceNumber = order.invoiceNumber
              const packingSlipNumber = order.packingSlipNumber
              const orderStatus = order.status || order.orderStatus || 'pending'
              const orderId = order.wooId || order.id

              return (
                <Fragment key={index}>
                  <Box className='flex items-center justify-between gap-4 pbs-3 pbe-3'>
                    <Box className='flex flex-col gap-2 flex-1'>
                      <Typography variant='body2' color='text.secondary' className='font-medium'>
                        Order {orderNumber}
                      </Typography>
                      <Box className='flex items-center gap-2 flex-wrap'>
                        {invoiceNumber ? (
                          <Link href={`/${lang}/apps/invoice/preview/${orderId}`} passHref>
                            <Chip
                              label={invoiceNumber}
                              size='small'
                              color='success'
                              variant='tonal'
                              icon={<i className='tabler-file-invoice text-base' />}
                              clickable
                              component='a'
                              sx={{ cursor: 'pointer' }}
                            />
                          </Link>
                        ) : (
                          <Chip
                            label='No Invoice'
                            size='small'
                            color='default'
                            variant='outlined'
                          />
                        )}
                        {packingSlipNumber ? (
                          <Link href={`/${lang}/apps/packing-slips/view/${orderId}`} passHref>
                            <Chip
                              label={packingSlipNumber}
                              size='small'
                              color='primary'
                              variant='tonal'
                              icon={<i className='tabler-file-text text-base' />}
                              clickable
                              component='a'
                              sx={{ cursor: 'pointer' }}
                            />
                          </Link>
                        ) : (
                          <Chip
                            label='No Packing Slip'
                            size='small'
                            color='default'
                            variant='outlined'
                          />
                        )}
                      </Box>
                    </Box>
                    <Box className='flex items-center'>
                      <Chip
                        label={orderStatus}
                        color={getStatusColor(orderStatus)}
                        size='small'
                        variant='tonal'
                      />
                    </Box>
                  </Box>
                  {index !== shown.length - 1 && <Divider className='mlb-3 border-dashed' />}
                </Fragment>
              )
            })}
          </CardContent>
        </TabPanel>
      </TabContext>
    </Card>
  )
}

export default Orders
