// React Imports
import { useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'

// Third-party Imports
import PerfectScrollbar from 'react-perfect-scrollbar'
import { useForm, Controller } from 'react-hook-form'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

export const country = {
  india: { country: 'India' },
  australia: { country: 'Australia' },
  france: { country: 'France' },
  brazil: { country: 'Brazil' },
  us: { country: 'United States' },
  china: { country: 'China' }
}

// Vars
const initialData = {
  contact: '',
  address1: '',
  address2: '',
  town: '',
  state: '',
  postcode: ''
}

const AddCustomerDrawer = props => {
  // Props
  const { open, handleClose, setData, customerData } = props

  // States
  const [formData, setFormData] = useState(initialData)

  // Hooks
  const {
    control,
    reset: resetForm,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      fullName: '',
      email: '',
      country: ''
    }
  })

  const onSubmit = async data => {
    const [firstName, ...lastParts] = String(data.fullName || '').trim().split(' ')
    const lastName = lastParts.join(' ')

    const countryMap = { india: 'IN', australia: 'AU', france: 'FR', brazil: 'BR', us: 'US', china: 'CN' }
    const countryCode = countryMap[data.country] || data.country || ''

    const payload = {
      email: data.email,
      first_name: firstName || '',
      last_name: lastName || '',
      billing: {
        first_name: firstName || '',
        last_name: lastName || '',
        address_1: formData.address1,
        address_2: formData.address2,
        city: formData.town,
        state: formData.state,
        postcode: formData.postcode,
        country: countryCode,
        phone: formData.contact
      },
      shipping: {
        first_name: firstName || '',
        last_name: lastName || '',
        address_1: formData.address1,
        address_2: formData.address2,
        city: formData.town,
        state: formData.state,
        postcode: formData.postcode,
        country: countryCode
      }
    }

    try {
      const res = await fetch('/api/woocommerce/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const json = await res.json()
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed to create customer')

      const c = json.customer || {}
      const created = {
        id: c.id,
        email: c.email || data.email,
        firstName: c.first_name || firstName || '',
        lastName: c.last_name || lastName || '',
        username: c.username || '',
        role: c.role || 'customer',
        avatarUrl: c.avatar_url || '',
        billingAddress: c.billing || payload.billing,
        shippingAddress: c.shipping || payload.shipping,
        ordersCount: typeof c.orders_count === 'number' ? c.orders_count : Number(c.orders_count || 0),
        totalSpent: Number(c.total_spent || 0)
      }

      setData([...(customerData ?? []), created])
      resetForm({ fullName: '', email: '', country: '' })
      setFormData(initialData)
      handleClose()
    } catch (e) {
      console.error('Create customer failed', e)
    }
  }

  const handleReset = () => {
    handleClose()
    resetForm({ fullName: '', email: '', country: '' })
    setFormData(initialData)
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={handleReset}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}
    >
      <div className='flex items-center justify-between pli-6 plb-5'>
        <Typography variant='h5'>Add a Customer</Typography>
        <IconButton size='small' onClick={handleReset}>
          <i className='tabler-x text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <PerfectScrollbar options={{ wheelPropagation: false, suppressScrollX: true }}>
        <div className='p-6'>
          <form onSubmit={handleSubmit(data => onSubmit(data))} className='flex flex-col gap-5'>
            <Typography color='text.primary' className='font-medium'>
              Basic Information
            </Typography>
            <Controller
              name='fullName'
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  label='Name'
                  placeholder='John Doe'
                  {...(errors.fullName && { error: true, helperText: 'This field is required.' })}
                />
              )}
            />
            <Controller
              name='email'
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  type='email'
                  label='Email'
                  placeholder='johndoe@gmail.com'
                  {...(errors.email && { error: true, helperText: 'This field is required.' })}
                />
              )}
            />
            <Controller
              name='country'
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <CustomTextField
                  select
                  fullWidth
                  id='country'
                  label='Country'
                  {...field}
                  {...(errors.country && { error: true, helperText: 'This field is required.' })}
                >
                  <MenuItem value='india'>India</MenuItem>
                  <MenuItem value='australia'>Australia</MenuItem>
                  <MenuItem value='france'>France</MenuItem>
                  <MenuItem value='brazil'>Brazil</MenuItem>
                  <MenuItem value='us'>USA</MenuItem>
                  <MenuItem value='china'>China</MenuItem>
                </CustomTextField>
              )}
            />
            <Typography color='text.primary' className='font-medium'>
              Shipping Information
            </Typography>
            <CustomTextField
              fullWidth
              label='Address Line 1'
              name='address1'
              placeholder='45 Roker Terrace'
              value={formData.address1}
              onChange={e => setFormData({ ...formData, address1: e.target.value })}
            />
            <CustomTextField
              fullWidth
              label='Address Line 2'
              name='address2'
              placeholder='Street 69'
              value={formData.address2}
              onChange={e => setFormData({ ...formData, address2: e.target.value })}
            />
            <CustomTextField
              fullWidth
              label='Town'
              name='town'
              placeholder='New York'
              value={formData.town}
              onChange={e => setFormData({ ...formData, town: e.target.value })}
            />
            <CustomTextField
              fullWidth
              label='State/Province'
              name='state'
              placeholder='Southern tip'
              value={formData.state}
              onChange={e => setFormData({ ...formData, state: e.target.value })}
            />
            <CustomTextField
              fullWidth
              label='Post Code'
              name='postcode'
              placeholder='734990'
              value={formData.postcode}
              onChange={e => setFormData({ ...formData, postcode: e.target.value })}
            />
            <CustomTextField
              label='Mobile'
              type='number'
              fullWidth
              placeholder='+(123) 456-7890'
              value={formData.contact}
              onChange={e => setFormData({ ...formData, contact: e.target.value })}
            />
            <div className='flex justify-between'>
              <div className='flex flex-col items-start gap-1'>
                <Typography color='text.primary' className='font-medium'>
                  Use as a billing address?
                </Typography>
                <Typography variant='body2'>Please check budget for more info.</Typography>
              </div>
              <Switch defaultChecked />
            </div>
            <div className='flex items-center gap-4'>
              <Button variant='contained' type='submit'>
                Add
              </Button>
              <Button variant='tonal' color='error' type='reset' onClick={handleReset}>
                Discard
              </Button>
            </div>
          </form>
        </div>
      </PerfectScrollbar>
    </Drawer>
  )
}

export default AddCustomerDrawer
