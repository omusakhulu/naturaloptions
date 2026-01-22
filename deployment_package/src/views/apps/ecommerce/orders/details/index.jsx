// MUI Imports
import Grid from '@mui/material/Grid'

// Component Imports
import OrderDetailHeader from './OrderDetailHeader'
import OrderDetailsCard from './OrderDetailsCard'
import OrderNotes from './OrderNotesCard'
import CustomerDetails from './CustomerDetailsCard'
import ShippingAddress from './ShippingAddressCard'
import BillingAddress from './BillingAddressCard'

const OrderDetails = ({ orderData, order, locale = 'en' }) => {
  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        <OrderDetailHeader orderData={orderData} order={order} locale={locale} />
      </Grid>
      <Grid size={{ xs: 12, md: 8 }}>
        <Grid container spacing={6}>
          <Grid size={12}>
            <OrderDetailsCard orderData={orderData} />
          </Grid>
          <Grid size={12}>
            <OrderNotes orderData={orderData} />
          </Grid>
        </Grid>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Grid container spacing={6}>
          <Grid size={12}>
            <CustomerDetails orderData={orderData} />
          </Grid>
          <Grid size={12}>
            <ShippingAddress address={orderData?.shippingAddress} />
          </Grid>
          <Grid size={12}>
            <BillingAddress orderData={orderData} />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  )
}

export default OrderDetails
