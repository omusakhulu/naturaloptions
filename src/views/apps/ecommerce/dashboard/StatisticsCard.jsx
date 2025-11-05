// MUI Imports
import Link from 'next/link'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'

// Next Imports

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

const toMoney = v => `$${Number.parseFloat(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`

const StatisticsCard = ({ totals = {}, lang = 'en' }) => {
  const data = [
    { stats: String(totals.orders ?? 0), title: 'Orders', color: 'primary', icon: 'tabler-chart-pie-2' },
    { stats: String(totals.customers ?? 0), title: 'Customers', color: 'info', icon: 'tabler-users' },
    { stats: String(totals.products ?? 0), title: 'Products', color: 'error', icon: 'tabler-shopping-cart' },
    { stats: toMoney(totals.revenue ?? 0), title: 'Revenue', color: 'success', icon: 'tabler-currency-dollar' }
  ]

  return (
    <Card>
      <CardHeader
        title='Statistics'
        action={
          <div className='flex gap-2'>
            <Button component={Link} href={`/${lang}/apps/ecommerce/orders/list`} size='small' variant='outlined'>
              Orders
            </Button>
            <Button component={Link} href={`/${lang}/apps/ecommerce/products/list`} size='small' variant='outlined'>
              Products
            </Button>
            <Button component={Link} href={`/${lang}/apps/invoice/list`} size='small' variant='outlined'>
              Invoices
            </Button>
          </div>
        }
      />
      <CardContent className='flex justify-between flex-wrap gap-4 md:pbs-10 max-md:pbe-6 max-[1060px]:pbe-[74px] max-[1200px]:pbe-[52px] max-[1320px]:pbe-[74px] max-[1501px]:pbe-[52px]'>
        <Grid container spacing={4} sx={{ inlineSize: '100%' }}>
          {data.map((item, index) => (
            <Grid key={index} size={{ xs: 6, sm: 3 }} className='flex items-center gap-4'>
              <CustomAvatar color={item.color} variant='rounded' size={40} skin='light'>
                <i className={item.icon}></i>
              </CustomAvatar>
              <div className='flex flex-col'>
                <Typography variant='h5'>{item.stats}</Typography>
                <Typography variant='body2'>{item.title}</Typography>
              </div>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  )
}

export default StatisticsCard
