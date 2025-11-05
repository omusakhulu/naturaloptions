'use client'

import { useState } from 'react'

import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

import { useForm, Controller } from 'react-hook-form'

import CustomTextField from '@core/components/mui/TextField'

export default function AddAttributeDrawer({ open, onClose, onSaved }) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: { name: '', slug: '', type: 'select', order_by: 'menu_order', has_archives: false }
  })

  const [submitting, setSubmitting] = useState(false)

  const handleReset = () => {
    reset({ name: '', slug: '', type: 'select', order_by: 'menu_order', has_archives: false })
    onClose?.()
  }

  const onSubmit = async values => {
    try {
      setSubmitting(true)

      const res = await fetch('/api/woocommerce/attributes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })

      const json = await res.json().catch(() => ({}))

      if (!res.ok || !json?.success) throw new Error(json?.error || `Failed (${res.status})`)
      onSaved?.()
      handleReset()
    } catch (e) {
      console.error('Failed to create attribute', e)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={handleReset}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 320, sm: 420 } } }}
    >
      <div className='flex items-center justify-between pli-6 plb-5'>
        <Typography variant='h5'>Add Attribute</Typography>
        <IconButton size='small' onClick={handleReset}>
          <i className='tabler-x text-textSecondary text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <div className='p-6'>
        <Box
          component='form'
          onSubmit={handleSubmit(onSubmit)}
          className='flex flex-col gap-5'
          sx={{ '& > *': { p: 2 } }}
        >
          <Controller
            name='name'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='Name'
                placeholder='Color'
                {...(errors.name && { error: true, helperText: 'Required' })}
              />
            )}
          />
          <Controller
            name='slug'
            control={control}
            render={({ field }) => <CustomTextField {...field} fullWidth label='Slug' placeholder='color' />}
          />
          <Controller
            name='type'
            control={control}
            render={({ field }) => (
              <CustomTextField {...field} select fullWidth label='Type'>
                <option value='select'>select</option>
                <option value='text'>text</option>
              </CustomTextField>
            )}
          />
          <Controller
            name='order_by'
            control={control}
            render={({ field }) => (
              <CustomTextField {...field} select fullWidth label='Order By'>
                <option value='menu_order'>menu_order</option>
                <option value='name'>name</option>
                <option value='name_num'>name_num</option>
                <option value='id'>id</option>
              </CustomTextField>
            )}
          />
          <Controller
            name='has_archives'
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Checkbox checked={field.value} onChange={e => field.onChange(e.target.checked)} />}
                label='Enable archives'
              />
            )}
          />

          <div className='flex gap-3'>
            <Button type='submit' variant='contained' disabled={submitting}>
              {submitting ? 'Saving...' : 'Save'}
            </Button>
            <Button variant='tonal' color='secondary' onClick={handleReset}>
              Cancel
            </Button>
          </div>
        </Box>
      </div>
    </Drawer>
  )
}
