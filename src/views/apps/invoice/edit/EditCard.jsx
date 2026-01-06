'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import Divider from '@mui/material/Divider'
import InputLabel from '@mui/material/InputLabel'
import useMediaQuery from '@mui/material/useMediaQuery'

// Third-party Imports
import classnames from 'classnames'

// Component Imports
import Logo from '@components/layout/shared/Logo'
import CustomTextField from '@core/components/mui/TextField'
import CustomerAutocomplete from '@/components/customers/CustomerAutocomplete'
import AddCustomerDrawer, { initialFormData as invoiceAddInitialForm } from '@views/apps/invoice/add/AddCustomerDrawer'

// Styled Component Imports
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import OrderLineItems from '@views/apps/ecommerce/orders/edit/OrderLineItems'

const EditCard = ({ invoiceData, id, data }) => {
  // States
  const [selectData, setSelectData] = useState(data?.[0] || null)
  const [count, setCount] = useState(1)
  const [openAddCustomer, setOpenAddCustomer] = useState(false)
  const [newCustomerForm, setNewCustomerForm] = useState(invoiceAddInitialForm)

  const [lineItems, setLineItems] = useState(() => {
    try {
      if (!invoiceData?.lineItems) return []

      return Array.isArray(invoiceData.lineItems) ? invoiceData.lineItems : JSON.parse(invoiceData.lineItems)
    } catch {
      return []
    }
  })

  const toDate = v => {
    try {
      if (!v) return null
      const d = typeof v === 'string' || typeof v === 'number' ? new Date(v) : v

      return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null
    } catch {
      return null
    }
  }

  // Use actual invoice fields (date/dueDate) and allow null values for react-datepicker
  const [issueDate, setIssueDate] = useState(toDate(invoiceData?.date))
  const [dueDate, setDueDate] = useState(toDate(invoiceData?.dueDate))

  // Hooks
  const isBelowMdScreen = useMediaQuery(theme => theme.breakpoints.down('md'))

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
              <div className='p-6 rounded bg-actionHover'>
                <div className='flex justify-between gap-4 flex-col sm:flex-row'>
                  <div className='flex flex-col gap-6'>
                    <div className='flex items-center gap-2.5'>
                      <Logo />
                    </div>
                    <div>
                      <Typography color='text.primary'>Office 149, KICC </Typography>
                      <Typography color='text.primary'>Nairobi, </Typography>
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
                        value={id}
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
                        selected={issueDate}
                        id='payment-date'
                        onChange={date => date !== null && setIssueDate(date)}
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
                        id='payment-date'
                        onChange={date => date !== null && setDueDate(date)}
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
                  <div className='w-[640px] max-w-full'>
                    <CustomerAutocomplete
                      sx={{ width: 640 }}
                      dropdownWidth={640}
                      onSelect={cust => {
                        setSelectData({
                          id: cust.id,
                          firstName: cust.firstName,
                          lastName: cust.lastName,
                          email: cust.email,
                          billingAddress: cust.billingAddress || null
                        })
                      }}
                      onAddNew={() => {
                        setNewCustomerForm(invoiceAddInitialForm)
                        setOpenAddCustomer(true)
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
                    ) : null}
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
            {/* Line Items (Products only) */}
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
                  <CustomTextField defaultValue='Thanks for your business' />
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
    </>
  )
}

export default EditCard
