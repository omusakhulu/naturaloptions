'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Grid from '@mui/material/Grid'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Autocomplete from '@mui/material/Autocomplete'
import InputAdornment from '@mui/material/InputAdornment'

const AssignOrderDialog = ({ open, onClose, onSuccess, orderData = null }) => {
  const [formData, setFormData] = useState({
    orderId: orderData?.id || '',
    driverId: '',
    vehicleId: '',
    scheduledDate: '',
    scheduledTime: '',
    priority: 'NORMAL',
    route: '',
    notes: ''
  })

  const [drivers, setDrivers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [orderInputValue, setOrderInputValue] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)

  const priorities = [
    { value: 'LOW', label: 'Low', color: 'default' },
    { value: 'NORMAL', label: 'Normal', color: 'info' },
    { value: 'HIGH', label: 'High', color: 'warning' },
    { value: 'URGENT', label: 'Urgent', color: 'error' }
  ]

  useEffect(() => {
    if (open) {
      setError('')
      fetchData()
    }
  }, [open])

  useEffect(() => {
    if (orderData) {
      setFormData(prev => ({ ...prev, orderId: orderData.id }))
      setSelectedOrder(orderData)
    }
  }, [orderData])

  const fetchOrders = async (query = '') => {
    try {
      setSearchLoading(true)
      const url = query && query.trim().length > 0
        ? `/api/orders?q=${encodeURIComponent(query)}&take=20`
        : `/api/orders?take=20`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setOrders(Array.isArray(data.orders) ? data.orders : [])
      } else {
        setOrders([])
      }
    } catch (e) {
      setOrders([])
    } finally {
      setSearchLoading(false)
    }
  }

  const fetchData = async () => {
    try {
      setLoadingData(true)
      setError('')
      
      // Fetch drivers and vehicles
      const [driversRes, vehiclesRes] = await Promise.all([
        fetch('/api/logistics/drivers'),
        fetch('/api/logistics/vehicles')
      ])

      if (!driversRes.ok || !vehiclesRes.ok) {
        throw new Error('Failed to fetch drivers or vehicles')
      }

      const [driversData, vehiclesData] = await Promise.all([
        driversRes.json(),
        vehiclesRes.json()
      ])

      if (driversData.success) {
        setDrivers(driversData.drivers || [])
      } else {
        throw new Error('No drivers data available')
      }
      
      if (vehiclesData.success) {
        setVehicles(vehiclesData.vehicles || [])
      } else {
        throw new Error('No vehicles data available')
      }
      await fetchOrders('')
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err.message || 'Failed to load data. Please try again.')
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    if (!open) return
    const q = orderInputValue.trim()
    const timer = setTimeout(() => {
      if (q.length === 0) fetchOrders('')
      else if (q.length >= 2) fetchOrders(q)
    }, 300)
    return () => clearTimeout(timer)
  }, [orderInputValue, open])

  const handleChange = (field) => (event) => {
    const value = event.target.value

    setFormData({
      ...formData,
      [field]: value
    })

    // Auto-select vehicle when driver is selected
    if (field === 'driverId' && value) {
      const selectedDriver = drivers.find(d => d.id === value)
      if (selectedDriver?.vehicleId) {
        setFormData(prev => ({
          ...prev,
          driverId: value,
          vehicleId: selectedDriver.vehicleId
        }))
      }
    }

    setError('')
  }

  const handleOrderChange = (event, value) => {
    setSelectedOrder(value)
    setFormData(prev => ({
      ...prev,
      orderId: value?.id || ''
    }))
    setError('')
  }

  const handleSubmit = async () => {
    // Validation
    if (!formData.orderId) {
      setError('Please select an order')
      return
    }
    if (!formData.driverId) {
      setError('Please select a driver')
      return
    }
    if (!formData.vehicleId) {
      setError('Please select a vehicle')
      return
    }
    if (!formData.scheduledDate) {
      setError('Please select a delivery date')
      return
    }

    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/logistics/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        onSuccess && onSuccess()
        handleClose()
      } else {
        setError(data.error || 'Failed to create assignment')
      }
    } catch (err) {
      console.error('Error creating assignment:', err)
      setError('An error occurred while creating the assignment')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setFormData({
        orderId: '',
        driverId: '',
        vehicleId: '',
        scheduledDate: '',
        scheduledTime: '',
        priority: 'NORMAL',
        route: '',
        notes: ''
      })
      setSelectedOrder(null)
      setError('')
      onClose()
    }
  }

  const getSelectedOrder = () => {
    return orders.find(o => o.id === formData.orderId)
  }

  const getSelectedDriver = () => {
    return drivers.find(d => d.id === formData.driverId)
  }

  const getSelectedVehicle = () => {
    return vehicles.find(v => v.id === formData.vehicleId)
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
      <DialogTitle>
        <i className='tabler-truck-delivery' style={{ marginRight: 8 }} />
        Assign Order to Driver
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert 
            severity='error' 
            sx={{ mb: 3 }}
            action={
              <Button color='inherit' size='small' onClick={fetchData}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {loadingData ? (
          <Box display='flex' flexDirection='column' alignItems='center' justifyContent='center' py={4}>
            <CircularProgress />
            <Typography variant='body2' color='text.secondary' sx={{ mt: 2 }}>
              Loading drivers and vehicles...
            </Typography>
          </Box>
        ) : error ? (
          <Box display='flex' flexDirection='column' alignItems='center' justifyContent='center' py={4}>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
              Unable to load assignment data
            </Typography>
            <Button variant='contained' onClick={fetchData} startIcon={<i className='tabler-refresh' />}>
              Try Again
            </Button>
          </Box>
        ) : (
          <>
            {(drivers.length === 0 || vehicles.length === 0) && (
              <Alert severity='warning' sx={{ mb: 3 }}>
                {drivers.length === 0 && vehicles.length === 0
                  ? 'No drivers or vehicles available. Please add drivers and vehicles to the fleet first.'
                  : drivers.length === 0
                  ? 'No drivers available. Please add drivers to the fleet first.'
                  : 'No vehicles available. Please add vehicles to the fleet first.'}
              </Alert>
            )}
          <Grid container spacing={4} sx={{ mt: 1 }}>
            {/* Order Selection */}
            <Grid item xs={12}>
              <Typography variant='subtitle2' color='primary' gutterBottom>
                Order Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                fullWidth
                disabled={!!orderData}
                options={orders}
                value={selectedOrder}
                onChange={handleOrderChange}
                inputValue={orderInputValue}
                onInputChange={(event, newInput) => setOrderInputValue(newInput)}
                loading={searchLoading}
                filterOptions={(x) => x}
                getOptionLabel={(option) => {
                  if (!option) return ''
                  const customer = JSON.parse(option.customer || '{}')
                  const customerName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown Customer'
                  return `#${option.orderNumber} - ${customerName}`
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search Order by Number or Customer"
                    placeholder="Type order number or customer name..."
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <i className="tabler-search" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <>
                          {searchLoading ? <CircularProgress size={18} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      )
                    }}
                  />
                )}
                renderOption={(props, option) => {
                  const customer = JSON.parse(option.customer || '{}')
                  const customerName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown Customer'
                  const items = JSON.parse(option.lineItems || '[]')
                  
                  return (
                    <Box component="li" {...props} key={option.id}>
                      <Box display='flex' justifyContent='space-between' alignItems='center' width='100%'>
                        <Box>
                          <Typography variant='body2' fontWeight='medium'>
                            #{option.orderNumber}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {customerName}
                          </Typography>
                        </Box>
                        <Box display='flex' gap={1} alignItems='center'>
                          <Chip label={option.status} size='small' />
                          <Typography variant='caption' color='text.secondary'>
                            KES {option.total}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {items.length} items
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  )
                }}
                noOptionsText="No matching orders found"
                loadingText="Searching..."
                isOptionEqualToValue={(option, value) => option.id === value?.id}
              />

              {selectedOrder && (
                <Box mt={2.5} p={2} bgcolor='grey.50' borderRadius={1}>
                  <Typography variant='caption' color='text.secondary'>
                    <strong>Order:</strong> #{selectedOrder.orderNumber}
                  </Typography>
                  <Typography variant='caption' display='block' color='text.secondary'>
                    <strong>Customer:</strong> {(() => {
                      const customer = JSON.parse(selectedOrder.customer || '{}')
                      return `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown Customer'
                    })()}
                  </Typography>
                  <Typography variant='caption' display='block' color='text.secondary'>
                    <strong>Email:</strong> {(() => {
                      const customer = JSON.parse(selectedOrder.customer || '{}')
                      return customer.email || 'No email'
                    })()}
                  </Typography>
                  <Typography variant='caption' display='block' color='text.secondary'>
                    <strong>Items:</strong> {JSON.parse(selectedOrder.lineItems || '[]').length} item(s)
                  </Typography>
                  <Typography variant='caption' display='block' color='text.secondary'>
                    <strong>Total:</strong> KES {selectedOrder.total}
                  </Typography>
                </Box>
              )}
            </Grid>

            {/* Driver & Vehicle Assignment */}
            <Grid item xs={12}>
              <Typography variant='subtitle2' color='primary' gutterBottom sx={{ mt: 2 }}>
                Driver & Vehicle Assignment
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Select Driver</InputLabel>
                <Select
                  value={formData.driverId}
                  onChange={handleChange('driverId')}
                  label='Select Driver'
                >
                  {drivers.length === 0 ? (
                    <MenuItem value=''>
                      <em>No available drivers</em>
                    </MenuItem>
                  ) : (
                    drivers.map(driver => (
                      <MenuItem key={driver.id} value={driver.id}>
                        <Box display='flex' alignItems='center' gap={1}>
                          <i className='tabler-user' />
                          {driver.name}
                          {driver.status !== 'AVAILABLE' && (
                            <Chip label={driver.status} size='small' color='warning' />
                          )}
                        </Box>
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>

              {getSelectedDriver() && (
                <Box mt={1.5}>
                  <Typography variant='caption' color='text.secondary'>
                    📞 {getSelectedDriver().phone}
                  </Typography>
                  <Typography variant='caption' display='block' color='text.secondary'>
                    🚗 Currently:{' '}
                    {getSelectedDriver().vehicle
                      ? `${getSelectedDriver().vehicle.registrationNo}`
                      : 'No vehicle assigned'}
                  </Typography>
                </Box>
              )}
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Select Vehicle</InputLabel>
                <Select value={formData.vehicleId} onChange={handleChange('vehicleId')} label='Select Vehicle'>
                  {vehicles.length === 0 ? (
                    <MenuItem value=''>
                      <em>No available vehicles</em>
                    </MenuItem>
                  ) : (
                    vehicles.map(vehicle => (
                      <MenuItem key={vehicle.id} value={vehicle.id}>
                        <Box display='flex' alignItems='center' gap={1}>
                          <i className='tabler-truck' />
                          {vehicle.registrationNo} - {vehicle.make} {vehicle.model}
                          {vehicle.status !== 'AVAILABLE' && (
                            <Chip label={vehicle.status} size='small' color='warning' />
                          )}
                        </Box>
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>

              {getSelectedVehicle() && (
                <Box mt={1.5}>
                  <Typography variant='caption' color='text.secondary'>
                    📦 Capacity: {getSelectedVehicle().capacity || 'N/A'} kg
                  </Typography>
                  <Typography variant='caption' display='block' color='text.secondary'>
                    🔧 Type: {getSelectedVehicle().type}
                  </Typography>
                </Box>
              )}
            </Grid>

            {/* Schedule */}
            <Grid item xs={12}>
              <Typography variant='subtitle2' color='primary' gutterBottom sx={{ mt: 2 }}>
                Delivery Schedule
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                type='date'
                label='Delivery Date'
                value={formData.scheduledDate}
                onChange={handleChange('scheduledDate')}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: new Date().toISOString().split('T')[0] }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Time Slot (Optional)'
                placeholder='e.g., 09:00-12:00'
                value={formData.scheduledTime}
                onChange={handleChange('scheduledTime')}
                helperText='Leave blank for all-day'
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select value={formData.priority} onChange={handleChange('priority')} label='Priority'>
                  {priorities.map(priority => (
                    <MenuItem key={priority.value} value={priority.value}>
                      <Chip label={priority.label} size='small' color={priority.color} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Route/Location'
                placeholder='e.g., Westlands, Nairobi'
                value={formData.route}
                onChange={handleChange('route')}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label='Delivery Notes'
                placeholder='e.g., Fragile items, setup required, access code, etc.'
                value={formData.notes}
                onChange={handleChange('notes')}
              />
            </Grid>
          </Grid>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={loading} variant='outlined'>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading || loadingData}
          variant='contained'
          startIcon={loading ? <CircularProgress size={20} /> : <i className='tabler-check' />}
        >
          {loading ? 'Assigning...' : 'Assign Delivery'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AssignOrderDialog
