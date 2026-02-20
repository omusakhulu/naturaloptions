// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

// Third-party Imports
import classnames from 'classnames'

// Components Imports
import OptionMenu from '@core/components/option-menu'

const SalesByCountries = ({ data = [] }) => {
  // If no data, show a message
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader
          title='Sales by Location'
          subheader='Monthly Sales Overview'
          action={<OptionMenu options={['Last Week', 'Last Month', 'Last Year']} />}
        />
        <CardContent>
          <Typography variant='body2' color='text.secondary'>
            No sales data available
          </Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader
        title='Sales by Location'
        subheader='Monthly Sales Overview'
        action={<OptionMenu options={['Last Week', 'Last Month', 'Last Year']} />}
      />
      <CardContent className='flex flex-col gap-4'>
        {data.map((item, index) => {
          // Calculate trend (fake for now, as we don't have historical data)
          const trend = index % 2 === 0 ? 'positive' : 'negative'
          const trendNumber = (15 + index * 2.5).toFixed(1)

          return (
            <div key={index} className='flex items-center gap-4'>
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
                      trend === 'negative' ? 'tabler-chevron-down text-error' : 'tabler-chevron-up text-success',
                      'text-xl'
                    )}
                  />
                  <Typography variant='h6' color={`${trend === 'negative' ? 'error' : 'success'}.main`}>{`${trendNumber}%`}</Typography>
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export default SalesByCountries
