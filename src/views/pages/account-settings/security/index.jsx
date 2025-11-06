// MUI Imports
import Grid from '@mui/material/Grid'

// Component Imports
import ChangePasswordCard from './ChangePasswordCard'
import TwoFactorAuthenticationCard from './TwoFactorAuthenticationCard'
import CreateApiKey from './CreateApiKey'
import ApiKeyList from './ApiKeyList'
import RecentDevicesTable from './RecentDevicesTable'

const Security = () => {
  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        <ChangePasswordCard />
      </Grid>
    </Grid>
  )
}

export default Security
