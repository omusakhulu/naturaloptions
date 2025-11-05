'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import {
  Card,
  CardHeader,
  CardContent,
  Grid,
  TextField,
  Button,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import CancelIcon from '@mui/icons-material/Cancel'
import WarehouseIcon from '@mui/icons-material/Warehouse'

// Custom Select Icon
const SelectIcon = () => <i className='tabler-chevron-down' />

export default function AddWarehousePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    phone: '',
    email: '',
    managerName: '',
    capacity: '',
    status: 'active'
  })

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/warehouses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          capacity: formData.capacity ? parseFloat(formData.capacity) : null
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create warehouse')
      }

      router.push('/en/apps/warehouses/list')
    } catch (err: any) {
      console.error('Error creating warehouse:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={6}>
        <Grid>
          <Card>
            <CardHeader
              title={
                <Box display='flex' alignItems='center' gap={2}>
                  <WarehouseIcon sx={{ fontSize: 32 }} />
                  <Typography variant='h5'>Add New Warehouse</Typography>
                </Box>
              }
            />
          </Card>
        </Grid>

        {error && (
          <Grid>
            <Alert severity='error' onClose={() => setError(null)}>
              {error}
            </Alert>
          </Grid>
        )}

        <Grid>
          <Card>
            <CardHeader title='Basic Information' />
            <CardContent>
              <Grid container spacing={4}>
                <Grid>
                  <TextField
                    fullWidth
                    required
                    label='Warehouse Name'
                    value={formData.name}
                    onChange={e => handleChange('name', e.target.value)}
                    placeholder='e.g., Main Warehouse'
                  />
                </Grid>
                <Grid>
                  <TextField
                    fullWidth
                    required
                    label='Warehouse Code'
                    value={formData.code}
                    onChange={e => handleChange('code', e.target.value)}
                    placeholder='e.g., WH-001'
                  />
                </Grid>
                <Grid>
                  <TextField
                    fullWidth
                    label='Address'
                    value={formData.address}
                    onChange={e => handleChange('address', e.target.value)}
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid>
                  <TextField
                    fullWidth
                    label='City'
                    value={formData.city}
                    onChange={e => handleChange('city', e.target.value)}
                  />
                </Grid>
                <Grid>
                  <TextField
                    fullWidth
                    label='State/Province'
                    value={formData.state}
                    onChange={e => handleChange('state', e.target.value)}
                  />
                </Grid>
                <Grid>
                  <TextField
                    fullWidth
                    label='Country'
                    value={formData.country}
                    onChange={e => handleChange('country', e.target.value)}
                  />
                </Grid>
                <Grid>
                  <TextField
                    fullWidth
                    label='Postal Code'
                    value={formData.postalCode}
                    onChange={e => handleChange('postalCode', e.target.value)}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid>
          <Card>
            <CardHeader title='Contact & Details' />
            <CardContent>
              <Grid container spacing={4}>
                <Grid>
                  <TextField
                    fullWidth
                    label='Manager Name'
                    value={formData.managerName}
                    onChange={e => handleChange('managerName', e.target.value)}
                  />
                </Grid>
                <Grid>
                  <TextField
                    fullWidth
                    label='Phone'
                    type='tel'
                    value={formData.phone}
                    onChange={e => handleChange('phone', e.target.value)}
                  />
                </Grid>
                <Grid>
                  <TextField
                    fullWidth
                    label='Email'
                    type='email'
                    value={formData.email}
                    onChange={e => handleChange('email', e.target.value)}
                  />
                </Grid>
                <Grid>
                  <TextField
                    fullWidth
                    label='Capacity (m³)'
                    type='number'
                    value={formData.capacity}
                    onChange={e => handleChange('capacity', e.target.value)}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>
                <Grid>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={formData.status}
                      label='Status'
                      onChange={e => handleChange('status', e.target.value)}
                      IconComponent={SelectIcon}
                    >
                      <MenuItem value='active'>Active</MenuItem>
                      <MenuItem value='inactive'>Inactive</MenuItem>
                      <MenuItem value='maintenance'>Maintenance</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid>
          <Box display='flex' gap={2} justifyContent='flex-end'>
            <Button
              variant='outlined'
              startIcon={<CancelIcon />}
              onClick={() => router.push('/en/apps/warehouses/list')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              variant='contained'
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Warehouse'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </form>
  )
}
