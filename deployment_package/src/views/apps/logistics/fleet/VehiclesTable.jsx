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
import VehicleFormDialog from './VehicleFormDialog'

const VehiclesTable = () => {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editVehicle, setEditVehicle] = useState(null)

  const fetchVehicles = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/logistics/vehicles')
      const data = await response.json()

      if (data.success) {
        setVehicles(data.vehicles)
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVehicles()
  }, [])

  const getStatusColor = status => {
    switch (status) {
      case 'AVAILABLE':
        return 'success'
      case 'IN_USE':
        return 'info'
      case 'MAINTENANCE':
        return 'warning'
      case 'OUT_OF_SERVICE':
        return 'error'
      default:
        return 'default'
    }
  }

  const getTypeIcon = type => {
    switch (type) {
      case 'TRUCK':
        return 'tabler-truck'
      case 'VAN':
        return 'tabler-car'
      case 'PICKUP':
        return 'tabler-truck-delivery'
      case 'MOTORCYCLE':
        return 'tabler-motorcycle'
      default:
        return 'tabler-truck'
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

  const handleAddVehicle = () => {
    setEditVehicle(null)
    setFormOpen(true)
  }

  const handleEditVehicle = (vehicle) => {
    setEditVehicle(vehicle)
    setFormOpen(true)
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setEditVehicle(null)
  }

  const handleFormSuccess = () => {
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
        title='All Vehicles'
        subheader={`${vehicles.length} total vehicles`}
        action={
          <Box display='flex' gap={2}>
            <Button variant='outlined' onClick={fetchVehicles}>
              <i className='tabler-refresh' style={{ marginRight: 8 }} />
              Refresh
            </Button>
            <Button variant='contained' onClick={handleAddVehicle}>
              <i className='tabler-plus' style={{ marginRight: 8 }} />
              Add Vehicle
            </Button>
          </Box>
        }
      />
      <CardContent>
        {vehicles.length === 0 ? (
          <Box textAlign='center' py={4}>
            <Typography variant='body2' color='text.secondary'>
              No vehicles found. Add your first vehicle to get started.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Registration</TableCell>
                  <TableCell>Vehicle Details</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Capacity</TableCell>
                  <TableCell>Mileage</TableCell>
                  <TableCell>Next Service</TableCell>
                  <TableCell>Today's Deliveries</TableCell>
                  <TableCell align='right'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vehicles.map(vehicle => (
                  <TableRow key={vehicle.id}>
                    <TableCell>
                      <Typography variant='subtitle2'>{vehicle.registrationNo}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>
                        {vehicle.make} {vehicle.model}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {vehicle.year || 'Unknown year'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display='flex' alignItems='center' gap={1}>
                        <i className={getTypeIcon(vehicle.type)} />
                        <Typography variant='body2'>{vehicle.type}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={formatStatus(vehicle.status)} size='small' color={getStatusColor(vehicle.status)} />
                    </TableCell>
                    <TableCell>
                      {vehicle.capacity ? (
                        <Typography variant='body2'>{vehicle.capacity} kg</Typography>
                      ) : (
                        <Typography variant='caption' color='text.secondary'>
                          N/A
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {vehicle.mileage ? (
                        <Typography variant='body2'>{vehicle.mileage.toLocaleString()} km</Typography>
                      ) : (
                        <Typography variant='caption' color='text.secondary'>
                          N/A
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {vehicle.nextService ? (
                        <Typography
                          variant='caption'
                          color={new Date(vehicle.nextService) < new Date() ? 'error' : 'text.secondary'}
                        >
                          {formatDate(vehicle.nextService)}
                        </Typography>
                      ) : (
                        <Typography variant='caption' color='text.secondary'>
                          Not scheduled
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={vehicle.deliveries.length} size='small' color='primary' />
                    </TableCell>
                    <TableCell align='right'>
                      <Tooltip title='View Details'>
                        <IconButton size='small'>
                          <i className='tabler-eye' />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title='Edit'>
                        <IconButton size='small' onClick={() => handleEditVehicle(vehicle)}>
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

      {/* Vehicle Form Dialog */}
      <VehicleFormDialog
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        editData={editVehicle}
      />
    </Card>
  )
}

export default VehiclesTable
