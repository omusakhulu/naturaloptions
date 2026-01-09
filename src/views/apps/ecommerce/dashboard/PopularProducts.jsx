// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

// Components Imports
import OptionMenu from '@core/components/option-menu'

const money = v => `KSh ${Number.parseFloat(v || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const PopularProducts = ({ products = [] }) => {
  return (
    <Card>
      <CardHeader
        title='Popular Products'
        subheader={`Top ${products.length} by sales`}
        action={<OptionMenu options={['Price - low to high', 'Price - high to low', 'Best seller']} />}
      />
      <CardContent className='flex flex-col gap-[1.638rem]'>
        {products.map((item, index) => (
          <div key={index} className='flex items-center gap-4'>
            <div className='flex flex-wrap justify-between items-center gap-x-4 gap-y-1 is-full'>
              <div className='flex flex-col'>
                <Typography className='font-medium' color='text.primary'>
                  {item.title}
                </Typography>
                <Typography variant='body2'>{`Sold: ${item.sold}`}</Typography>
              </div>
              <Typography>{money(item.amount)}</Typography>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default PopularProducts
