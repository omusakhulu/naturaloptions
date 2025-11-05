// MUI Imports
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

const ProductAddHeader = ({ isEdit, product }) => {
  return (
    <div className='flex flex-wrap sm:items-center justify-between max-sm:flex-col gap-6'>
      <div>
        <Typography variant='h4' className='mbe-1'>
          {isEdit ? `Edit ${product?.name || 'Product'}` : 'Add a new product'}
        </Typography>
        <Typography>{isEdit ? 'Update product information' : 'Orders placed across your store'}</Typography>
      </div>
      <div className='flex flex-wrap max-sm:flex-col gap-4'>
        <Button variant='tonal' color='secondary'>
          Discard
        </Button>
        <Button variant='tonal'>Save Draft</Button>
        <Button variant='contained'>Publish Product</Button>
      </div>
    </div>
  )
}

export default ProductAddHeader
