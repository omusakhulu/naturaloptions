// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import MenuItem from '@mui/material/MenuItem'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

const StoreCurrency = () => {
  // States
  const [currency, setCurrency] = useState('KES')

  return (
    <Card>
      <CardHeader title='Store currency' subheader='The currency your products are sold in.' />
      <CardContent>
        <CustomTextField
          select
          fullWidth
          label='Store currency'
          value={currency}
          onChange={e => setCurrency(e.target.value)}
        >
          <MenuItem value=''>Select Currency</MenuItem>
          <MenuItem value='KES'>KES</MenuItem>
        </CustomTextField>
      </CardContent>
    </Card>
  )
}

export default StoreCurrency
