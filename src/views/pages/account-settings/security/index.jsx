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

      <Grid size={12}>
        <CreateApiKey />
      </Grid>
      <Grid size={12}>
        <ApiKeyList />
      </Grid>
      <Grid size={12}>
        <RecentDevicesTable />
      </Grid>
    </Grid>
  )
}

export default Security
