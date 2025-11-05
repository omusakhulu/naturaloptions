// MUI Imports
import Grid from '@mui/material/Grid'

// Component Imports
import CustomerStatisticsCard from './CustomerStatisticsCard'
import OrderListTable from './OrderListTable'

// Database Imports
import { getOrdersByCustomerId } from '@/lib/db/orders'

/**
 * ! If you need data using an API call, uncomment the below API code, update the `process.env.API_URL` variable in the
 * ! `.env` file found at root of your project and also update the API endpoints like `/pages/widget-examples` in below example.
 * ! Also, remove the above server action import and the action itself from the `src/app/server/actions.ts` file to clean up unused code
 * ! because we've used the server action for getting our static data.
 */
/* const getStatisticsData = async () => {
  // Vars
  const res = await fetch(`${process.env.API_URL}/pages/widget-examples`)

  if (!res.ok) {
    throw new Error('Failed to fetch statistics data')
  }

  return res.json()
} */
/**
 * ! If you need data using an API call, uncomment the below API code, update the `process.env.API_URL` variable in the
 * ! `.env` file found at root of your project and also update the API endpoints like `/apps/ecommerce` in below example.
 * ! Also, remove the above server action import and the action itself from the `src/app/server/actions.ts` file to clean up unused code
 * ! because we've used the server action for getting our static data.
 */
/* const getEcommerceData = async () => {
  // Vars
  const res = await fetch(`${process.env.API_URL}/apps/ecommerce`)

  if (!res.ok) {
    throw new Error('Failed to fetch ecommerce data')
  }

  return res.json()
} */
const Overview = async ({ customerData }) => {
  // Fetch orders for this customer from database
  let customerOrders = []

  if (customerData?.id) {
    const dbOrders = await getOrdersByCustomerId(customerData.id)

    // Transform database orders for display
    customerOrders = dbOrders.map(order => ({
      order: order.wooId,
      date: order.dateCreated,
      status: order.status,
      spent: order.total,
      action: 'view'
    }))
  }

  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        <CustomerStatisticsCard customerStatData={[]} />
      </Grid>
      <Grid size={12}>
        <OrderListTable orderData={customerOrders} customerData={customerData} />
      </Grid>
    </Grid>
  )
}

export default Overview
