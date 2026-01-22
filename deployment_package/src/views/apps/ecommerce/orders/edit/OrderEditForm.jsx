'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import OrderLineItems from './OrderLineItems'

const OrderEditForm = ({ orderData }) => {
  // States
  const [formData, setFormData] = useState({
    status: orderData?.status || 'pending',
    paymentMethodTitle: orderData?.paymentMethodTitle || '',
    customerNote: orderData?.customerNote || '',
    billingFirstName: orderData?.billingAddress?.first_name || '',
    billingLastName: orderData?.billingAddress?.last_name || '',
    billingEmail: orderData?.billingAddress?.email || '',
    billingPhone: orderData?.billingAddress?.phone || '',
    billingAddress1: orderData?.billingAddress?.address_1 || '',
    billingAddress2: orderData?.billingAddress?.address_2 || '',
    billingCity: orderData?.billingAddress?.city || '',
    billingState: orderData?.billingAddress?.state || '',
    billingPostcode: orderData?.billingAddress?.postcode || '',
    billingCountry: orderData?.billingAddress?.country || '',
    shippingFirstName: orderData?.shippingAddress?.first_name || '',
    shippingLastName: orderData?.shippingAddress?.last_name || '',
    shippingAddress1: orderData?.shippingAddress?.address_1 || '',
    shippingAddress2: orderData?.shippingAddress?.address_2 || '',
    shippingCity: orderData?.shippingAddress?.city || '',
    shippingState: orderData?.shippingAddress?.state || '',
    shippingPostcode: orderData?.shippingAddress?.postcode || '',
    shippingCountry: orderData?.shippingAddress?.country || ''
  })

  const [lineItems, setLineItems] = useState(orderData?.lineItems || [])
  const [loading, setLoading] = useState(false)

  const handleChange = e => {
    const { name, value } = e.target

    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleLineItemsUpdate = updatedItems => {
    setLineItems(updatedItems)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/orders/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: orderData?.id,
          status: formData.status,
          customerNote: formData.customerNote,
          billingAddress: {
            first_name: formData.billingFirstName,
            last_name: formData.billingLastName,
            email: formData.billingEmail,
            phone: formData.billingPhone,
            address_1: formData.billingAddress1,
            address_2: formData.billingAddress2,
            city: formData.billingCity,
            state: formData.billingState,
            postcode: formData.billingPostcode,
            country: formData.billingCountry
          },
          shippingAddress: {
            first_name: formData.shippingFirstName,
            last_name: formData.shippingLastName,
            address_1: formData.shippingAddress1,
            address_2: formData.shippingAddress2,
            city: formData.shippingCity,
            state: formData.shippingState,
            postcode: formData.shippingPostcode,
            country: formData.shippingCountry
          },
          lineItems: lineItems
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update order')
      }

      const result = await response.json()

      console.log('Order updated successfully:', result)
      alert('Order updated successfully!')
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Failed to update order: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'on-hold', label: 'On Hold' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'refunded', label: 'Refunded' },
    { value: 'failed', label: 'Failed' }
  ]

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={6}>
        {/* Order Status */}
        <Grid size={12}>
          <Card>
            <CardHeader title='Order Status' />
            <CardContent>
              <Grid container spacing={6}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomTextField
                    select
                    fullWidth
                    label='Order Status'
                    name='status'
                    value={formData.status}
                    onChange={handleChange}
                  >
                    {statusOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </CustomTextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomTextField
                    fullWidth
                    label='Payment Method'
                    name='paymentMethodTitle'
                    value={formData.paymentMethodTitle}
                    onChange={handleChange}
                    disabled
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Customer Note */}
        <Grid size={12}>
          <Card>
            <CardHeader title='Customer Note' />
            <CardContent>
              <CustomTextField
                fullWidth
                multiline
                rows={4}
                label='Customer Note'
                name='customerNote'
                value={formData.customerNote}
                onChange={handleChange}
                placeholder='Add a note for the customer'
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Billing Address */}
        <Grid size={12}>
          <Card>
            <CardHeader title='Billing Address' />
            <CardContent>
              <Grid container spacing={6}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomTextField
                    fullWidth
                    label='First Name'
                    name='billingFirstName'
                    value={formData.billingFirstName}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomTextField
                    fullWidth
                    label='Last Name'
                    name='billingLastName'
                    value={formData.billingLastName}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid size={12}>
                  <CustomTextField
                    fullWidth
                    label='Email'
                    name='billingEmail'
                    value={formData.billingEmail}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid size={12}>
                  <CustomTextField
                    fullWidth
                    label='Phone'
                    name='billingPhone'
                    value={formData.billingPhone}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid size={12}>
                  <CustomTextField
                    fullWidth
                    label='Address Line 1'
                    name='billingAddress1'
                    value={formData.billingAddress1}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid size={12}>
                  <CustomTextField
                    fullWidth
                    label='Address Line 2'
                    name='billingAddress2'
                    value={formData.billingAddress2}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomTextField
                    fullWidth
                    label='City'
                    name='billingCity'
                    value={formData.billingCity}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomTextField
                    fullWidth
                    label='State'
                    name='billingState'
                    value={formData.billingState}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomTextField
                    fullWidth
                    label='Postcode'
                    name='billingPostcode'
                    value={formData.billingPostcode}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomTextField
                    fullWidth
                    label='Country'
                    name='billingCountry'
                    value={formData.billingCountry}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Shipping Address */}
        <Grid size={12}>
          <Card>
            <CardHeader title='Shipping Address' />
            <CardContent>
              <Grid container spacing={6}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomTextField
                    fullWidth
                    label='First Name'
                    name='shippingFirstName'
                    value={formData.shippingFirstName}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomTextField
                    fullWidth
                    label='Last Name'
                    name='shippingLastName'
                    value={formData.shippingLastName}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid size={12}>
                  <CustomTextField
                    fullWidth
                    label='Address Line 1'
                    name='shippingAddress1'
                    value={formData.shippingAddress1}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid size={12}>
                  <CustomTextField
                    fullWidth
                    label='Address Line 2'
                    name='shippingAddress2'
                    value={formData.shippingAddress2}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomTextField
                    fullWidth
                    label='City'
                    name='shippingCity'
                    value={formData.shippingCity}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomTextField
                    fullWidth
                    label='State'
                    name='shippingState'
                    value={formData.shippingState}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomTextField
                    fullWidth
                    label='Postcode'
                    name='shippingPostcode'
                    value={formData.shippingPostcode}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CustomTextField
                    fullWidth
                    label='Country'
                    name='shippingCountry'
                    value={formData.shippingCountry}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Line Items */}
        <Grid size={12}>
          <OrderLineItems lineItems={lineItems} onUpdate={handleLineItemsUpdate} />
        </Grid>

        {/* Action Buttons */}
        <Grid size={12}>
          <div className='flex gap-4'>
            <Button variant='contained' type='submit' disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button variant='tonal' color='secondary' type='button'>
              Cancel
            </Button>
          </div>
        </Grid>
      </Grid>
    </form>
  )
}

export default OrderEditForm
