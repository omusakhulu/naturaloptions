// Component Imports
import UserList from '@views/apps/user/list'
import FetchUsersButton from '@/components/users/FetchUsersButton'
import Grid from '@mui/material/Grid'

// Data Imports
import { getAllCustomers, saveCustomers } from '@/lib/db/customers'

/**
 * ! If you need data using an API call, uncomment the below API code, update the `process.env.API_URL` variable in the
 * ! `.env` file found at root of your project and also update the API endpoints like `/apps/user-list` in below example.
 * ! Also, remove the above server action import and the action itself from the `src/app/server/actions.ts` file to clean up unused code
 * ! because we've used the server action for getting our static data.
 */
/* const getUserData = async () => {
  // Vars
  const res = await fetch(`${process.env.API_URL}/apps/user-list`)

  if (!res.ok) {
    throw new Error('Failed to fetch userData')
  }

  return res.json()
} */
const UserListApp = async () => {
  // Fetch customers from database
  const customers = await getAllCustomers()

  // Transform database customers for display
  const userData = customers.map(customer => ({
    id: customer.wooId,
    fullName: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.username,
    email: customer.email,
    username: customer.username,
    role: customer.role,
    avatar: customer.avatarUrl,
    status: customer.role === 'customer' ? 'active' : 'inactive',
    joinDate: customer.createdAt
  }))

  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        <FetchUsersButton />
      </Grid>
      <Grid size={12}>
        <UserList userData={userData} />
      </Grid>
    </Grid>
  )
}

export default UserListApp
