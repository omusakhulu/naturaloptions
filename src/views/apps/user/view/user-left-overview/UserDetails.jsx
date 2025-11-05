// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'

// Component Imports
import EditUserInfo from '@components/dialogs/edit-user-info'
import ConfirmationDialog from '@components/dialogs/confirmation-dialog'
import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick'
import CustomAvatar from '@core/components/mui/Avatar'

const UserDetails = ({ userData: userDataProp }) => {
  // Use passed userData or fallback to defaults
  const userData = userDataProp || {
    firstName: 'User',
    lastName: 'Name',
    username: 'username',
    email: 'user@example.com',
    status: 'active',
    role: 'customer'
  }

  const b = userData?.billingAddress || {}
  const derivedFirst = userData.firstName || b.first_name || ''
  const derivedLast = userData.lastName || b.last_name || ''
  const derivedEmail = userData.email || b.email || 'N/A'
  const derivedPhone = userData.phone || b.phone || 'N/A'
  const derivedCompany = userData.company || b.company || 'N/A'
  const derivedCountry = userData.country || b.country || 'N/A'

  // Vars
  const buttonProps = (children, color, variant) => ({
    children,
    color,
    variant
  })

  return (
    <>
      <Card>
        <CardContent className='flex flex-col pbs-12 gap-6'>
          <div className='flex flex-col gap-6'>
            <div className='flex items-center justify-center flex-col gap-4'>
              <div className='flex flex-col items-center gap-4'>
                <CustomAvatar
                  alt='user-profile'
                  src={userData.avatar || '/images/avatars/1.png'}
                  variant='rounded'
                  size={120}
                />
                <Typography variant='h5'>{`${derivedFirst || 'User'} ${derivedLast || 'Name'}`}</Typography>
              </div>
              <Chip label={userData.role || 'Customer'} color='secondary' size='small' variant='tonal' />
            </div>
            <div className='flex items-center justify-around flex-wrap gap-4'>
              <div className='flex items-center gap-4'>
                <CustomAvatar variant='rounded' color='primary' skin='light'>
                  <i className='tabler-checkbox' />
                </CustomAvatar>
                <div>
                  <Typography variant='h5'>{typeof userData.ordersCount === 'number' ? userData.ordersCount : 0}</Typography>
                  <Typography>Orders Made</Typography>
                </div>
              </div>
              <div className='flex items-center gap-4'>
                <CustomAvatar variant='rounded' color='primary' skin='light'>
                  <i className='tabler-briefcase' />
                </CustomAvatar>
                <div>
                  <Typography variant='h5'>{userData.boothNumber || '-'}</Typography>
                  <Typography>Stand Number</Typography>
                </div>
              </div>
            </div>
          </div>
          <div>
            <Typography variant='h5'>Details</Typography>
            <Divider className='mlb-4' />
            <div className='flex flex-col gap-2'>
              <div className='flex items-center flex-wrap gap-x-1.5'>
                <Typography className='font-medium' color='text.primary'>
                  Username:
                </Typography>
                <Typography>{userData.username || derivedEmail || 'N/A'}</Typography>
              </div>
              <div className='flex items-center flex-wrap gap-x-1.5'>
                <Typography className='font-medium' color='text.primary'>
                  Email:
                </Typography>
                <Typography>{derivedEmail}</Typography>
              </div>
              <div className='flex items-center flex-wrap gap-x-1.5'>
                <Typography className='font-medium' color='text.primary'>
                  Status:
                </Typography>
                <Typography color='text.primary'>{userData.status || 'active'}</Typography>
              </div>
              <div className='flex items-center flex-wrap gap-x-1.5'>
                <Typography className='font-medium' color='text.primary'>
                  Role:
                </Typography>
                <Typography color='text.primary'>{userData.role || 'customer'}</Typography>
              </div>
              <div className='flex items-center flex-wrap gap-x-1.5'>
                <Typography className='font-medium' color='text.primary'>
                  Phone:
                </Typography>
                <Typography color='text.primary'>{derivedPhone}</Typography>
              </div>
              <div className='flex items-center flex-wrap gap-x-1.5'>
                <Typography className='font-medium' color='text.primary'>
                  Company:
                </Typography>
                <Typography color='text.primary'>{derivedCompany}</Typography>
              </div>
              <div className='flex items-center flex-wrap gap-x-1.5'>
                <Typography className='font-medium' color='text.primary'>
                  Country:
                </Typography>
                <Typography color='text.primary'>{derivedCountry}</Typography>
              </div>
            </div>
          </div>
          <div className='flex gap-4 justify-center'>
            <OpenDialogOnElementClick
              element={Button}
              elementProps={buttonProps('Edit', 'primary', 'contained')}
              dialog={EditUserInfo}
              dialogProps={{ data: userData }}
            />
            <OpenDialogOnElementClick
              element={Button}
              elementProps={buttonProps('Suspend', 'error', 'tonal')}
              dialog={ConfirmationDialog}
              dialogProps={{ type: 'suspend-account' }}
            />
          </div>
        </CardContent>
      </Card>
    </>
  )
}

export default UserDetails
