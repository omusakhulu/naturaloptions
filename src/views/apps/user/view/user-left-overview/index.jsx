// MUI Imports
import Grid from '@mui/material/Grid'

// Component Imports
import UserDetails from './UserDetails'

const UserLeftOverview = ({ userData }) => {
  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        <UserDetails userData={userData} />
      </Grid>
    </Grid>
  )
}

export default UserLeftOverview
