'use client'

import { useEffect, useState } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'

import { useForm, Controller } from 'react-hook-form'

import CustomTextField from '@core/components/mui/TextField'

export default function ManageTermsDialog({ attribute, onClose }) {
  const open = !!attribute
  const [loading, setLoading] = useState(false)
  const [terms, setTerms] = useState([])

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({ defaultValues: { name: '', slug: '', description: '' } })

  const [submitting, setSubmitting] = useState(false)

  const loadTerms = async () => {
    if (!attribute?.id) return

    try {
      setLoading(true)
      const res = await fetch(`/api/woocommerce/attributes/${attribute.id}/terms`, { cache: 'no-store' })
      const json = await res.json()

      if (!res.ok || !json?.success) throw new Error(json?.error || `API ${res.status}`)
      setTerms(Array.isArray(json.terms) ? json.terms : [])
    } catch (e) {
      console.error('Failed to load terms', e)
      setTerms([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reset({ name: '', slug: '', description: '' })
    if (open) loadTerms()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, attribute?.id])

  const onSubmit = async values => {
    try {
      setSubmitting(true)

      const res = await fetch(`/api/woocommerce/attributes/${attribute.id}/terms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })

      const json = await res.json().catch(() => ({}))

      if (!res.ok || !json?.success) throw new Error(json?.error || `Failed (${res.status})`)
      reset({ name: '', slug: '', description: '' })
      loadTerms()
    } catch (e) {
      console.error('Failed to create term', e)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
      <DialogTitle>Manage Terms {attribute ? `— ${attribute.name}` : ''}</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {terms.length === 0 ? (
              <Typography color='text.secondary'>No terms yet.</Typography>
            ) : (
              <Box>
                {terms.map(t => (
                  <Box
                    key={t.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      py: 1,
                      borderBottom: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <Typography>{t.name}</Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {t.slug}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}

            <Box component='form' onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2, display: 'grid', gap: 2 }}>
              <Controller
                name='name'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    label='Name'
                    fullWidth
                    {...(errors.name && { error: true, helperText: 'Required' })}
                  />
                )}
              />
              <Controller
                name='slug'
                control={control}
                render={({ field }) => <CustomTextField {...field} label='Slug' fullWidth />}
              />
              <Controller
                name='description'
                control={control}
                render={({ field }) => (
                  <CustomTextField {...field} label='Description' fullWidth multiline minRows={2} />
                )}
              />
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <Button type='submit' variant='contained' disabled={submitting}>
                  {submitting ? 'Saving...' : 'Add Term'}
                </Button>
                <Button
                  variant='tonal'
                  color='secondary'
                  onClick={() => reset({ name: '', slug: '', description: '' })}
                >
                  Reset
                </Button>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}
