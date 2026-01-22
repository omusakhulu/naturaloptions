'use client'

import { useState } from 'react'

import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import CabinIcon from '@mui/icons-material/Cabin'
import SaveIcon from '@mui/icons-material/Save'

interface TentSize {
  id: string
  length: number
  width: number
  price?: number
  stockQuantity: number
}

interface RentalMetadata {
  rental_duration_unit: string
  minimum_rental_duration: number
  setup_time_required: string
  teardown_time_required: string
  capacity_standing?: string
  capacity_seated?: string
}

export default function EventTentProductForm() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdProduct, setCreatedProduct] = useState<any>(null)

  // Product basic info
  const [name, setName] = useState('Event Tent')

  const [description, setDescription] = useState(
    'A versatile tent suitable for various events, available in multiple customizable sizes. Perfect for weddings, corporate events, festivals, and more.'
  )

  const [shortDescription, setShortDescription] = useState('Customizable event tent rental')
  const [sku, setSku] = useState(`EVENT-TENT-${Date.now()}`)

  // Pricing
  const [basePrice, setBasePrice] = useState('500')
  const [pricePerSquareMeter, setPricePerSquareMeter] = useState('25')

  // Rental metadata
  const [rentalMetadata, setRentalMetadata] = useState<RentalMetadata>({
    rental_duration_unit: 'day',
    minimum_rental_duration: 1,
    setup_time_required: '2 hours',
    teardown_time_required: '2 hours',
    capacity_standing: 'Variable by size',
    capacity_seated: 'Variable by size'
  })

  // Size variations
  const [sizes, setSizes] = useState<TentSize[]>([
    { id: '1', length: 10, width: 10, stockQuantity: 5 },
    { id: '2', length: 15, width: 10, stockQuantity: 3 },
    { id: '3', length: 20, width: 15, stockQuantity: 2 }
  ])

  // New size form
  const [newLength, setNewLength] = useState('')
  const [newWidth, setNewWidth] = useState('')
  const [newStock, setNewStock] = useState('10')

  const addSize = () => {
    if (!newLength || !newWidth) {
      setError('Please enter both length and width')

      return
    }

    const length = parseFloat(newLength)
    const width = parseFloat(newWidth)

    if (length <= 0 || width <= 0) {
      setError('Length and width must be positive numbers')

      return
    }

    const newSize: TentSize = {
      id: Date.now().toString(),
      length,
      width,
      stockQuantity: parseInt(newStock) || 10
    }

    setSizes([...sizes, newSize])
    setNewLength('')
    setNewWidth('')
    setNewStock('10')
    setError(null)
  }

  const removeSize = (id: string) => {
    setSizes(sizes.filter(size => size.id !== id))
  }

  const calculatePrice = (length: number, width: number) => {
    const area = length * width
    const base = parseFloat(basePrice) || 0
    const perSqm = parseFloat(pricePerSquareMeter) || 0

    return base + area * perSqm
  }

  const calculateCapacity = (length: number, width: number) => {
    const area = length * width
    const standing = Math.floor(area * 1.5)
    const seated = Math.floor(area * 0.8)

    return { standing, seated }
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(false)

      if (sizes.length === 0) {
        setError('Please add at least one size variation')
        setLoading(false)

        return
      }

      const payload = {
        name,
        description,
        shortDescription,
        basePrice: parseFloat(basePrice),
        pricePerSquareMeter: parseFloat(pricePerSquareMeter),
        sizes: sizes.map(size => ({
          length: size.length,
          width: size.width,
          stockQuantity: size.stockQuantity
        })),
        rentalMetadata,
        sku,
        categories: [{ id: 15 }], // You can adjust category ID
        images: []
      }

      console.log('Creating Event Tent product with payload:', payload)

      const response = await fetch('/api/products/event-tent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create product')
      }

      setSuccess(true)
      setCreatedProduct(data.product)
      console.log('✅ Event Tent product created:', data)

      // Reset form after 3 seconds
      setTimeout(() => {
        setSuccess(false)

        // Optionally reset form fields
      }, 3000)
    } catch (err: any) {
      console.error('Error creating Event Tent product:', err)
      setError(err.message || 'Failed to create product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Grid container spacing={6}>
      {/* Header */}
      <Grid size={12}>
        <Card>
          <CardHeader
            title={
              <Box display='flex' alignItems='center' gap={2}>
                <CabinIcon sx={{ fontSize: 32 }} />
                <Typography variant='h4'>Create Event Tent Rental Product</Typography>
              </Box>
            }
            subheader='Configure a customizable event tent with dynamic size variations and rental-specific metadata'
          />
        </Card>
      </Grid>

      {/* Alerts */}
      {success && (
        <Grid size={12}>
          <Alert severity='success' onClose={() => setSuccess(false)}>
            Event Tent product created successfully! Product ID: {createdProduct?.id}
          </Alert>
        </Grid>
      )}

      {error && (
        <Grid size={12}>
          <Alert severity='error' onClose={() => setError(null)}>
            {error}
          </Alert>
        </Grid>
      )}

      {/* Basic Information */}
      <Grid size={{ xs: 12, md: 8 }}>
        <Card>
          <CardHeader title='Basic Information' />
          <CardContent>
            <Grid container spacing={4}>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label='Product Name'
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </Grid>
              <Grid size={12}>
                <TextField fullWidth label='SKU' value={sku} onChange={e => setSku(e.target.value)} required />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label='Short Description'
                  value={shortDescription}
                  onChange={e => setShortDescription(e.target.value)}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label='Description'
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  multiline
                  rows={4}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Pricing */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card>
          <CardHeader title='Pricing Structure' />
          <CardContent>
            <Grid container spacing={4}>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label='Base Price (KES)'
                  type='number'
                  value={basePrice}
                  onChange={e => setBasePrice(e.target.value)}
                  required
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label='Price per Square Meter (KES)'
                  type='number'
                  value={pricePerSquareMeter}
                  onChange={e => setPricePerSquareMeter(e.target.value)}
                  required
                />
              </Grid>
              <Grid size={12}>
                <Alert severity='info'>Final price = Base Price + (Area × Price/m²)</Alert>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Rental Metadata */}
      <Grid size={12}>
        <Card>
          <CardHeader title='Rental Metadata' />
          <CardContent>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>Duration Unit</InputLabel>
                  <Select
                    value={rentalMetadata.rental_duration_unit}
                    label='Duration Unit'
                    onChange={e =>
                      setRentalMetadata({
                        ...rentalMetadata,
                        rental_duration_unit: e.target.value
                      })
                    }
                  >
                    <MenuItem value='day'>Day</MenuItem>
                    <MenuItem value='week'>Week</MenuItem>
                    <MenuItem value='month'>Month</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  label='Minimum Rental Duration'
                  type='number'
                  value={rentalMetadata.minimum_rental_duration}
                  onChange={e =>
                    setRentalMetadata({
                      ...rentalMetadata,
                      minimum_rental_duration: parseInt(e.target.value)
                    })
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  label='Setup Time Required'
                  value={rentalMetadata.setup_time_required}
                  onChange={e =>
                    setRentalMetadata({
                      ...rentalMetadata,
                      setup_time_required: e.target.value
                    })
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  label='Teardown Time Required'
                  value={rentalMetadata.teardown_time_required}
                  onChange={e =>
                    setRentalMetadata({
                      ...rentalMetadata,
                      teardown_time_required: e.target.value
                    })
                  }
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Size Variations */}
      <Grid size={12}>
        <Card>
          <CardHeader title='Size Variations' subheader='Add tent sizes to generate product variations automatically' />
          <CardContent>
            {/* Add New Size */}
            <Box mb={4}>
              <Typography variant='h6' gutterBottom>
                Add New Size
              </Typography>
              <Grid container spacing={2} alignItems='center'>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField
                    fullWidth
                    label='Length (meters)'
                    type='number'
                    value={newLength}
                    onChange={e => setNewLength(e.target.value)}
                    inputProps={{ step: 0.5, min: 0 }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField
                    fullWidth
                    label='Width (meters)'
                    type='number'
                    value={newWidth}
                    onChange={e => setNewWidth(e.target.value)}
                    inputProps={{ step: 0.5, min: 0 }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField
                    fullWidth
                    label='Stock Quantity'
                    type='number'
                    value={newStock}
                    onChange={e => setNewStock(e.target.value)}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <Button
                    fullWidth
                    variant='contained'
                    startIcon={<AddIcon />}
                    onClick={addSize}
                    sx={{ height: '56px' }}
                  >
                    Add Size
                  </Button>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Size List */}
            <Typography variant='h6' gutterBottom>
              Configured Sizes ({sizes.length})
            </Typography>
            <TableContainer component={Paper} variant='outlined'>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Size</TableCell>
                    <TableCell>Area (m²)</TableCell>
                    <TableCell>Calculated Price</TableCell>
                    <TableCell>Capacity (Standing)</TableCell>
                    <TableCell>Capacity (Seated)</TableCell>
                    <TableCell>Stock</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sizes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align='center'>
                        <Typography color='textSecondary'>No sizes added yet. Add your first size above.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sizes.map(size => {
                      const area = size.length * size.width
                      const price = calculatePrice(size.length, size.width)
                      const capacity = calculateCapacity(size.length, size.width)

                      return (
                        <TableRow key={size.id}>
                          <TableCell>
                            <Chip label={`${size.length}m × ${size.width}m`} color='primary' variant='outlined' />
                          </TableCell>
                          <TableCell>{area} m²</TableCell>
                          <TableCell>KES {price.toLocaleString()}</TableCell>
                          <TableCell>{capacity.standing} people</TableCell>
                          <TableCell>{capacity.seated} people</TableCell>
                          <TableCell>{size.stockQuantity}</TableCell>
                          <TableCell>
                            <IconButton size='small' color='error' onClick={() => removeSize(size.id)}>
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Submit Button */}
      <Grid size={12}>
        <Box display='flex' justifyContent='flex-end' gap={2}>
          <Button
            variant='contained'
            size='large'
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            onClick={handleSubmit}
            disabled={loading || sizes.length === 0}
          >
            {loading ? 'Creating Product...' : 'Create Event Tent Product'}
          </Button>
        </Box>
      </Grid>
    </Grid>
  )
}
