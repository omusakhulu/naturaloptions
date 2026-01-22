// Next Imports
import { redirect } from 'next/navigation'

// Component Imports
import CustomerDetails from '@/views/apps/ecommerce/customers/details'

// Database Imports
import { getCustomerByWooId } from '@/lib/db/customers'
import { getOrdersByCustomerId } from '@/lib/db/orders'

const CustomerDetailsPage = async props => {
  const params = await props.params
  const customerId = parseInt(params.id)

  if (!params || !params.id) {
    console.error('Customer ID not provided')
    redirect('/not-found')
  }

  if (isNaN(customerId)) {
    console.error(`Invalid customer ID: ${params.id}`)
    redirect('/not-found')
  }

  // Fetch customer from database
  let customerData = await getCustomerByWooId(customerId)

  if (!customerData) {
    console.warn(`Customer ${customerId} not found in database`)
    redirect('/not-found')
  }

  // Fetch customer orders
  const dbOrders = await getOrdersByCustomerId(customerId)

  // Transform database orders for display
  const transformedOrders = dbOrders.map(order => ({
    order: order.wooId,
    date: order.dateCreated,
    status: order.status,
    spent: order.total,
    action: 'view'
  }))

  // Transform database customer for display
  const transformedCustomer = {
    id: customerData.wooId,
    customerId: customerData.wooId,
    email: customerData.email,
    firstName: customerData.firstName,
    lastName: customerData.lastName,
    username: customerData.username,
    role: customerData.role,
    avatarUrl: customerData.avatarUrl,
    billingAddress: customerData.billingAddress ? JSON.parse(customerData.billingAddress) : {},
    shippingAddress: customerData.shippingAddress ? JSON.parse(customerData.shippingAddress) : {},
    createdAt: customerData.createdAt
  }

  return <CustomerDetails customerData={transformedCustomer} customerId={params.id} customerOrders={transformedOrders} />
}

export default CustomerDetailsPage
