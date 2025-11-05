// MUI Imports
import Grid from '@mui/material/Grid'

// Component Imports
import UserListTable from './UserListTable'
import UserListCards from './UserListCards'

const UserList = ({ userData }) => {
  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        <UserListCards />
      </Grid>
      <Grid size={12}>
        <UserListTable tableData={userData} />
      </Grid>
    </Grid>
  )
}

export default UserList
