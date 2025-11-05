// MUI Imports
import Grid from '@mui/material/Grid'

// Component Imports
import ChangePassword from './ChangePassword'
import TwoStepVerification from './TwoStepVerification'
import RecentDevice from './RecentDevice'

const SecurityTab = () => {
  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        <ChangePassword />
      </Grid>
    </Grid>
  )
}

export default SecurityTab
