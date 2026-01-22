'use client'

// React Imports
import { useState, useEffect, useMemo } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import Checkbox from '@mui/material/Checkbox'

// Role definitions
const roleDefinitions = {
  SUPER_ADMIN: {
    title: 'Super Admin',
    color: 'error',
    icon: 'tabler-shield-check',
    description: 'Full system access including user management, settings, and all features',
    permissions: ['All Permissions', 'User Management', 'System Settings', 'Data Export', 'Audit Logs']
  },
  ADMIN: {
    title: 'Admin',
    color: 'warning',
    icon: 'tabler-user-shield',
    description: 'Admin access to most features except critical system settings',
    permissions: ['User Management', 'Content Management', 'Reports', 'Order Management', 'Product Management']
  },
  MANAGER: {
    title: 'Manager',
    color: 'info',
    icon: 'tabler-user-cog',
    description: 'Can manage projects, orders, and inventory',
    permissions: ['Project Management', 'Order Management', 'Inventory Control', 'Reports', 'Customer Management']
  },
  SALES: {
    title: 'Sales',
    color: 'success',
    icon: 'tabler-shopping-cart',
    description: 'Can create quotes and view sales reports',
    permissions: ['Create Quotes', 'View Orders', 'Customer Management', 'Sales Reports', 'Product Catalog']
  },
  USER: {
    title: 'User',
    color: 'default',
    icon: 'tabler-user',
    description: 'Basic access to view content and personal data',
    permissions: ['View Dashboard', 'View Own Profile', 'View Products', 'Submit Requests']
  }
}

