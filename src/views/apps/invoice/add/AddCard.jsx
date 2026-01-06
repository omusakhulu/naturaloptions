'use client'

// React Imports
import { useEffect, useMemo, useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import InputAdornment from '@mui/material/InputAdornment'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import InputLabel from '@mui/material/InputLabel'
import useMediaQuery from '@mui/material/useMediaQuery'

// Third-party Imports
import classnames from 'classnames'

// Component Imports
import AddCustomerDrawer, { initialFormData } from './AddCustomerDrawer'
import CustomerAutocomplete from '@/components/customers/CustomerAutocomplete'
import OrderLineItems from '@views/apps/ecommerce/orders/edit/OrderLineItems'
import Logo from '@components/layout/shared/Logo'
import CustomTextField from '@core/components/mui/TextField'

// Styled Component Imports
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

const AddAction = ({ invoiceData }) => {
  // States
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(1)
  const [selectData, setSelectData] = useState(null)
  const [lineItems, setLineItems] = useState([])
  const [issuedDate, setIssuedDate] = useState(null)
  const [dueDate, setDueDate] = useState(null)
  const [formData, setFormData] = useState(initialFormData)

  // Hooks
  const isBelowMdScreen = useMediaQuery(theme => theme.breakpoints.down('md'))
  const isBelowSmScreen = useMediaQuery(theme => theme.breakpoints.down('sm'))

  const onFormSubmit = async data => {
    try {
      const body = {
        email: data.email,
        first_name: (data.name || '').split(' ')[0] || data.name || '',
        last_name: (data.name || '').split(' ').slice(1).join(' '),
        billing: {
          first_name: (data.name || '').split(' ')[0] || '',
          last_name: (data.name || '').split(' ').slice(1).join(' '),
          company: data.company || '',
          address_1: data.address || '',
          address_2: '',
          city: '',
          state: '',
          postcode: '',
          country: data.country || 'US',
          email: data.email || '',
          phone: data.contactNumber || ''
        },
        shipping: {
          first_name: (data.name || '').split(' ')[0] || '',
          last_name: (data.name || '').split(' ').slice(1).join(' '),
          company: data.company || '',
          address_1: data.address || '',
          address_2: '',
          city: '',
          state: '',
          postcode: '',
          country: data.country || 'US'
        }
      }

      const res = await fetch('/api/woocommerce/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const json = await res.json()

      if (res.ok && json?.success && json?.customer) {
        const c = json.customer

        setSelectData({
          id: c.id || c.wooId || String(Date.now()),
          firstName: c.first_name || c.firstName,
          lastName: c.last_name || c.lastName,
          email: c.email,
          billingAddress: JSON.stringify(c.billing || {})
        })
        setFormData(initialFormData)
      } else {
        setFormData(data)
      }
    } catch (e) {
      setFormData(data)
    }
  }

  const deleteForm = e => {
    e.preventDefault()

    // @ts-ignore
    e.target.closest('.repeater-item').remove()
  }

  return (
    <>
      <Card>
        <CardContent className='sm:!p-12'>
          <Grid container spacing={6}>
            <Grid xs={12}>
              <div className='p-6 bg-actionHover rounded'>
                <div className='flex justify-between gap-4 flex-col sm:flex-row'>
                  <div className='flex flex-col gap-6'>
                    <div className='flex items-center gap-2.5'>
                      <Logo />
                    </div>
                    <div>
                      <Typography color='text.primary'>Kenyatta Dr 8 </Typography>
                      <Typography color='text.primary'>Dakar Rd 23, Nairobi, Kenya</Typography>
                      <Typography color='text.primary'>+254724529162</Typography>
                    </div>
                  </div>
                  <div className='flex flex-col gap-2'>
                    <div className='flex items-center gap-4'>
                      <Typography variant='h5' className='min-is-[95px]'>
                        Invoice
                      </Typography>
                      <CustomTextField
                        fullWidth
                        value={invoiceData?.[0].id}
                        slotProps={{
                          input: {
                            disabled: true,
                            startAdornment: <InputAdornment position='start'>#</InputAdornment>
                          }
                        }}
                      />
                    </div>
                    <div className='flex items-center'>
                      <Typography className='min-is-[95px] mie-4' color='text.primary'>
                        Date Issued:
                      </Typography>
                      <AppReactDatepicker
                        boxProps={{ className: 'is-full' }}
                        selected={issuedDate}
                        placeholderText='YYYY-MM-DD'
                        dateFormat={'yyyy-MM-dd'}
                        onChange={date => setIssuedDate(date)}
                        customInput={<CustomTextField fullWidth />}
                      />
                    </div>
                    <div className='flex items-center'>
                      <Typography className='min-is-[95px] mie-4' color='text.primary'>
                        Date Due:
                      </Typography>
                      <AppReactDatepicker
                        boxProps={{ className: 'is-full' }}
                        selected={dueDate}
                        placeholderText='YYYY-MM-DD'
                        dateFormat={'yyyy-MM-dd'}
                        onChange={date => setDueDate(date)}
                        customInput={<CustomTextField fullWidth />}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Grid>

            <Grid xs={12}>
              <div className='flex justify-between flex-col gap-4 flex-wrap sm:flex-row'>
                <div className='flex flex-col gap-3'>
                  <Typography className='font-medium mb-1' color='text.primary'>
                    Invoice To:
                  </Typography>
                  <div className='max-w-[640px] w-full'>
                    <CustomerAutocomplete
                      onSelect={cust => {
                        setSelectData({
                          id: cust.id,
                          firstName: cust.firstName,
                          lastName: cust.lastName,
                          email: cust.email,
                          billingAddress: cust.billingAddress || null
                        })
                        setFormData(initialFormData)
                      }}
                      onAddNew={() => {
                        setSelectData(null)
                        setOpen(true)
                      }}
                    />
                  </div>
                  <div className='text-sm text-textSecondary space-y-0.5'>
                    {selectData?.id ? (
                      <>
                        <Typography>{[selectData.firstName, selectData.lastName].filter(Boolean).join(' ')}</Typography>
                        <Typography>{selectData.email}</Typography>
                        <Typography>
                          {(() => {
                            try {
                              const b = selectData.billingAddress ? JSON.parse(selectData.billingAddress) : {}

                              const parts = [b.address_1, b.address_2, b.city, b.state, b.postcode, b.country].filter(
                                Boolean
                              )

                              return parts.join(', ')
                            } catch {
                              return ''
                            }
                          })()}
                        </Typography>
                      </>
                    ) : (
                      <>
                        <Typography>{formData?.name}</Typography>
                        <Typography>{formData?.email}</Typography>
                        <Typography>{formData?.address}</Typography>
                      </>
                    )}
                  </div>
                </div>
                <div className='flex flex-col gap-4'>
                  <Typography className='font-medium' color='text.primary'>
                    Bill To:
                  </Typography>
                  <div>
                    <div className='flex items-center gap-4'>
                      <Typography className='min-is-[100px]'>Total Due:</Typography>
                      <Typography>$12,110.55</Typography>
                    </div>
                    <div className='flex items-center gap-4'>
                      <Typography className='min-is-[100px]'>Bank name:</Typography>
                      <Typography>American Bank</Typography>
                    </div>
                    <div className='flex items-center gap-4'>
                      <Typography className='min-is-[100px]'>Country:</Typography>
                      <Typography>United States</Typography>
                    </div>
                    <div className='flex items-center gap-4'>
                      <Typography className='min-is-[100px]'>IBAN:</Typography>
                      <Typography>ETD95476213874685</Typography>
                    </div>
                    <div className='flex items-center gap-4'>
                      <Typography className='min-is-[100px]'>SWIFT code:</Typography>
                      <Typography>BR91905</Typography>
                    </div>
                  </div>
                </div>
              </div>
            </Grid>

            <Grid xs={12}>
              <Divider className='border-dashed' />
            </Grid>
            <Grid xs={12}>
              <OrderLineItems lineItems={lineItems} onUpdate={setLineItems} />
            </Grid>
            <Grid xs={12}>
              <Divider className='border-dashed' />
            </Grid>
            <Grid xs={12}>
              <div className='flex justify-between flex-col gap-4 sm:flex-row'>
                <div className='flex flex-col gap-4 order-2 sm:order-[unset]'>
                  <div className='flex items-center gap-2'>
                    <Typography className='font-medium' color='text.primary'>
                      Salesperson:
                    </Typography>
                    <CustomTextField defaultValue='Tommy Shelby' />
                  </div>
                  <CustomTextField placeholder='Thanks for your business' />
                </div>
                <div className='min-is-[200px]'>
                  <div className='flex items-center justify-between'>
                    <Typography>Subtotal:</Typography>
                    <Typography className='font-medium' color='text.primary'>
                      $1800
                    </Typography>
                  </div>
                  <div className='flex items-center justify-between'>
                    <Typography>Discount:</Typography>
                    <Typography className='font-medium' color='text.primary'>
                      $28
                    </Typography>
                  </div>
                  <div className='flex items-center justify-between'>
                    <Typography>Tax:</Typography>
                    <Typography className='font-medium' color='text.primary'>
                      21%
                    </Typography>
                  </div>
                  <Divider className='mlb-2' />
                  <div className='flex items-center justify-between'>
                    <Typography>Total:</Typography>
                    <Typography className='font-medium' color='text.primary'>
                      $1690
                    </Typography>
                  </div>
                </div>
              </div>
            </Grid>
            <Grid xs={12}>
              <Divider className='border-dashed' />
            </Grid>
            <Grid xs={12}>
              <InputLabel htmlFor='invoice-note' className='inline-flex mbe-1 text-textPrimary'>
                Note:
              </InputLabel>
              <CustomTextField
                id='invoice-note'
                rows={2}
                fullWidth
                multiline
                className='border rounded'
                defaultValue='It was a pleasure working with you and your team. We hope you will keep us in mind for future freelance
              projects. Thank You!'
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <AddCustomerDrawer open={open} setOpen={setOpen} onFormSubmit={onFormSubmit} />
    </>
  )
}

export default AddAction
