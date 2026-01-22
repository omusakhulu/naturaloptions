// MUI Imports
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

// Component Imports
import ConfirmationDialog from '@components/dialogs/confirmation-dialog'
import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick'

const CustomerDetailHeader = ({ customerId, customerData }) => {
  // Vars
  const buttonProps = (children, color, variant) => ({
    children,
    color,
    variant
  })

  const customerName = customerData?.firstName && customerData?.lastName 
    ? `${customerData.firstName} ${customerData.lastName}`
    : customerData?.username || 'Customer'

  const createdDate = customerData?.createdAt 
    ? new Date(customerData.createdAt).toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'America/New_York'
      })
    : 'N/A'

  return (
    <div className='flex flex-wrap justify-between max-sm:flex-col sm:items-center gap-x-6 gap-y-4'>
      <div className='flex flex-col items-start gap-1'>
        <Typography variant='h4'>{customerName}</Typography>
        <Typography>{`${createdDate} (ET)`}</Typography>
      </div>
      <OpenDialogOnElementClick
        element={Button}
        elementProps={buttonProps('Delete Customer', 'error', 'tonal')}
        dialog={ConfirmationDialog}
        dialogProps={{ type: 'delete-customer' }}
      />
    </div>
  )
}

export default CustomerDetailHeader
