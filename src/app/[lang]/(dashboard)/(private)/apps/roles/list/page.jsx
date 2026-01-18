'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

// Role configurations
const roleConfig = {
  SUPER_ADMIN: {
    label: 'Super Admin',
    color: 'error',
    description: 'Full system access',
    icon: 'tabler-shield-check'
  },
  ADMIN: {
    label: 'Admin',
    color: 'warning',
    description: 'Admin access to most features',
    icon: 'tabler-user-shield'
  },
  MANAGER: {
    label: 'Manager',
    color: 'info',
    description: 'Can manage projects, orders, inventory',
    icon: 'tabler-user-cog'
  },
  ACCOUNTANT: {
    label: 'Accountant',
    color: 'success',
    description: 'Can access accounting features',
    icon: 'tabler-report-money'
  },
  CASHIER: {
    label: 'Cashier',
    color: 'primary',
    description: 'Can operate POS terminals',
    icon: 'tabler-cash'
  },
  SALES: {
    label: 'Sales',
    color: 'success',
    description: 'Can create quotes, view reports',
    icon: 'tabler-shopping-cart'
  },
  USER: {
    label: 'User',
    color: 'default',
    description: 'Basic access',
    icon: 'tabler-user'
  }
}

const RolesListPage = () => {
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState('ALL')
  const [confirmDialog, setConfirmDialog] = useState({ open: false, userId: null, newRole: null })
  const [updating, setUpdating] = useState(false)

  // Fetch users
  useEffect(() => {
    fetchUsers()
  }, [])

  // Filter users based on search and role filter
  useEffect(() => {
    let filtered = users

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      
      filtered = filtered.filter(user =>
        user.fullName?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
      )
    }

    // Role filter
    if (filterRole !== 'ALL') {
      filtered = filtered.filter(user => user.role === filterRole)
    }

    setFilteredUsers(filtered)
  }, [users, searchQuery, filterRole])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users')
      
      if (!response.ok) throw new Error('Failed to fetch users')
      
      const data = await response.json()
      
      setUsers(data)
      setFilteredUsers(data)
    } catch (err) {
      setError('Failed to load users')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = (userId, newRole) => {
    setConfirmDialog({ open: true, userId, newRole })
  }

  const confirmRoleChange = async () => {
    const { userId, newRole } = confirmDialog
    
    setUpdating(true)
    
    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })

      if (!response.ok) throw new Error('Failed to update role')

      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ))

      setError('')
      setConfirmDialog({ open: false, userId: null, newRole: null })
    } catch (err) {
      setError('Failed to update user role')
      console.error(err)
    } finally {
      setUpdating(false)
    }
  }

  const getRoleChip = (role) => {
    const config = roleConfig[role] || roleConfig.USER
    
    return (
      <Chip 
        label={config.label}
        color={config.color}
        size="small"
        icon={<i className={config.icon} />}
      />
    )
  }

  if (loading) {
    return (
      <div className='flex justify-center items-center min-h-[400px]'>
        <CircularProgress />
      </div>
    )
  }

  return (
    <>
      <Card>
        <CardHeader 
          title='User Roles Management' 
          subheader='Manage user roles and permissions'
        />
        <CardContent>
          {error && (
            <Alert severity='error' onClose={() => setError('')} className='mb-4'>
              {error}
            </Alert>
          )}

          {/* Filters */}
          <div className='flex gap-4 mb-6 flex-wrap'>
            <CustomTextField
              placeholder='Search by name or email...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='flex-1 min-w-[200px]'
            />
            <FormControl className='min-w-[150px]'>
              <InputLabel>Filter by Role</InputLabel>
              <Select
                value={filterRole}
                label='Filter by Role'
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <MenuItem value='ALL'>All Roles</MenuItem>
                <MenuItem value='SUPER_ADMIN'>Super Admin</MenuItem>
                <MenuItem value='ADMIN'>Admin</MenuItem>
                <MenuItem value='MANAGER'>Manager</MenuItem>
                <MenuItem value='ACCOUNTANT'>Accountant</MenuItem>
                <MenuItem value='CASHIER'>Cashier</MenuItem>
                <MenuItem value='SALES'>Sales</MenuItem>
                <MenuItem value='USER'>User</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant='outlined'
              onClick={fetchUsers}
              startIcon={<i className='tabler-refresh' />}
            >
              Refresh
            </Button>
          </div>

          {/* Users Table */}
          <TableContainer component={Paper} variant='outlined'>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Current Role</TableCell>
                  <TableCell>Assign Role</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align='center'>
                      <Typography color='text.secondary'>
                        No users found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className='flex items-center gap-3'>
                          <Avatar src={user.avatar} alt={user.fullName}>
                            {user.fullName?.[0]?.toUpperCase()}
                          </Avatar>
                          <div>
                            <Typography variant='body2' fontWeight={500}>
                              {user.fullName}
                            </Typography>
                            <Typography variant='caption' color='text.secondary'>
                              ID: {user.id.slice(0, 8)}
                            </Typography>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2'>{user.email}</Typography>
                      </TableCell>
                      <TableCell>
                        {getRoleChip(user.role)}
                      </TableCell>
                      <TableCell>
                        <FormControl size='small' className='min-w-[150px]'>
                          <Select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          >
                            {Object.keys(roleConfig).map((role) => (
                              <MenuItem key={role} value={role}>
                                <div className='flex items-center gap-2'>
                                  <i className={roleConfig[role].icon} />
                                  {roleConfig[role].label}
                                </div>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.isActive ? 'Active' : 'Inactive'}
                          color={user.isActive ? 'success' : 'default'}
                          size='small'
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Role Descriptions */}
          <div className='mt-6'>
            <Typography variant='h6' className='mb-3'>Role Permissions</Typography>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {Object.entries(roleConfig).map(([role, config]) => (
                <Card key={role} variant='outlined'>
                  <CardContent>
                    <div className='flex items-center gap-2 mb-2'>
                      <i className={`${config.icon} text-2xl`} />
                      <Typography variant='h6'>{config.label}</Typography>
                    </div>
                    <Typography variant='body2' color='text.secondary'>
                      {config.description}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => !updating && setConfirmDialog({ open: false, userId: null, newRole: null })}
      >
        <DialogTitle>Confirm Role Change</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to change this user's role to{' '}
            <strong>{roleConfig[confirmDialog.newRole]?.label}</strong>?
            <br /><br />
            This will change their permissions immediately.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmDialog({ open: false, userId: null, newRole: null })}
            disabled={updating}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmRoleChange} 
            variant='contained' 
            color='primary'
            disabled={updating}
          >
            {updating ? <CircularProgress size={20} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default RolesListPage
