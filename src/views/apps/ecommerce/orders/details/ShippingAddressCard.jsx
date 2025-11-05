// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

const ShippingAddress = ({ address }) => {
  const line1 = [address?.first_name, address?.last_name].filter(Boolean).join(' ')
  const line2 = [address?.address_1, address?.address_2].filter(Boolean).join(', ')
  const line3 = [address?.city, address?.state, address?.postcode].filter(Boolean).join(', ')
  const line4 = address?.country

  return (
    <Card>
      <CardContent className='flex flex-col gap-6'>
        <div className='flex justify-between items-center'>
          <Typography variant='h5'>Shipping Address</Typography>
        </div>
        <div className='flex flex-col'>
          {line1 ? <Typography>{line1}</Typography> : null}
          {line2 ? <Typography>{line2}</Typography> : null}
          {line3 ? <Typography>{line3}</Typography> : null}
          {line4 ? <Typography>{line4}</Typography> : null}
        </div>
      </CardContent>
    </Card>
  )
}

export default ShippingAddress
