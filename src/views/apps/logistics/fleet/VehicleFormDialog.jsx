'use client'

// React Imports
import { useState } from 'react'

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
import InputAdornment from '@mui/material/InputAdornment'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'

const VehicleFormDialog = ({ open, onClose, onSuccess, editData = null }) => {
  const isEdit = Boolean(editData)

  const [formData, setFormData] = useState({
    registrationNo: editData?.registrationNo || '',
    make: editData?.make || '',
    model: editData?.model || '',
    year: editData?.year || '',
    type: editData?.type || 'TRUCK',
    capacity: editData?.capacity || '',
    status: editData?.status || 'AVAILABLE',
    mileage: editData?.mileage || '',
    fuelType: editData?.fuelType || '',
    engineCapacity: editData?.engineCapacity || '',
    fuelConsumption: editData?.fuelConsumption || '',
    lastService: editData?.lastService ? editData.lastService.split('T')[0] : '',
    nextService: editData?.nextService ? editData.nextService.split('T')[0] : ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [consumptionUnit, setConsumptionUnit] = useState('km_per_l')

  const vehicleTypes = [
    { value: 'TRUCK', label: 'Truck', icon: 'tabler-truck' },
    { value: 'VAN', label: 'Van', icon: 'tabler-car' },
    { value: 'PICKUP', label: 'Pickup', icon: 'tabler-truck-delivery' },
    { value: 'MOTORCYCLE', label: 'Motorcycle', icon: 'tabler-motorcycle' },
    { value: 'OTHER', label: 'Other', icon: 'tabler-circle' }
  ]

  const vehicleStatuses = [
    { value: 'AVAILABLE', label: 'Available', color: 'success' },
    { value: 'IN_USE', label: 'In Use', color: 'info' },
    { value: 'MAINTENANCE', label: 'Maintenance', color: 'warning' },
    { value: 'OUT_OF_SERVICE', label: 'Out of Service', color: 'error' }
  ]

  const fuelTypes = ['Diesel', 'Petrol', 'Electric', 'Hybrid', 'LPG', 'CNG']

  const handleChange = field => event => {
    setFormData({
      ...formData,
      [field]: event.target.value
    })
    setError('')
  }

  const handleSubmit = async () => {
    // Validation
    if (!formData.registrationNo.trim()) {
      setError('Registration number is required')

      return
    }

    if (!formData.make.trim()) {
      setError('Vehicle make is required')

      return
    }

    if (!formData.model.trim()) {
      setError('Vehicle model is required')

      return
    }

    try {
      setLoading(true)
      setError('')

      const payload = {
        registrationNo: formData.registrationNo.trim().toUpperCase(),
        make: formData.make.trim(),
        model: formData.model.trim(),
        year: formData.year ? parseInt(formData.year) : null,
        type: formData.type,
        capacity: formData.capacity ? parseFloat(formData.capacity) : null,
        status: formData.status,
        mileage: formData.mileage ? parseFloat(formData.mileage) : null,
        fuelType: formData.fuelType || null,
        engineCapacity: formData.engineCapacity ? parseFloat(formData.engineCapacity) : null,
        fuelConsumption: formData.fuelConsumption
          ? consumptionUnit === 'km_per_l'
            ? parseFloat(formData.fuelConsumption)
            : parseFloat(formData.fuelConsumption) > 0
              ? 1 / parseFloat(formData.fuelConsumption)
              : null
          : null,
        lastService: formData.lastService || null,
        nextService: formData.nextService || null
      }

      const url = isEdit ? `/api/logistics/vehicles/${editData.id}` : '/api/logistics/vehicles'
      const method = isEdit ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (data.success) {
        onSuccess()
        handleClose()
      } else {
        setError(data.error || 'Failed to save vehicle')
      }
    } catch (err) {
      console.error('Error saving vehicle:', err)
      setError('An error occurred while saving the vehicle')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setFormData({
        registrationNo: '',
        make: '',
        model: '',
        year: '',
        type: 'TRUCK',
        capacity: '',
        status: 'AVAILABLE',
        mileage: '',
        fuelType: '',
        engineCapacity: '',
        fuelConsumption: '',
        lastService: '',
        nextService: ''
      })
      setConsumptionUnit('km_per_l')
      setError('')
      onClose()
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
      <DialogTitle>
        <i className='tabler-truck' style={{ marginRight: 8 }} />
        {isEdit ? 'Edit Vehicle' : 'Add New Vehicle'}
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity='error' sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3} sx={{ mt: 0.5 }}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant='subtitle2' color='primary' gutterBottom>
              Basic Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label='Registration Number'
              placeholder='e.g., KAA 123A'
              value={formData.registrationNo}
              onChange={handleChange('registrationNo')}
              disabled={loading}
              helperText='Vehicle registration/license plate number'
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Vehicle Type</InputLabel>
              <Select value={formData.type} onChange={handleChange('type')} disabled={loading} label='Vehicle Type'>
                {vehicleTypes.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    <i className={type.icon} style={{ marginRight: 8 }} />
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              required
              label='Make'
              placeholder='e.g., Toyota'
              value={formData.make}
              onChange={handleChange('make')}
              disabled={loading}
              helperText='Manufacturer'
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              required
              label='Model'
              placeholder='e.g., Hilux'
              value={formData.model}
              onChange={handleChange('model')}
              disabled={loading}
              helperText='Model name'
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type='number'
              label='Year'
              placeholder='e.g., 2023'
              value={formData.year}
              onChange={handleChange('year')}
              disabled={loading}
              inputProps={{ min: 1900, max: new Date().getFullYear() + 1 }}
              helperText='Manufacturing year'
            />
          </Grid>

          {/* Specifications */}
          <Grid item xs={12}>
            <Typography variant='subtitle2' color='primary' gutterBottom sx={{ mt: 2 }}>
              Specifications
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type='number'
              label='Capacity'
              placeholder='e.g., 1000'
              value={formData.capacity}
              onChange={handleChange('capacity')}
              disabled={loading}
              InputProps={{
                endAdornment: <InputAdornment position='end'>kg</InputAdornment>
              }}
              inputProps={{ min: 0, step: 0.01 }}
              helperText='Load capacity in kilograms'
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Fuel Type</InputLabel>
              <Select
                value={formData.fuelType}
                onChange={handleChange('fuelType')}
                disabled={loading}
                label='Fuel Type'
              >
                <MenuItem value=''>
                  <em>Select fuel type</em>
                </MenuItem>
                {fuelTypes.map(fuel => (
                  <MenuItem key={fuel} value={fuel}>
                    {fuel}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type='number'
              label='Engine Capacity'
              placeholder='e.g., 2.5'
              value={formData.engineCapacity}
              onChange={handleChange('engineCapacity')}
              disabled={loading}
              InputProps={{
                endAdornment: <InputAdornment position='end'>L</InputAdornment>
              }}
              inputProps={{ min: 0, step: 0.1 }}
              helperText='Engine size in liters (for fuel cost estimation)'
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type='number'
              label='Fuel Consumption'
              placeholder='e.g., 8.5'
              value={formData.fuelConsumption}
              onChange={handleChange('fuelConsumption')}
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position='end'>{consumptionUnit === 'km_per_l' ? 'km/l' : 'L/km'}</InputAdornment>
                )
              }}
              inputProps={{ min: 0, step: 0.1 }}
              helperText={
                formData.fuelConsumption && parseFloat(formData.fuelConsumption) > 0
                  ? consumptionUnit === 'km_per_l'
                    ? `Average fuel consumption. Equivalent: ${(1 / parseFloat(formData.fuelConsumption)).toFixed(3)} L/km`
                    : `Average fuel consumption. Equivalent: ${(1 / parseFloat(formData.fuelConsumption)).toFixed(1)} km/l`
                  : 'Average fuel consumption (for trip cost calculation)'
              }
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Consumption Unit</InputLabel>
              <Select
                value={consumptionUnit}
                onChange={e => setConsumptionUnit(e.target.value)}
                disabled={loading}
                label='Consumption Unit'
              >
                <MenuItem value='km_per_l'>km/l</MenuItem>
                <MenuItem value='l_per_km'>L/km</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type='number'
              label='Current Mileage'
              placeholder='e.g., 50000'
              value={formData.mileage}
              onChange={handleChange('mileage')}
              disabled={loading}
              InputProps={{
                endAdornment: <InputAdornment position='end'>km</InputAdornment>
              }}
              inputProps={{ min: 0 }}
              helperText='Current odometer reading'
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={formData.status} onChange={handleChange('status')} disabled={loading} label='Status'>
                {vehicleStatuses.map(status => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Maintenance */}
          <Grid item xs={12}>
            <Typography variant='subtitle2' color='primary' gutterBottom sx={{ mt: 2 }}>
              Maintenance Schedule
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type='date'
              label='Last Service Date'
              value={formData.lastService}
              onChange={handleChange('lastService')}
              disabled={loading}
              InputLabelProps={{ shrink: true }}
              helperText='When was the last service performed'
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type='date'
              label='Next Service Date'
              value={formData.nextService}
              onChange={handleChange('nextService')}
              disabled={loading}
              InputLabelProps={{ shrink: true }}
              helperText='When is the next service due'
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={loading} variant='outlined'>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          variant='contained'
          startIcon={loading ? <CircularProgress size={20} /> : <i className='tabler-check' />}
        >
          {loading ? 'Saving...' : isEdit ? 'Update Vehicle' : 'Add Vehicle'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default VehicleFormDialog
