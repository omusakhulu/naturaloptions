// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

// Third-party Imports
import classnames from 'classnames'

// Components Imports
import OptionMenu from '@core/components/option-menu'
import CustomAvatar from '@core/components/mui/Avatar'

const MonthlyCampaignState = ({ monthlyMetrics }) => {
  const totalSales = monthlyMetrics?.totalSales || 0
  const totalOrders = monthlyMetrics?.totalOrders || 0
  const avgOrderValue = monthlyMetrics?.avgOrderValue || 0
  const newCustomers = monthlyMetrics?.newCustomers || 0
  const topProduct = monthlyMetrics?.topProduct || 'N/A'
  const returns = monthlyMetrics?.returns || 0

  const data = [
    {
      title: 'Total Sales',
      amount: `KSh ${totalSales.toLocaleString('en-KE')}`,
      trendNumber: '4.2%',
      avatarColor: 'success',
      icon: 'tabler-cash'
    },
    {
      title: 'Orders',
      amount: totalOrders.toLocaleString('en-KE'),
      trendNumber: '3.5%',
      avatarColor: 'info',
      icon: 'tabler-shopping-cart'
    },
    {
      title: 'Avg Order Value',
      amount: `KSh ${avgOrderValue.toLocaleString('en-KE')}`,
      trendNumber: '1.8%',
      avatarColor: 'primary',
      icon: 'tabler-chart-bar'
    },
    {
      title: 'New Customers',
      amount: newCustomers.toLocaleString('en-KE'),
      trendNumber: '6.2%',
      avatarColor: 'warning',
      icon: 'tabler-users'
    },
    {
      title: 'Top Product',
      amount: topProduct,
      trendNumber: '12.3%',
      avatarColor: 'secondary',
      icon: 'tabler-star'
    },
    {
      title: 'Returns',
      amount: returns.toLocaleString('en-KE'),
      trendNumber: '0.5%',
      trend: 'negative',
      avatarColor: 'error',
      icon: 'tabler-arrow-back-up'
    }
  ]

  return (
    <Card>
      <CardHeader
        title='Monthly Sales Metrics'
        subheader={`KSh ${(totalSales / 1000).toFixed(1)}k Revenue`}
        action={<OptionMenu options={['Last Month', 'Last 6 Months', 'Last Year']} />}
      />
      <CardContent className='flex flex-col gap-6 md:gap-[1.6875rem]'>
        {data.map((item, index) => (
          <div key={index} className='flex items-center gap-4'>
            <CustomAvatar skin='light' variant='rounded' color={item.avatarColor} size={34}>
              <i className={classnames(item.icon, 'text-[22px]')} />
            </CustomAvatar>
            <div className='flex flex-wrap justify-between items-center gap-x-4 gap-y-1 is-full'>
              <Typography className='font-medium' color='text.primary'>
                {item.title}
              </Typography>
              <div className='flex items-center gap-4'>
                <Typography>{item.amount}</Typography>
                <Typography
                  className='flex justify-end is-11'
                  color={`${item.trend === 'negative' ? 'error' : 'success'}.main`}
                >
                  {item.trendNumber}
                </Typography>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default MonthlyCampaignState
