'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

// Third-party Imports
import classnames from 'classnames'

// Components Imports
import OptionMenu from '@core/components/option-menu'

const flagImages = ['us', 'brazil', 'india', 'australia', 'france', 'china']

const defaultData = [
  {
    title: 'Nairobi',
    subtitle: 'No data yet',
    trendNumber: 0,
    imgSrc: '/images/cards/us.png'
  }
]

const SalesByCountries = ({ stats }) => {
  const locationData =
    stats?.salesByLocation?.length > 0
      ? stats.salesByLocation.map((loc, i) => ({
          title: loc.location,
          subtitle: `${loc.quantity.toLocaleString('en-KE')} units`,
          trendNumber: 0,
          imgSrc: `/images/cards/${flagImages[i % flagImages.length]}.png`
        }))
      : defaultData

  return (
    <Card>
      <CardHeader
        title='Sales by Location'
        subheader='Monthly Stock Overview'
        action={<OptionMenu options={['Last Week', 'Last Month', 'Last Year']} />}
      />
      <CardContent className='flex flex-col gap-[1.0875rem]'>
        {locationData.map((item, index) => (
          <div key={index} className='flex items-center gap-4'>
            <img src={item.imgSrc} alt={item.title} width={34} />
            <div className='flex flex-wrap justify-between items-center gap-x-4 gap-y-1 is-full'>
              <div className='flex flex-col'>
                <Typography className='font-medium' color='text.primary'>
                  {item.title}
                </Typography>
                <Typography variant='body2'>{item.subtitle}</Typography>
              </div>
              <div className='flex items-center gap-1'>
                <i
                  className={classnames(
                    item.trend === 'negative' ? 'tabler-chevron-down text-error' : 'tabler-chevron-up text-success',
                    'text-xl'
                  )}
                />
                <Typography
                  variant='h6'
                  color={`${item.trend === 'negative' ? 'error' : 'success'}.main`}
                >{`${item.trendNumber}%`}</Typography>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default SalesByCountries
