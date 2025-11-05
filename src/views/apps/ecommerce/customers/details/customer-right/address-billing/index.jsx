'use client'

// MUI Imports
import Grid from '@mui/material/Grid'

// Component Imports
import AddressBook from './AddressBookCard'
import PaymentMethod from './PaymentMethodCard'

const AddressBilling = () => {
  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        <AddressBook />
      </Grid>
      <Grid size={12}>
        <PaymentMethod />
      </Grid>
    </Grid>
  )
}

export default AddressBilling
