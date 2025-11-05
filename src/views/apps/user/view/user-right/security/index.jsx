// MUI Imports
import Grid from '@mui/material/Grid'
import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'

// Component Imports
import ChangePassword from './ChangePassword'
import TwoStepVerification from './TwoStepVerification'
import RecentDevice from './RecentDevice'

const SecurityTab = ({ userData }) => {
  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        <Alert severity='info'>
          <Typography variant='body2'>
            WooCommerce ID: <strong>{userData?.wooId ?? userData?.id ?? 'N/A'}</strong>
          </Typography>
        </Alert>
      </Grid>
      <Grid size={12}>
        <ChangePassword userData={userData} />
      </Grid>
    </Grid>
  )
}

export default SecurityTab
