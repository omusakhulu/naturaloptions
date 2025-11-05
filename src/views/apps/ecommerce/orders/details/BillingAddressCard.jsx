// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'

// Component Imports
import AddAddress from '@components/dialogs/add-edit-address'
import EditUserInfo from '@components/dialogs/edit-user-info'

import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick'
import { getInitials } from '@/utils/getInitials'

const getAvatar = params => {
  const { avatar, customer } = params

  if (avatar) {
    return <Avatar src={avatar} />
  } else {
    const customerName = typeof customer === 'object' ? customer?.name || 'Guest' : customer || 'Guest'

    return <Avatar>{getInitials(customerName)}</Avatar>
  }
}

// Vars
const data = {
  firstName: 'Roker',
  lastName: 'Terrace',
  email: 'sbaser0@boston.com',
  country: 'UK',
  address1: 'Latheronwheel',
  address2: 'KW5 8NW, London',
  landmark: 'Near Water Plant',
  city: 'London',
  state: 'Capholim',
  zipCode: '403114',
  taxId: 'TAX-875623',
  vatNumber: 'SDF754K77',
  contact: '+1 (609) 972-22-22'
}

const BillingAddress = ({ orderData }) => {
  // Vars
  const typographyProps = (children, color, className) => ({
    children,
    color,
    className
  })

  const billing = orderData?.billingAddress || {}

  const billingData = {
    firstName: billing.first_name || '',
    lastName: billing.last_name || '',
    email: billing.email || '',
    country: billing.country || '',
    address1: billing.address_1 || '',
    address2: billing.address_2 || '',
    city: billing.city || '',
    state: billing.state || '',
    zipCode: billing.postcode || '',
    contact: billing.phone || '',
    company: billing.company || ''
  }

  const fullName = `${billingData.firstName} ${billingData.lastName}`.trim() || 'N/A'

  return (
    <Card>
      <CardContent className='flex flex-col gap-6'>
        <div className='flex flex-col gap-2'>
          <div className='flex justify-between items-center'>
            <Typography variant='h5'>Billing Address</Typography>
            <OpenDialogOnElementClick
              element={Typography}
              elementProps={typographyProps('Edit', 'primary', 'cursor-pointer font-medium')}
              dialog={AddAddress}
              dialogProps={{ type: 'Add address for billing address', data: billingData }}
            />
          </div>
          <div className='flex flex-col'>
            {billingData.company && <Typography>Company: {billingData.company}</Typography>}
            {billingData.address1 && (
              <Typography>
                <span className='font-medium'>Address:</span> {billingData.address1}
              </Typography>
            )}
            {billingData.address2 && <Typography>{billingData.address2}</Typography>}
            {(billingData.city || billingData.state || billingData.zipCode) && (
              <Typography>
                {[billingData.city, billingData.state, billingData.zipCode].filter(Boolean).join(', ')}
              </Typography>
            )}
            {billingData.country && <Typography>{billingData.country}</Typography>}
            {billingData.contact && (
              <Typography className='mt-2'>
                <span className='font-medium'>Phone:</span> {billingData.contact}
              </Typography>
            )}
            {billingData.email && (
              <Typography>
                <span className='font-medium'>Email:</span> {billingData.email}
              </Typography>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default BillingAddress
