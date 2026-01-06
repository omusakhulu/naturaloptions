'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  InputAdornment
} from '@mui/material'
import { Save, Cancel } from '@mui/icons-material'

export default function CreatePromotionPage() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percent',
    amount: '',
    description: '',
    date_expires: '',
    individual_use: false,
    free_shipping: false,
    exclude_sale_items: false,
    minimum_amount: '',
    maximum_amount: '',
    usage_limit: '',
    usage_limit_per_user: ''
  })

  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const lang = params?.lang || 'en'
  const couponId = searchParams.get('id')

  useEffect(() => {
    if (couponId) {
      loadCoupon()
    }
  }, [couponId])

  const loadCoupon = async () => {
    try {
      const res = await axios.get('/api/promotions')
      const coupon = res.data.find(c => c.id === parseInt(couponId))
      
      if (coupon) {
        setFormData({
          code: coupon.code || '',
          discount_type: coupon.discount_type || 'percent',
          amount: coupon.amount || '',
          description: coupon.description || '',
          date_expires: coupon.date_expires ? coupon.date_expires.split('T')[0] : '',
          individual_use: coupon.individual_use || false,
          free_shipping: coupon.free_shipping || false,
          exclude_sale_items: coupon.exclude_sale_items || false,
          minimum_amount: coupon.minimum_amount || '',
          maximum_amount: coupon.maximum_amount || '',
          usage_limit: coupon.usage_limit || '',
          usage_limit_per_user: coupon.usage_limit_per_user || ''
        })
      }
    } catch (err) {
      console.error('Error loading coupon:', err)
      alert('Failed to load coupon')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = {
        ...formData,
        amount: parseFloat(formData.amount) || 0,
        minimum_amount: formData.minimum_amount || '0',
        maximum_amount: formData.maximum_amount || '0',
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        usage_limit_per_user: formData.usage_limit_per_user ? parseInt(formData.usage_limit_per_user) : null,
        date_expires: formData.date_expires || null
      }

      if (couponId) {
        await axios.put('/api/promotions', { id: parseInt(couponId), ...data })
      } else {
        await axios.post('/api/promotions', data)
      }

      router.push(`/${lang}/apps/ecommerce/promotions`)
    } catch (err) {
      console.error('Error saving coupon:', err)
      alert('Failed to save coupon')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className='p-8'>
      <div className='mb-6'>
        <h1 className='text-2xl font-semibold'>
          {couponId ? 'Edit Coupon' : 'Create New Coupon'}
        </h1>
        <p className='text-gray-600 mt-1'>
          Configure discount codes for your store
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <h3 className='text-lg font-semibold mb-4'>Basic Information</h3>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      required
                      label='Coupon Code'
                      placeholder='SUMMER2024'
                      value={formData.code}
                      onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                      helperText='Unique code customers will use at checkout'
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type='date'
                      label='Expiry Date'
                      value={formData.date_expires}
                      onChange={(e) => handleChange('date_expires', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      helperText='Leave empty for no expiry'
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label='Description'
                      placeholder='Internal description of this coupon'
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <h3 className='text-lg font-semibold mb-4'>Discount Settings</h3>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Discount Type</InputLabel>
                      <Select
                        value={formData.discount_type}
                        onChange={(e) => handleChange('discount_type', e.target.value)}
                        label='Discount Type'
                      >
                        <MenuItem value='percent'>Percentage Discount</MenuItem>
                        <MenuItem value='fixed_cart'>Fixed Cart Discount</MenuItem>
                        <MenuItem value='fixed_product'>Fixed Product Discount</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      required
                      type='number'
                      label='Discount Amount'
                      value={formData.amount}
                      onChange={(e) => handleChange('amount', e.target.value)}
                      InputProps={{
                        startAdornment: formData.discount_type === 'percent' ? (
                          <InputAdornment position='start'>%</InputAdornment>
                        ) : (
                          <InputAdornment position='start'>$</InputAdornment>
                        )
                      }}
                      inputProps={{ min: 0, step: '0.01' }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <h3 className='text-lg font-semibold mb-4'>Usage Restrictions</h3>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type='number'
                      label='Minimum Spend'
                      placeholder='0.00'
                      value={formData.minimum_amount}
                      onChange={(e) => handleChange('minimum_amount', e.target.value)}
                      InputProps={{
                        startAdornment: <InputAdornment position='start'>$</InputAdornment>
                      }}
                      inputProps={{ min: 0, step: '0.01' }}
                      helperText='Minimum order amount required'
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type='number'
                      label='Maximum Spend'
                      placeholder='0.00'
                      value={formData.maximum_amount}
                      onChange={(e) => handleChange('maximum_amount', e.target.value)}
                      InputProps={{
                        startAdornment: <InputAdornment position='start'>$</InputAdornment>
                      }}
                      inputProps={{ min: 0, step: '0.01' }}
                      helperText='Maximum order amount allowed (0 for no limit)'
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type='number'
                      label='Usage Limit'
                      placeholder='Unlimited'
                      value={formData.usage_limit}
                      onChange={(e) => handleChange('usage_limit', e.target.value)}
                      inputProps={{ min: 0 }}
                      helperText='Total number of times this coupon can be used'
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type='number'
                      label='Usage Limit Per User'
                      placeholder='Unlimited'
                      value={formData.usage_limit_per_user}
                      onChange={(e) => handleChange('usage_limit_per_user', e.target.value)}
                      inputProps={{ min: 0 }}
                      helperText='How many times each user can use this coupon'
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.individual_use}
                          onChange={(e) => handleChange('individual_use', e.target.checked)}
                        />
                      }
                      label='Individual use only (cannot be combined with other coupons)'
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.exclude_sale_items}
                          onChange={(e) => handleChange('exclude_sale_items', e.target.checked)}
                        />
                      }
                      label='Exclude sale items'
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.free_shipping}
                          onChange={(e) => handleChange('free_shipping', e.target.checked)}
                        />
                      }
                      label='Allow free shipping'
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <div className='flex gap-3'>
              <Button
                type='submit'
                variant='contained'
                startIcon={<Save />}
                disabled={loading || !formData.code || !formData.amount}
              >
                {loading ? 'Saving...' : couponId ? 'Update Coupon' : 'Create Coupon'}
              </Button>
              <Button
                variant='outlined'
                startIcon={<Cancel />}
                onClick={() => router.push(`/${lang}/apps/ecommerce/promotions`)}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </Grid>
        </Grid>
      </form>
    </div>
  )
}
