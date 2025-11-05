'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Button from '@mui/material/Button'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

const ChangePassword = ({ userData }) => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [isConfirmPasswordShown, setIsConfirmPasswordShown] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  return (
    <Card>
      <CardHeader title='Change Password' />
      <CardContent className='flex flex-col gap-4'>
        <Alert icon={false} severity='warning' onClose={() => {}}>
          <AlertTitle>Ensure that these requirements are met</AlertTitle>
          Minimum 8 characters long, uppercase & symbol
        </Alert>
        <form
          onSubmit={async e => {
            e.preventDefault()
            setMessage('')
            setError('')
            if (submitting) return
            const pwd = (password || '').trim()
            const conf = (confirm || '').trim()
            if (!pwd || pwd.length < 8) {
              setError('Password must be at least 8 characters')
              return
            }
            if (pwd !== conf) {
              setError('Passwords do not match')
              return
            }

            try {
              setSubmitting(true)
              const id = userData?.wooId || userData?.id

              if (!id) {
                setError('Missing customer id')
                setSubmitting(false)

                return
              }

              const res = await fetch('/api/customers/password/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerId: Number(id), newPassword: pwd })
              })

              const json = await res.json()

              if (!json.ok) throw new Error(json.error || 'Failed to update password')
              setMessage('Password updated successfully')
              setPassword('')
              setConfirm('')
            } catch (e) {
              setError(e?.message || 'Failed to update password')
            } finally {
              setSubmitting(false)
            }
          }}
        >
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label='Password'
                type={isPasswordShown ? 'text' : 'password'}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton
                          edge='end'
                          onClick={() => setIsPasswordShown(!isPasswordShown)}
                          onMouseDown={e => e.preventDefault()}
                        >
                          <i className={isPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                        </IconButton>
                      </InputAdornment>
                    )
                  }
                }}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label='Confirm Password'
                type={isConfirmPasswordShown ? 'text' : 'password'}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton
                          edge='end'
                          onClick={() => setIsConfirmPasswordShown(!isConfirmPasswordShown)}
                          onMouseDown={e => e.preventDefault()}
                        >
                          <i className={isConfirmPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                        </IconButton>
                      </InputAdornment>
                    )
                  }
                }}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
              />
            </Grid>

            {message ? (
              <Grid size={12}>
                <Alert severity='success'>{message}</Alert>
              </Grid>
            ) : null}
            {error ? (
              <Grid size={12}>
                <Alert severity='error'>{error}</Alert>
              </Grid>
            ) : null}
            <Grid size={{ xs: 12 }} className='flex gap-4'>
              <Button variant='contained' type='submit' disabled={submitting}>
                Change Password
              </Button>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  )
}

export default ChangePassword
