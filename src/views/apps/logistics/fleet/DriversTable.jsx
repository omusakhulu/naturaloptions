'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'

// Component Imports
import DriverFormDialog from './DriverFormDialog'

const DriversTable = () => {
  const [drivers, setDrivers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editDriver, setEditDriver] = useState(null)

  const fetchDrivers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/logistics/drivers')
      const data = await response.json()

      if (data.success) {
        setDrivers(data.drivers)
      }
    } catch (error) {
      console.error('Error fetching drivers:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/logistics/vehicles')
      const data = await response.json()

      if (data.success) {
        setVehicles(data.vehicles)
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error)
    }
  }

  useEffect(() => {
    fetchDrivers()
    fetchVehicles()
  }, [])

  const getStatusColor = status => {
    switch (status) {
      case 'AVAILABLE':
        return 'success'
      case 'ON_DELIVERY':
        return 'info'
      case 'OFF_DUTY':
        return 'default'
      case 'ON_LEAVE':
        return 'warning'
      default:
        return 'default'
    }
  }

  const formatStatus = status => {
    return status.replace('_', ' ')
  }

  const formatDate = dateString => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleAddDriver = () => {
    setEditDriver(null)
    setFormOpen(true)
  }

  const handleEditDriver = (driver) => {
    setEditDriver(driver)
    setFormOpen(true)
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setEditDriver(null)
  }

  const handleFormSuccess = () => {
    fetchDrivers()
    fetchVehicles()
  }

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' py={6}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Card>
      <CardHeader
        title='All Drivers'
        subheader={`${drivers.length} total drivers`}
        action={
          <Box display='flex' gap={2}>
            <Button variant='outlined' onClick={fetchDrivers}>
              <i className='tabler-refresh' style={{ marginRight: 8 }} />
              Refresh
            </Button>
            <Button variant='contained' onClick={handleAddDriver}>
              <i className='tabler-plus' style={{ marginRight: 8 }} />
              Add Driver
            </Button>
          </Box>
        }
      />
      <CardContent>
        {drivers.length === 0 ? (
          <Box textAlign='center' py={4}>
            <Typography variant='body2' color='text.secondary'>
              No drivers found. Add your first driver to get started.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>License</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Vehicle</TableCell>
                  <TableCell>Today's Deliveries</TableCell>
                  <TableCell align='right'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {drivers.map(driver => (
                  <TableRow key={driver.id}>
                    <TableCell>
                      <Typography variant='subtitle2'>{driver.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>{driver.phone || 'N/A'}</Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {driver.email || 'No email'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>{driver.licenseNumber || 'N/A'}</Typography>
                      {driver.licenseExpiry && (
                        <Typography variant='caption' color='text.secondary'>
                          Exp: {formatDate(driver.licenseExpiry)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={formatStatus(driver.status)} size='small' color={getStatusColor(driver.status)} />
                    </TableCell>
                    <TableCell>
                      {driver.vehicle ? (
                        <Box>
                          <Typography variant='body2'>
                            {driver.vehicle.make} {driver.vehicle.model}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {driver.vehicle.registrationNo}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant='caption' color='text.secondary'>
                          No vehicle assigned
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={driver.deliveries.length} size='small' color='primary' />
                    </TableCell>
                    <TableCell align='right'>
                      <Tooltip title='View Details'>
                        <IconButton size='small'>
                          <i className='tabler-eye' />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title='Edit'>
                        <IconButton size='small' onClick={() => handleEditDriver(driver)}>
                          <i className='tabler-edit' />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title='Delete'>
                        <IconButton size='small' color='error'>
                          <i className='tabler-trash' />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>

      {/* Driver Form Dialog */}
      <DriverFormDialog
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        editData={editDriver}
        availableVehicles={vehicles}
      />
    </Card>
  )
}

export default DriversTable
