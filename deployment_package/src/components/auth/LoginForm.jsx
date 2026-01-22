'use client'

import { useState } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'

import { signIn } from 'next-auth/react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  TextField,
  Button,
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'

// Define validation schema
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional()
})

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const callbackUrl = searchParams.get('callbackUrl') || '/en/apps/ecommerce/dashboard'

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  })

  const onSubmit = async data => {
    setError('')
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
        callbackUrl
      })

      if (result?.error) {
        // Handle specific error cases
        if (result.error.includes('CredentialsSignin')) {
          setError('Invalid email or password')
        } else {
          setError(result.error || 'An error occurred during login')
        }
      } else {
        // Successful login - force a full page reload to ensure all auth state is updated
        window.location.href = callbackUrl
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <Box
      component='form'
      onSubmit={handleSubmit(onSubmit)}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        width: '100%',
        maxWidth: 400,
        margin: '0 auto',
        padding: 3
      }}
    >
      <Typography variant='h4' component='h1' gutterBottom>
        Sign In
      </Typography>

      {error && (
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Controller
        name='email'
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label='Email'
            type='email'
            fullWidth
            error={!!errors.email}
            helperText={errors.email?.message}
            disabled={isLoading}
          />
        )}
      />

      <Controller
        name='password'
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label='Password'
            type={showPassword ? 'text' : 'password'}
            fullWidth
            error={!!errors.password}
            helperText={errors.password?.message}
            disabled={isLoading}
            InputProps={{
              endAdornment: (
                <InputAdornment position='end'>
                  <IconButton onClick={togglePasswordVisibility} edge='end' disabled={isLoading}>
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        )}
      />

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%'
        }}
      >
        <Controller
          name='rememberMe'
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={<Checkbox {...field} checked={field.value} disabled={isLoading} />}
              label='Remember me'
            />
          )}
        />

        <Button type='button' color='primary' disabled={isLoading} onClick={() => router.push('/en/forgot-password')}>
          Forgot password?
        </Button>
      </Box>

      <Button
        type='submit'
        variant='contained'
        color='primary'
        fullWidth
        disabled={isLoading}
        startIcon={isLoading && <CircularProgress size={20} />}
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </Button>
    </Box>
  )
}
