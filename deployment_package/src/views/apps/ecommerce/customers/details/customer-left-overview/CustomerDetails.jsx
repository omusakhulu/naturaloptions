// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'
import EditUserInfo from '@components/dialogs/edit-user-info'
import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick'

const CustomerDetails = ({ customerData, customerOrders = [] }) => {
  // Calculate order statistics
  const orderCount = customerOrders?.length || 0
  const totalSpent = customerOrders?.reduce((sum, order) => {
    // Handle both string and number formats
    let amount = 0
    if (order.total) {
      // Remove any currency symbols and convert to number
      const cleanTotal = String(order.total).replace(/[^0-9.-]/g, '')
      amount = parseFloat(cleanTotal) || 0
    }
    return sum + amount
  }, 0) || 0

  // Vars
  const buttonProps = {
    variant: 'contained',
    children: 'Edit Details'
  }

  return (
    <Card>
      <CardContent className='flex flex-col pbs-12 gap-6'>
        <div className='flex flex-col justify-self-center items-center gap-6'>
          <div className='flex flex-col items-center gap-4'>
            <CustomAvatar src={customerData?.avatarUrl} variant='rounded' alt='Customer Avatar' size={120} />
            <div className='flex flex-col items-center text-center'>
              <Typography variant='h5'>
                {customerData?.firstName && customerData?.lastName 
                  ? `${customerData.firstName} ${customerData.lastName}`
                  : customerData?.username || 'Customer'}
              </Typography>
              <Typography>Customer ID #{customerData?.id || customerData?.customerId}</Typography>
            </div>
          </div>
          <div className='flex items-center justify-around gap-4 flex-wrap is-full'>
            <div className='flex items-center gap-4'>
              <CustomAvatar variant='rounded' skin='light' color='primary'>
                <i className='tabler-shopping-cart' />
              </CustomAvatar>
              <div>
                <Typography variant='h5'>{orderCount}</Typography>
                <Typography>Orders</Typography>
              </div>
            </div>
            <div className='flex items-center gap-4'>
              <CustomAvatar variant='rounded' skin='light' color='primary'>
                <i className='tabler-currency-dollar' />
              </CustomAvatar>
              <div>
                <Typography variant='h5'>KSh {totalSpent.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</Typography>
                <Typography>Spent</Typography>
              </div>
            </div>
          </div>
        </div>
        <div className='flex flex-col gap-4'>
          <Typography variant='h5'>Details</Typography>
          <Divider />
          <div className='flex flex-col gap-2'>
            <div className='flex items-center gap-1'>
              <Typography color='text.primary' className='font-medium'>
                Username:
              </Typography>
              <Typography>{customerData?.username || 'N/A'}</Typography>
            </div>
            <div className='flex items-center gap-1'>
              <Typography color='text.primary' className='font-medium'>
                Billing Email:
              </Typography>
              <Typography>{customerData?.email || 'N/A'}</Typography>
            </div>
            <div className='flex items-center gap-1'>
              <Typography color='text.primary' className='font-medium'>
                Status:
              </Typography>
              <Chip label={customerData?.role === 'customer' ? 'Active' : 'Inactive'} variant='tonal' color={customerData?.role === 'customer' ? 'success' : 'default'} size='small' />
            </div>
            <div className='flex items-center gap-1'>
              <Typography color='text.primary' className='font-medium'>
                Role:
              </Typography>
              <Typography>{customerData?.role || 'Customer'}</Typography>
            </div>
            <div className='flex items-center gap-1'>
              <Typography color='text.primary' className='font-medium'>
                Member Since:
              </Typography>
              <Typography>
                {customerData?.createdAt 
                  ? new Date(customerData.createdAt).toLocaleDateString()
                  : 'N/A'}
              </Typography>
            </div>
          </div>
        </div>
        <OpenDialogOnElementClick element={Button} elementProps={buttonProps} dialog={EditUserInfo} />
      </CardContent>
    </Card>
  )
}

export default CustomerDetails
