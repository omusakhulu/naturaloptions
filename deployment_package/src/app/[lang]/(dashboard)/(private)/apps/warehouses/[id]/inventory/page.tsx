'use client'

import { useState, useEffect, use } from 'react'

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
  CircularProgress,
  Alert,
  Autocomplete
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import CancelIcon from '@mui/icons-material/Cancel'
import InventoryIcon from '@mui/icons-material/Inventory'

interface Product {
  id: number
  name: string
  sku: string
  price: string
  regularPrice: string
  salePrice: string
  image?: string
  categories?: Array<{ id: number; name: string; slug?: string }>
}

export default function AddInventoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locations, setLocations] = useState<any[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productLoading, setProductLoading] = useState(false)

  const [formData, setFormData] = useState({
    sku: '',
    productName: '',
    description: '',
    category: '',
    quantity: '0',
    reorderLevel: '10',
    unit: 'pcs',
    costPrice: '',
    sellingPrice: '',
    locationId: ''
  })

  useEffect(() => {
    fetchLocations()
    fetchProducts()
  }, [id])

  const fetchLocations = async () => {
    try {
      const response = await fetch(`/api/warehouses/${id}`)
      const data = await response.json()

      if (data.success) {
        setLocations(data.warehouse.locations || [])
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
    }
  }

  const fetchProducts = async () => {
    setProductLoading(true)
    try {
      const response = await fetch('/api/products/list')
      const data = await response.json()

      if (data.success && data.products) {
        setProducts(data.products)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setProductLoading(false)
    }
  }

  const handleProductSelect = (product: Product | null) => {
    setSelectedProduct(product)
    if (product) {
      // Extract category name from first category if available
      const categoryName = product.categories && product.categories.length > 0 
        ? product.categories[0].name 
        : ''

      setFormData(prev => ({
        ...prev,
        sku: product.sku || '',
        productName: product.name,
        category: categoryName,
        sellingPrice: product.price || product.regularPrice || '',
        costPrice: product.salePrice || ''
      }))
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/warehouses/${id}/inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          quantity: parseInt(formData.quantity) || 0,
          reorderLevel: parseInt(formData.reorderLevel) || 10,
          costPrice: formData.costPrice ? parseFloat(formData.costPrice) : null,
          sellingPrice: formData.sellingPrice ? parseFloat(formData.sellingPrice) : null,
          locationId: formData.locationId || null
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to add inventory')
      }

      router.push(`/en/apps/warehouses/${id}`)
    } catch (err: any) {
      console.error('Error adding inventory:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={6}>
        <Grid size={12}>
          <Card>
            <CardHeader
              title={
                <Box display='flex' alignItems='center' gap={2}>
                  <InventoryIcon sx={{ fontSize: 32 }} />
                  <Typography variant='h5'>Add Inventory Item</Typography>
                </Box>
              }
            />
          </Card>
        </Grid>

        {error && (
          <Grid size={12}>
            <Alert severity='error' onClose={() => setError(null)}>
              {error}
            </Alert>
          </Grid>
        )}

        <Grid size={12}>
          <Card>
            <CardHeader title='Product Information' />
            <CardContent>
              <Grid container spacing={4}>
                <Grid size={12}>
                  <Autocomplete
                    options={products}
                    loading={productLoading}
                    getOptionLabel={option => `${option.name} ${option.sku ? `(${option.sku})` : ''}`}
                    value={selectedProduct}
                    onChange={(e, value) => handleProductSelect(value)}
                    renderOption={(props, option) => (
                      <li {...props} key={option.id}>
                        <Box display='flex' alignItems='center' gap={2} width='100%'>
                          {option.image && (
                            <img
                              src={option.image}
                              alt={option.name}
                              style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
                            />
                          )}
                          <Box flex={1}>
                            <Typography variant='body1'>{option.name}</Typography>
                            <Typography variant='caption' color='text.secondary'>
                              {option.sku && `SKU: ${option.sku} • `}
                              KSh {option.price || option.regularPrice}
                            </Typography>
                          </Box>
                        </Box>
                      </li>
                    )}
                    renderInput={params => (
                      <TextField
                        {...params}
                        label='Search Existing Products'
                        placeholder='Type to search by product name or SKU...'
                        helperText='Select a product to auto-fill fields, or leave empty to create new'
                      />
                    )}
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    required
                    label='SKU'
                    value={formData.sku}
                    onChange={e => handleChange('sku', e.target.value)}
                    placeholder='e.g., PROD-001'
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    required
                    label='Product Name'
                    value={formData.productName}
                    onChange={e => handleChange('productName', e.target.value)}
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label='Description'
                    value={formData.description}
                    onChange={e => handleChange('description', e.target.value)}
                    multiline
                    rows={3}
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label='Category'
                    value={formData.category}
                    onChange={e => handleChange('category', e.target.value)}
                    helperText={selectedProduct && formData.category ? 'Auto-filled from product data' : ''}
                  />
                </Grid>
                <Grid size={12}>
                  <Autocomplete
                    options={locations}
                    getOptionLabel={option => option.locationCode}
                    onChange={(e, value) => handleChange('locationId', value?.id || '')}
                    renderInput={params => <TextField {...params} label='Location (Optional)' />}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={12}>
          <Card>
            <CardHeader title='Stock & Pricing' />
            <CardContent>
              <Grid container spacing={4}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label='Initial Quantity'
                    type='number'
                    value={formData.quantity}
                    onChange={e => handleChange('quantity', e.target.value)}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label='Reorder Level'
                    type='number'
                    value={formData.reorderLevel}
                    onChange={e => handleChange('reorderLevel', e.target.value)}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label='Unit'
                    value={formData.unit}
                    onChange={e => handleChange('unit', e.target.value)}
                    placeholder='e.g., pcs, kg, ltr'
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label='Cost Price (KSh)'
                    type='number'
                    value={formData.costPrice}
                    onChange={e => handleChange('costPrice', e.target.value)}
                    inputProps={{ min: 0, step: 0.01 }}
                    helperText={selectedProduct ? 'Auto-filled from product data' : ''}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label='Selling Price (KSh)'
                    type='number'
                    value={formData.sellingPrice}
                    onChange={e => handleChange('sellingPrice', e.target.value)}
                    inputProps={{ min: 0, step: 0.01 }}
                    helperText={selectedProduct ? 'Auto-filled from product data' : ''}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={12}>
          <Box display='flex' gap={2} justifyContent='flex-end'>
            <Button
              variant='outlined'
              startIcon={<CancelIcon />}
              onClick={() => router.push(`/en/apps/warehouses/${id}`)}
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
              {loading ? 'Adding...' : 'Add to Inventory'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </form>
  )
}
