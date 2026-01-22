'use client'

// MUI Imports
import Grid from '@mui/material/Grid'

// Component Imports
import CustomerContact from './CustomerContact'
import CustomerInformation from './CustomerInformation'

const Checkout = () => {
  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        <CustomerContact />
      </Grid>
      <Grid size={12}>
        <CustomerInformation />
      </Grid>
    </Grid>
  )
}

export default Checkout
