'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Checkbox from '@mui/material/Checkbox'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'

// Component Imports
import Form from '@components/Form'
import CustomTextField from '@core/components/mui/TextField'

const ProductPricing = ({ product }) => {
  const [taxChecked, setTaxChecked] = useState(false)

  return (
    <Card>
      <CardHeader title='Pricing' />
      <CardContent>
        <Form>
          <CustomTextField fullWidth label='Base Price' placeholder='Enter Base Price' className='mbe-6' defaultValue={product?.regularPrice || ''} />
          <CustomTextField fullWidth label='Discounted Price' placeholder='KSh 0' className='mbe-6' defaultValue={product?.salePrice || ''} />
          <FormControlLabel control={<Checkbox checked={taxChecked} onChange={e => setTaxChecked(e.target.checked)} />} label='Charge tax on this product' />
          <Divider className='mlb-2' />
          <div className='flex items-center justify-between'>
            <Typography>In stock</Typography>
            <Switch defaultChecked={product?.stockStatus === 'instock'} />
          </div>
        </Form>
      </CardContent>
    </Card>
  )
}

export default ProductPricing
