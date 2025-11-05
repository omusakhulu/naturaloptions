'use client'

// Next.js Imports
import { useState } from 'react'

import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

// React Imports

// Form Handling
import { useForm } from 'react-hook-form'

// UI Components
import { toast } from 'react-hot-toast'

// MUI Components
import Divider from '@mui/material/Divider'

// MUI Components
// eslint-disable-next-line import/no-unresolved
import Grid from '@mui/material/Grid' // Using the new Grid2 component
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'

// Third-party Imports
import classnames from 'classnames'

// Components Imports
import CustomIconButton from '@core/components/mui/IconButton'
import CustomTextField from '@core/components/mui/TextField'

// Style Imports
import '@/libs/styles/tiptapEditor.css'

// Simple textarea for product description

const ProductInformation = ({ product }) => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm({
    defaultValues: {
      name: product?.name || '',
      sku: product?.sku || '',
      price: product?.price || '',
      regular_price: product?.regular_price || '',
      sale_price: product?.sale_price || '',
      stock_quantity: product?.stock_quantity || 0,
      stock_status: product?.stock_status || 'instock',
      status: product?.status || 'draft',
      description: product?.description || '',
      short_description: product?.short_description || ''
    }
  })

  // Dynamically import the editor component with SSR disabled
  const TipTapEditor = dynamic(() => import('@/components/editor/TipTapEditor').then(mod => mod.default || mod), {
    ssr: false,
    loading: () => (
      <div className='min-h-[200px] w-full rounded-lg border border-gray-200 p-4'>
        <div className='flex h-full items-center justify-center'>
          <CircularProgress size={24} />
        </div>
      </div>
    )
  })

  // Handle description change
  const handleDescriptionChange = e => {
    setValue('description', e.target.value, { shouldValidate: true })
  }

  const onSubmit = async data => {
    console.log('Form submitted with data:', data)

    // Basic validation
    if (!data.name || !data.regular_price) {
      toast.error('Name and price are required fields')

      return
    }

    setIsSubmitting(true)
    console.log('Starting form submission...')

    try {
      const payload = {
        name: data.name.trim(),
        description: data.description || '',
        short_description: data.short_description || '',
        regular_price: parseFloat(data.regular_price) || 0,
        sale_price: data.sale_price ? parseFloat(data.sale_price) : '',
        sku: data.sku || '',
        stock_quantity: parseInt(data.stock_quantity) || 0,
        stock_status: data.stock_status || 'instock',
        manage_stock: data.stock_status !== 'onbackorder',
        status: 'publish',
        type: 'simple',
        categories: []
      }

      console.log('Sending payload to API:', payload)

      const response = await fetch('/api/products/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const result = await response.json().catch(() => ({
        success: false,
        error: 'Invalid response from server'
      }))

      console.log('API Response:', { status: response.status, result })

      if (!response.ok || !result.success) {
        const errorMessage = result.error || result.message || 'Failed to create product'

        console.error('API Error:', errorMessage, result.details)
        throw new Error(errorMessage)
      }

      toast.success('Product created successfully!')
      router.push('/en/apps/ecommerce/products/list')
    } catch (error) {
      console.error('Error in form submission:', error)
      toast.error(error.message || 'An error occurred while creating the product')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Test form submission
  const handleFormSubmit = e => {
    e.preventDefault()
    console.log('Form submit event triggered')
    handleSubmit(onSubmit)(e).catch(error => {
      console.error('Form submission error:', error)
    })
  }

  return (
    <form onSubmit={handleFormSubmit}>
      <Card>
        <CardHeader
          title='Product Information'
          action={
            <Button
              type='submit'
              variant='contained'
              color='primary'
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
            >
              {isSubmitting ? 'Saving...' : 'Save Product'}
            </Button>
          }
        />
        <Divider />
        <CardContent>
          <Grid container spacing={6}>
            <Grid xs={12} md={6}>
              <CustomTextField
                fullWidth
                label='Product Name'
                placeholder='Enter product name'
                {...register('name', { required: 'Product name is required' })}
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            </Grid>
            <Grid xs={12} md={6}>
              <CustomTextField fullWidth label='SKU' placeholder='SKU' {...register('sku')} />
            </Grid>
            <Grid xs={12} md={6}>
              <CustomTextField
                fullWidth
                label='Regular Price'
                placeholder='0.00'
                type='number'
                step='0.01'
                {...register('regular_price', {
                  required: 'Price is required',
                  min: { value: 0, message: 'Price must be positive' }
                })}
                error={!!errors.regular_price}
                helperText={errors.regular_price?.message}
              />
            </Grid>
            <Grid xs={12} md={6}>
              <CustomTextField
                fullWidth
                label='Sale Price'
                placeholder='0.00'
                type='number'
                step='0.01'
                {...register('sale_price')}
              />
            </Grid>
            <Grid xs={12} md={6}>
              <CustomTextField
                select
                fullWidth
                label='Stock Status'
                defaultValue='instock'
                {...register('stock_status')}
                SelectProps={{ native: true }}
              >
                <option value='instock'>In Stock</option>
                <option value='outofstock'>Out of Stock</option>
                <option value='onbackorder'>On Backorder</option>
              </CustomTextField>
            </Grid>
            <Grid xs={12} md={6}>
              <CustomTextField
                fullWidth
                label='Stock Quantity'
                type='number'
                {...register('stock_quantity', { min: 0 })}
              />
            </Grid>
            <Grid xs={12} md={12}>
              <div className='border rounded'>
                <textarea
                  {...register('description')}
                  onChange={handleDescriptionChange}
                  value={watch('description')}
                  className='min-h-[200px] w-full p-4 border-0 focus:ring-0 focus:outline-none resize-none'
                  placeholder='Enter product description...'
                />
              </div>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </form>
  )
}

export default ProductInformation
