// React Imports
import { useState, useRef, useEffect } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import InputAdornment from '@mui/material/InputAdornment'
import Box from '@mui/material/Box'

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'

// Components Imports
import CustomTextField from '@core/components/mui/TextField'

const AddCategoryDrawer = props => {
  // Props
  const { open, handleClose, categoryData, setData, editingCategory, onSaved } = props

  // States
  const [fileName, setFileName] = useState('')
  const [parentId, setParentId] = useState('')
  const [comment, setComment] = useState('')
  const [status, setStatus] = useState('')

  // Refs
  const fileInputRef = useRef(null)

  // Hooks
  const {
    control,
    reset: resetForm,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm({
    defaultValues: {
      title: '',
      description: ''
    }
  })

  // Populate form when editing
  useEffect(() => {
    if (editingCategory) {
      setValue('title', editingCategory.name || '')
      setValue('description', editingCategory.description || '')
      setParentId(
        Number.isInteger(editingCategory.parent) && editingCategory.parent > 0 ? String(editingCategory.parent) : ''
      )
    } else {
      resetForm({ title: '', description: '' })
      setParentId('')
    }
  }, [editingCategory, open, setValue, resetForm])

  // Handle Form Submit
  const handleFormSubmit = async formValues => {
    try {
      if (editingCategory) {
        // Update category in WooCommerce
        const payload = {
          name: formValues.title,
          description: formValues.description
        }

        if (parentId) payload.parent = Number(parentId)

        const res = await fetch(`/api/woocommerce/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        const json = await res.json().catch(() => ({}))

        if (!res.ok || !json?.success) throw new Error(json?.error || `Failed to update category (${res.status})`)

        // Refresh from source
        if (typeof onSaved === 'function') onSaved()
        handleReset()

        return
      }

      const payload = {
        name: formValues.title,
        description: formValues.description,
        ...(parentId ? { parent: Number(parentId) } : {})
      }

      const res = await fetch('/api/woocommerce/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const json = await res.json().catch(() => ({}))

      if (!res.ok || !json?.success) throw new Error(json?.error || `Failed to create category (${res.status})`)

      if (typeof onSaved === 'function') onSaved()
      handleReset()
    } catch (e) {
      console.error('Failed to create category:', e)
    }
  }

  // Handle Form Reset
  const handleReset = () => {
    handleClose()
    resetForm({ title: '', description: '' })
    setFileName('')
    setParentId('')
    setComment('')
    setStatus('')
  }

  // Handle File Upload
  const handleFileUpload = event => {
    const { files } = event.target

    if (files && files.length !== 0) {
      setFileName(files[0].name)
    }
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
        <Typography variant='h5'>{editingCategory ? 'Edit Category' : 'Add Category'}</Typography>
        <IconButton size='small' onClick={handleReset}>
          <i className='tabler-x text-textSecondary text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <div className='p-6'>
        <Box
          component='form'
          onSubmit={handleSubmit(data => handleFormSubmit(data))}
          className='flex flex-col gap-5'
          sx={{ '& > *': { p: 2 } }}
        >
          <Controller
            name='title'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='Title'
                placeholder='Fashion'
                {...(errors.title && { error: true, helperText: 'This field is required.' })}
              />
            )}
          />
          <Controller
            name='description'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='Description'
                placeholder='Enter a description...'
                {...(errors.description && { error: true, helperText: 'This field is required.' })}
              />
            )}
          />
          <div className='flex items-end gap-4'>
            <CustomTextField
              label='Attachment'
              placeholder='No file chosen'
              value={fileName}
              className='flex-auto'
              slotProps={{
                input: {
                  readOnly: true,
                  endAdornment: fileName ? (
                    <InputAdornment position='end'>
                      <IconButton size='small' edge='end' onClick={() => setFileName('')}>
                        <i className='tabler-x' />
                      </IconButton>
                    </InputAdornment>
                  ) : null
                }
              }}
            />
            <Button component='label' variant='tonal' htmlFor='contained-button-file' className='min-is-fit'>
              Choose
              <input hidden id='contained-button-file' type='file' onChange={handleFileUpload} ref={fileInputRef} />
            </Button>
          </div>
          <CustomTextField
            select
            fullWidth
            label='Parent Category'
            value={parentId}
            onChange={e => setParentId(e.target.value)}
          >
            <MenuItem value=''>None</MenuItem>
            {Array.isArray(categoryData) &&
              categoryData.length > 0 &&
              categoryData.map(cat => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
          </CustomTextField>
          <CustomTextField
            fullWidth
            label='Comment'
            value={comment}
            onChange={e => setComment(e.target.value)}
            multiline
            rows={4}
            placeholder='Write a Comment...'
          />
          <CustomTextField
            select
            fullWidth
            label='Category Status'
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            <MenuItem value='Published'>Published</MenuItem>
            <MenuItem value='Inactive'>Inactive</MenuItem>
            <MenuItem value='Scheduled'>Scheduled</MenuItem>
          </CustomTextField>
          <div className='flex items-center gap-4'>
            <Button variant='contained' type='submit'>
              {editingCategory ? 'Update' : 'Add'}
            </Button>
            <Button variant='tonal' color='error' type='reset' onClick={handleReset}>
              Discard
            </Button>
          </div>
        </Box>
      </div>
    </Drawer>
  )
}

export default AddCategoryDrawer
