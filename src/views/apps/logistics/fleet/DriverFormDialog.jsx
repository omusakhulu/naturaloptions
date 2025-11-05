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
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'

const DriverFormDialog = ({ open, onClose, onSuccess, editData = null, availableVehicles = [] }) => {
  const isEdit = Boolean(editData)

  const [formData, setFormData] = useState({
    name: editData?.name || '',
    email: editData?.email || '',
    phone: editData?.phone || '',
    licenseNumber: editData?.licenseNumber || '',
    licenseExpiry: editData?.licenseExpiry ? editData.licenseExpiry.split('T')[0] : '',
    vehicleId: editData?.vehicleId || '',
    status: editData?.status || 'AVAILABLE'
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const driverStatuses = [
    { value: 'AVAILABLE', label: 'Available', color: 'success' },
    { value: 'ON_DELIVERY', label: 'On Delivery', color: 'info' },
    { value: 'OFF_DUTY', label: 'Off Duty', color: 'default' },
    { value: 'ON_LEAVE', label: 'On Leave', color: 'warning' }
  ]

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    })
    setError('')
  }

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      setError('Driver name is required')
      return
    }

    try {
      setLoading(true)
      setError('')

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        licenseNumber: formData.licenseNumber.trim() || null,
        licenseExpiry: formData.licenseExpiry || null,
        vehicleId: formData.vehicleId || null,
        status: formData.status
      }

      const url = isEdit ? `/api/logistics/drivers/${editData.id}` : '/api/logistics/drivers'
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
        setError(data.error || 'Failed to save driver')
      }
    } catch (err) {
      console.error('Error saving driver:', err)
      setError('An error occurred while saving the driver')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
        email: '',
        phone: '',
        licenseNumber: '',
        licenseExpiry: '',
        vehicleId: '',
        status: 'AVAILABLE'
      })
      setError('')
      onClose()
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
      <DialogTitle>
        <i className='tabler-user' style={{ marginRight: 8 }} />
        {isEdit ? 'Edit Driver' : 'Add New Driver'}
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity='error' sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3} sx={{ mt: 0.5 }}>
          {/* Personal Information */}
          <Grid item xs={12}>
            <Typography variant='subtitle2' color='primary' gutterBottom>
              Personal Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label='Full Name'
              placeholder='e.g., John Doe'
              value={formData.name}
              onChange={handleChange('name')}
              disabled={loading}
              helperText='Driver full name'
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type='email'
              label='Email Address'
              placeholder='e.g., john@example.com'
              value={formData.email}
              onChange={handleChange('email')}
              disabled={loading}
              helperText='Optional'
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type='tel'
              label='Phone Number'
              placeholder='e.g., +254712345678'
              value={formData.phone}
              onChange={handleChange('phone')}
              disabled={loading}
              helperText='Contact number'
            />
          </Grid>

          {/* License Information */}
          <Grid item xs={12}>
            <Typography variant='subtitle2' color='primary' gutterBottom sx={{ mt: 2 }}>
              License Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label='License Number'
              placeholder='e.g., DL12345'
              value={formData.licenseNumber}
              onChange={handleChange('licenseNumber')}
              disabled={loading}
              helperText='Driving license number'
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type='date'
              label='License Expiry Date'
              value={formData.licenseExpiry}
              onChange={handleChange('licenseExpiry')}
              disabled={loading}
              InputLabelProps={{ shrink: true }}
              helperText='When does the license expire'
            />
          </Grid>

          {/* Assignment */}
          <Grid item xs={12}>
            <Typography variant='subtitle2' color='primary' gutterBottom sx={{ mt: 2 }}>
              Vehicle Assignment
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Assigned Vehicle</InputLabel>
              <Select
                value={formData.vehicleId}
                onChange={handleChange('vehicleId')}
                disabled={loading}
                label='Assigned Vehicle'
              >
                <MenuItem value=''>
                  <em>No vehicle assigned</em>
                </MenuItem>
                {availableVehicles.map(vehicle => (
                  <MenuItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.registrationNo} - {vehicle.make} {vehicle.model}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={handleChange('status')}
                disabled={loading}
                label='Status'
              >
                {driverStatuses.map(status => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
          {loading ? 'Saving...' : isEdit ? 'Update Driver' : 'Add Driver'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DriverFormDialog
