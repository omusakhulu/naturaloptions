// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'

// Third-party Imports
import classnames from 'classnames'

// Components Imports
import OptionMenu from '@core/components/option-menu'
import CustomAvatar from '@core/components/mui/Avatar'

const SourceVisits = ({ paymentMethods }) => {
  const getPaymentIcon = method => {
    const methodLower = (method || '').toLowerCase()
    if (methodLower.includes('mpesa') || methodLower.includes('m-pesa')) return 'tabler-device-mobile'
    if (methodLower.includes('cash')) return 'tabler-cash'
    if (methodLower.includes('card') || methodLower.includes('credit')) return 'tabler-credit-card'
    if (methodLower.includes('bank')) return 'tabler-building-bank'
    if (methodLower.includes('pesapal')) return 'tabler-wallet'
    return 'tabler-coin'
  }

  const totalPayments = paymentMethods.reduce((sum, pm) => sum + pm.count, 0)
  const totalAmount = paymentMethods.reduce((sum, pm) => sum + pm.amount, 0)

  const data = paymentMethods.slice(0, 6).map((pm, idx) => {
    const sharePercent = totalAmount > 0 ? ((pm.amount / totalAmount) * 100).toFixed(1) : 0
    return {
      title: pm.method,
      subtitle: `${pm.count} transactions`,
      amount: `KSh ${Math.round(pm.amount).toLocaleString('en-KE')}`,
      trendNumber: parseFloat(sharePercent),
      trend: sharePercent > 15 ? 'positive' : sharePercent < 5 ? 'negative' : 'neutral',
      icon: getPaymentIcon(pm.method)
    }
  })

  // Fill with empty slots if less than 6
  while (data.length < 6) {
    data.push({
      title: 'Other',
      subtitle: '0 transactions',
      amount: 'KSh 0',
      trendNumber: 0,
      trend: 'neutral',
      icon: 'tabler-dots'
    })
  }

  return (
    <Card>
      <CardHeader
        title='Payment Methods'
        subheader={`${totalPayments} Total Payments`}
        action={<OptionMenu options={['Last Week', 'Last Month', 'Last Year']} />}
      />
      <CardContent className='flex flex-col gap-6 md:gap-[1.0875rem] lg:gap-[1.5875rem]'>
        {data.map((item, index) => (
          <div key={index} className='flex items-center gap-4'>
            <CustomAvatar skin='light' variant='rounded' size={34}>
              <i className={classnames(item.icon, 'text-[22px] text-textSecondary')} />
            </CustomAvatar>
            <div className='flex flex-wrap justify-between items-center gap-x-4 gap-y-1 is-full'>
              <div className='flex flex-col'>
                <Typography className='font-medium' color='text.primary'>
                  {item.title}
                </Typography>
                <Typography variant='body2'>{item.subtitle}</Typography>
              </div>
              <div className='flex items-center gap-4'>
                <Typography>{item.amount}</Typography>
                <Chip
                  variant='tonal'
                  size='small'
                  color={item.trend === 'negative' ? 'error' : 'success'}
                  label={`${item.trend === 'negative' ? '-' : '+'}${item.trendNumber}%`}
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default SourceVisits
