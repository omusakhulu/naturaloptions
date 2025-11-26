'use client'

import { useState, useEffect } from 'react'

import { useRouter } from 'next/navigation'

import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'

// MUI Imports
import {
  Grid,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Paper,
  InputAdornment
} from '@mui/material'

// Local buying price utilities
import { getBuyingPriceBySku, setBuyingPriceBySku } from '@/utils/buyingPriceUtils'

export default function ProductForm({ product = null }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [buyingPrice, setBuyingPrice] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: product?.name || '',
      sku: product?.sku || '',
      price: product?.price || '',
      regular_price: product?.regular_price || '',
      sale_price: product?.sale_price || '',
      stock_quantity: product?.stock_quantity || '',
      stock_status: product?.stock_status || 'instock',
      status: product?.status || 'publish',
      description: product?.description || '',
      short_description: product?.short_description || ''
    }
  })

  // Load buying price when product changes or SKU changes
  useEffect(() => {
    if (product) {
      reset({
        name: product.name || '',
        sku: product.sku || '',
        price: product.price || '',
        regular_price: product.regular_price || '',
        sale_price: product.sale_price || '',
        stock_quantity: product.stock_quantity || 0,
        stock_status: product.stock_status || 'instock',
        status: product.status || 'publish',
        description: product.description || '',
        short_description: product.short_description || ''
      })
      
      // Load buying price from local storage
      if (product.sku) {
        const storedBuyingPrice = getBuyingPriceBySku(product.sku)
        setBuyingPrice(storedBuyingPrice ? storedBuyingPrice.toString() : '')
        setValue('buying_price', storedBuyingPrice ? storedBuyingPrice.toString() : '')
      }
    }
  }, [product, reset, setValue])

  // Handle buying price change
  const handleBuyingPriceChange = (value) => {
    setBuyingPrice(value)
    // Save to local storage when SKU exists
    const currentSku = product?.sku || document.querySelector('input[name="sku"]')?.value
    if (currentSku && value && !isNaN(value)) {
      setBuyingPriceBySku(currentSku, parseFloat(value))
    }
  }

  const onSubmit = async formData => {
    setIsLoading(true)
    setError('')

    try {
      // Save buying price to local storage
      if (formData.sku && formData.buying_price && !isNaN(formData.buying_price)) {
        setBuyingPriceBySku(formData.sku, parseFloat(formData.buying_price))
      }

      // Prepare product data
      const productData = {
        name: formData.name,
        type: 'simple',
        price: formData.price,
        regular_price: formData.regular_price || formData.price, // Use price if regular_price not provided
        sale_price: formData.sale_price || '',
        description: formData.description || '',
        short_description: formData.short_description || '',
        status: formData.status || 'draft',
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        stock_status: formData.stock_status || 'instock',
        manage_stock: formData.stock_status === 'onbackorder' ? false : true,
        sku: formData.sku || ''
      }

      // Log the data being sent (for debugging)
      console.log('Submitting product data:', productData)

      // Call our API endpoint
      const response = await fetch('/api/products/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create product')
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to create product')
      }

      // Show success message
      toast.success('Product created successfully!')

      // Redirect to products list
      router.push('/en/apps/ecommerce/products/list')
    } catch (error) {
      console.error('Error creating product:', error)
      setError(error.message)
      toast.error(error.message || 'Failed to create product')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Paper sx={{ p: 4, maxWidth: 900, mx: 'auto', mt: 4 }}>
      <Typography variant='h5' component='h1' gutterBottom>
        {product ? 'Edit Product' : 'Add New Product'}
      </Typography>

      {error && (
        <Typography color='error' sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label='Product Name'
              {...register('name', { required: 'Product name is required' })}
              error={!!errors.name}
              helperText={errors.name?.message}
              margin='normal'
            />

            <TextField fullWidth label='SKU' {...register('sku')} margin='normal' />

            <TextField fullWidth label='Description' {...register('description')} multiline rows={4} margin='normal' />

            <TextField
              fullWidth
              label='Short Description'
              {...register('short_description')}
              multiline
              rows={2}
              margin='normal'
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth margin='normal'>
              <InputLabel>Status</InputLabel>
              <Select label='Status' defaultValue={product?.status || 'publish'} {...register('status')}>
                <MenuItem value='publish'>Published</MenuItem>
                <MenuItem value='draft'>Draft</MenuItem>
                <MenuItem value='pending'>Pending Review</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label='Regular Price ($)'
              type='number'
              step='0.01'
              {...register('regular_price', {
                required: 'Regular price is required',
                min: { value: 0, message: 'Price must be positive' }
              })}
              error={!!errors.regular_price}
              helperText={errors.regular_price?.message}
              margin='normal'
            />

            <TextField
              fullWidth
              label='Buying Price ($)'
              type='number'
              step='0.01'
              value={buyingPrice}
              {...register('buying_price', {
                min: { value: 0, message: 'Buying price must be positive' }
              })}
              onChange={(e) => handleBuyingPriceChange(e.target.value)}
              error={!!errors.buying_price}
              helperText={errors.buying_price?.message || 'Stored locally for stock calculations'}
              margin='normal'
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />

            <TextField
              fullWidth
              label='Sale Price ($)'
              type='number'
              step='0.01'
              {...register('sale_price', {
                min: { value: 0, message: 'Price must be positive' }
              })}
              error={!!errors.sale_price}
              helperText={errors.sale_price?.message}
              margin='normal'
            />

            <FormControl fullWidth margin='normal'>
              <InputLabel>Stock Status</InputLabel>
              <Select
                label='Stock Status'
                defaultValue={product?.stock_status || 'instock'}
                {...register('stock_status')}
              >
                <MenuItem value='instock'>In Stock</MenuItem>
                <MenuItem value='outofstock'>Out of Stock</MenuItem>
                <MenuItem value='onbackorder'>On Backorder</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label='Stock Quantity'
              type='number'
              {...register('stock_quantity', {
                min: { value: 0, message: 'Quantity must be positive' }
              })}
              error={!!errors.stock_quantity}
              helperText={errors.stock_quantity?.message}
              margin='normal'
            />
          </Grid>

          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Button
              variant='outlined'
              onClick={() => router.push('/apps/ecommerce/products/list')}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              variant='contained'
              color='primary'
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : null}
            >
              {isLoading ? 'Saving...' : 'Save Product'}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  )
}
