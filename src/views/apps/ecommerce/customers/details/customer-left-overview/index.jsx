// MUI Imports
import Grid from '@mui/material/Grid'

// Component Imports
import CustomerDetails from './CustomerDetails'
import CustomerPlan from './CustomerPlan'

const CustomerLeftOverview = ({ customerData, customerOrders = [] }) => {
  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        <CustomerDetails customerData={customerData} customerOrders={customerOrders} />
      </Grid>
      <Grid size={12}>
        <CustomerPlan />
      </Grid>
    </Grid>
  )
}

export default CustomerLeftOverview