const RoleCards = ({ userData = [], onRoleUpdate }) => {
  const [selectedRole, setSelectedRole] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [roleForAssignment, setRoleForAssignment] = useState(null)
  const [selectedUsers, setSelectedUsers] = useState([])
  const [updating, setUpdating] = useState(false)

  // Calculate user counts per role
  const roleCounts = useMemo(() => {
    const counts = {
      SUPER_ADMIN: 0,
      ADMIN: 0,
      MANAGER: 0,
      SALES: 0,
      USER: 0
    }

    userData.forEach(user => {
      if (counts.hasOwnProperty(user.role)) {
        counts[user.role]++
      }
    })

    return counts
  }, [userData])

  const handleCardClick = (roleKey) => {
    setSelectedRole(roleKey)
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setSelectedRole(null)
  }

  const handleOpenAssignDialog = (roleKey, e) => {
    e.stopPropagation() // Prevent card click
    setRoleForAssignment(roleKey)
    setAssignDialogOpen(true)
    setSelectedUsers([])
  }

  const handleCloseAssignDialog = () => {
    setAssignDialogOpen(false)
    setRoleForAssignment(null)
    setSelectedUsers([])
  }

  // Get users who don't have the selected role
  const availableUsers = useMemo(() => {
    if (!roleForAssignment) return []
    return userData.filter(user => user.role !== roleForAssignment)
  }, [userData, roleForAssignment])

  const handleAssignUsers = async () => {
    if (selectedUsers.length === 0) return

    setUpdating(true)
    
    try {
      // Update each selected user's role
      const updatePromises = selectedUsers.map(user =>
        fetch(`/api/users/${user.id}/role`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: roleForAssignment })
        })
      )

      await Promise.all(updatePromises)

      // Call parent callback to refresh data
      if (onRoleUpdate) {
        onRoleUpdate()
      }

      handleCloseAssignDialog()
    } catch (error) {
      console.error('Error assigning users to role:', error)
      alert('Failed to assign users to role')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <>
      <Grid container spacing={6}>
        {Object.entries(roleDefinitions).map(([roleKey, roleInfo]) => (
          <Grid size={3} key={roleKey}>
            <Card
              className='cursor-pointer hover:shadow-lg transition-shadow'
              onClick={() => handleCardClick(roleKey)}
            >
              <CardContent className='flex flex-col gap-4'>
                <div className='flex items-center justify-between'>
                  <Chip
                    label={`${roleCounts[roleKey]} ${roleCounts[roleKey] === 1 ? 'user' : 'users'}`}
                    color={roleInfo.color}
                    size='small'
                  />
                  <i className={`${roleInfo.icon} text-3xl`} />
                </div>
                <div className='flex flex-col gap-2'>
                  <Typography variant='h5'>{roleInfo.title}</Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {roleInfo.description}
                  </Typography>
                  <div className='flex gap-2 mt-2'>
                    <Button
                      variant='contained'
                      size='small'
                      color={roleInfo.color}
                      startIcon={<i className='tabler-user-plus' />}
                      onClick={(e) => handleOpenAssignDialog(roleKey, e)}
                    >
                      Assign Users
                    </Button>
                    <Button
                      variant='text'
                      size='small'
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCardClick(roleKey)
                      }}
                    >
                      Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Role Details Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth='sm' fullWidth>
        {selectedRole && (
          <>
            <DialogTitle>
              <div className='flex items-center gap-3'>
                <i className={`${roleDefinitions[selectedRole].icon} text-3xl`} />
                <div>
                  <Typography variant='h5'>{roleDefinitions[selectedRole].title}</Typography>
                  <Chip
                    label={`${roleCounts[selectedRole]} ${roleCounts[selectedRole] === 1 ? 'user' : 'users'}`}
                    color={roleDefinitions[selectedRole].color}
                    size='small'
                    className='mt-2'
                  />
                </div>
              </div>
            </DialogTitle>
            <DialogContent dividers>
              <div className='flex flex-col gap-4'>
                <div>
                  <Typography variant='subtitle2' gutterBottom>
                    Description
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {roleDefinitions[selectedRole].description}
                  </Typography>
                </div>
                <div>
                  <Typography variant='subtitle2' gutterBottom>
                    Permissions
                  </Typography>
                  <ul className='list-disc list-inside space-y-1'>
                    {roleDefinitions[selectedRole].permissions.map((permission, index) => (
                      <li key={index}>
                        <Typography variant='body2' component='span' color='text.secondary'>
                          {permission}
                        </Typography>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className='bg-warning-light p-3 rounded'>
                  <Typography variant='caption' color='text.secondary'>
                    <strong>Note:</strong> Roles are system-defined and cannot be deleted. You can only assign these roles to users from the users table below.
                  </Typography>
                </div>
              </div>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Assign Users Dialog */}
      <Dialog open={assignDialogOpen} onClose={handleCloseAssignDialog} maxWidth='md' fullWidth>
        {roleForAssignment && (
          <>
            <DialogTitle>
              <div className='flex items-center gap-3'>
                <i className={`${roleDefinitions[roleForAssignment].icon} text-2xl`} />
                <div>
                  <Typography variant='h5'>Assign Users to {roleDefinitions[roleForAssignment].title}</Typography>
                  <Typography variant='caption' color='text.secondary'>
                    Select users to assign the {roleDefinitions[roleForAssignment].title} role
                  </Typography>
                </div>
              </div>
            </DialogTitle>
            <DialogContent dividers>
              <div className='flex flex-col gap-4'>
                <Typography variant='body2' color='text.secondary'>
                  Search and select multiple users to assign them to the {roleDefinitions[roleForAssignment].title} role.
                  Only users who don't currently have this role are shown.
                </Typography>

                <Autocomplete
                  multiple
                  fullWidth
                  options={availableUsers}
                  value={selectedUsers}
                  onChange={(event, newValue) => setSelectedUsers(newValue)}
                  getOptionLabel={(option) => option.fullName || option.email || 'Unknown'}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder='Search users by name or email...'
                      variant='outlined'
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      <div className='flex items-center gap-3 py-2 w-full'>
                        <Avatar src={option.avatar} alt={option.fullName} sx={{ width: 32, height: 32 }}>
                          {option.fullName?.[0]?.toUpperCase()}
                        </Avatar>
                        <div className='flex flex-col flex-1'>
                          <Typography variant='body2' fontWeight={500}>
                            {option.fullName}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {option.email} • Current: {roleDefinitions[option.role]?.title || option.role}
                          </Typography>
                        </div>
                      </div>
                    </li>
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        {...getTagProps({ index })}
                        key={option.id}
                        avatar={<Avatar src={option.avatar}>{option.fullName?.[0]}</Avatar>}
                        label={option.fullName}
                        size='small'
                      />
                    ))
                  }
                  filterOptions={(options, { inputValue }) => {
                    const searchLower = inputValue.toLowerCase()
                    return options.filter(option =>
                      option.fullName?.toLowerCase().includes(searchLower) ||
                      option.email?.toLowerCase().includes(searchLower)
                    )
                  }}
                  noOptionsText={availableUsers.length === 0 ? 'All users already have this role' : 'No users found'}
                />

                {selectedUsers.length > 0 && (
                  <div className='bg-success-light p-3 rounded'>
                    <Typography variant='body2' fontWeight={500} gutterBottom>
                      {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      These users will be assigned the {roleDefinitions[roleForAssignment].title} role
                    </Typography>
                  </div>
                )}

                <div className='bg-info-light p-3 rounded'>
                  <Typography variant='caption' color='text.secondary'>
                    <strong>Note:</strong> This will change their role immediately and update their permissions.
                  </Typography>
                </div>
              </div>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseAssignDialog} disabled={updating}>
                Cancel
              </Button>
              <Button
                variant='contained'
                color={roleDefinitions[roleForAssignment].color}
                onClick={handleAssignUsers}
                disabled={selectedUsers.length === 0 || updating}
                startIcon={updating ? <CircularProgress size={16} /> : <i className='tabler-user-check' />}
              >
                {updating ? 'Assigning...' : `Assign ${selectedUsers.length > 0 ? `(${selectedUsers.length})` : ''}`}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  )
}

export default RoleCards
