'use client'

import { useEffect, useState } from 'react'

import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'

import CustomTextField from '@core/components/mui/TextField'

const emptyAddr = {
  first_name: '',
  last_name: '',
  company: '',
  address_1: '',
  address_2: '',
  city: '',
  state: '',
  postcode: '',
  country: '',
  phone: ''
}

export default function EditCustomerDrawer({ open, onClose, customer, onUpdated }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [billing, setBilling] = useState(emptyAddr)
  const [shipping, setShipping] = useState(emptyAddr)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!customer) return
    setFirstName(customer.firstName || '')
    setLastName(customer.lastName || '')
    setEmail(customer.email || '')
    setUsername(customer.username || '')
    setBilling({ ...(customer.billingAddress || emptyAddr) })
    setShipping({ ...(customer.shippingAddress || emptyAddr) })
  }, [customer])

  const handleSave = async () => {
    if (!customer?.id) return
    setSaving(true)

    try {
      const payload = {
        first_name: firstName,
        last_name: lastName,
        email,
        username,
        billing,
        shipping
      }

      const res = await fetch(`/api/woocommerce/customers/${customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const json = await res.json()

      if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed to update customer')

      const c = json.customer || {}

      const updated = {
        id: c.id,
        email: c.email || email,
        firstName: c.first_name ?? firstName,
        lastName: c.last_name ?? lastName,
        username: c.username ?? username,
        role: c.role || customer.role,
        avatarUrl: c.avatar_url || customer.avatarUrl,
        billingAddress: c.billing || billing,
        shippingAddress: c.shipping || shipping,
        ordersCount:
          typeof c.orders_count === 'number' ? c.orders_count : Number(c.orders_count || customer.ordersCount || 0),
        totalSpent: Number(c.total_spent ?? customer.totalSpent ?? 0)
      }

      onUpdated?.(updated)
      onClose?.()
    } catch (e) {
      console.error('Update customer failed', e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 320, sm: 460 } } }}
    >
      <div className='flex items-center justify-between pli-6 plb-5'>
        <Typography variant='h5'>Edit Customer</Typography>
        <IconButton size='small' onClick={onClose}>
          <i className='tabler-x text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <div className='p-6 flex flex-col gap-4'>
        <div className='grid grid-cols-1 gap-4'>
          <CustomTextField label='First name' value={firstName} onChange={e => setFirstName(e.target.value)} />
          <CustomTextField label='Last name' value={lastName} onChange={e => setLastName(e.target.value)} />
          <CustomTextField label='Email' type='email' value={email} onChange={e => setEmail(e.target.value)} />
          <CustomTextField label='Username' value={username} onChange={e => setUsername(e.target.value)} />
        </div>
        <Typography variant='subtitle1'>Billing</Typography>
        <div className='grid grid-cols-1 gap-3'>
          <CustomTextField
            label='Address 1'
            value={billing.address_1}
            onChange={e => setBilling({ ...billing, address_1: e.target.value })}
          />
          <CustomTextField
            label='Address 2'
            value={billing.address_2}
            onChange={e => setBilling({ ...billing, address_2: e.target.value })}
          />
          <div className='grid grid-cols-2 gap-3'>
            <CustomTextField
              label='City'
              value={billing.city}
              onChange={e => setBilling({ ...billing, city: e.target.value })}
            />
            <CustomTextField
              label='State'
              value={billing.state}
              onChange={e => setBilling({ ...billing, state: e.target.value })}
            />
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <CustomTextField
              label='Postcode'
              value={billing.postcode}
              onChange={e => setBilling({ ...billing, postcode: e.target.value })}
            />
            <CustomTextField
              label='Country'
              value={billing.country}
              onChange={e => setBilling({ ...billing, country: e.target.value })}
            />
          </div>
          <CustomTextField
            label='Phone'
            value={billing.phone}
            onChange={e => setBilling({ ...billing, phone: e.target.value })}
          />
        </div>
        <Typography variant='subtitle1'>Shipping</Typography>
        <div className='grid grid-cols-1 gap-3'>
          <CustomTextField
            label='Address 1'
            value={shipping.address_1}
            onChange={e => setShipping({ ...shipping, address_1: e.target.value })}
          />
          <CustomTextField
            label='Address 2'
            value={shipping.address_2}
            onChange={e => setShipping({ ...shipping, address_2: e.target.value })}
          />
          <div className='grid grid-cols-2 gap-3'>
            <CustomTextField
              label='City'
              value={shipping.city}
              onChange={e => setShipping({ ...shipping, city: e.target.value })}
            />
            <CustomTextField
              label='State'
              value={shipping.state}
              onChange={e => setShipping({ ...shipping, state: e.target.value })}
            />
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <CustomTextField
              label='Postcode'
              value={shipping.postcode}
              onChange={e => setShipping({ ...shipping, postcode: e.target.value })}
            />
            <CustomTextField
              label='Country'
              value={shipping.country}
              onChange={e => setShipping({ ...shipping, country: e.target.value })}
            />
          </div>
        </div>
        <div className='flex gap-3'>
          <Button variant='tonal' color='secondary' onClick={onClose}>
            Cancel
          </Button>
          <Button variant='contained' onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </Drawer>
  )
}
