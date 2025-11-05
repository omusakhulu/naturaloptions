'use client'

// React Imports
import { useState, useEffect } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

// NextAuth Imports
import { signIn, getSession } from 'next-auth/react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Divider from '@mui/material/Divider'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

// Component Imports
import Logo from '@components/layout/shared/Logo'
import CustomTextField from '@core/components/mui/TextField'

// Config Imports
import themeConfig from '@configs/themeConfig'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

// Styled Component Imports
import AuthIllustrationWrapper from './AuthIllustrationWrapper'

const LoginV1 = () => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Hooks
  const { lang: locale } = useParams()
  const router = useRouter()
  const handleClickShowPassword = () => setIsPasswordShown(show => !show)

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession()
      if (session) {
        router.push(getLocalizedUrl(themeConfig.homePageUrl, locale))
      }
    }
    checkSession()
  }, [router, locale])

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      })

      if (result?.error) {
        setError(result.error)
      } else if (result?.ok) {
        // Success - redirect to dashboard
        router.push(getLocalizedUrl(themeConfig.homePageUrl, locale))
        router.refresh()
      }
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Handle Google sign-in
  const handleGoogleSignIn = async () => {
    try {
      await signIn('google', {
        callbackUrl: getLocalizedUrl(themeConfig.homePageUrl, locale)
      })
    } catch (error) {
      console.error('Google sign-in error:', error)
      setError('Failed to sign in with Google')
    }
  }

  return (
    <AuthIllustrationWrapper>
      <Card className='flex flex-col sm:is-[450px]'>
        <CardContent className='sm:!p-12'>
          <Link href={getLocalizedUrl('/', locale)} className='flex justify-center mbe-6'>
            <Logo />
          </Link>
          <div className='flex flex-col gap-1 mbe-6'>
            <Typography variant='h4'>{`Welcome to ${themeConfig.templateName}! 👋🏻`}</Typography>
            <Typography>Please sign-in to your account and start the adventure</Typography>
          </div>
          <form noValidate autoComplete='off' onSubmit={handleSubmit} className='flex flex-col gap-6'>
            {error && (
              <Alert severity='error' className='mb-4'>
                {error}
              </Alert>
            )}
            <CustomTextField 
              autoFocus 
              fullWidth 
              label='Email' 
              placeholder='Enter your email'
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <CustomTextField
              fullWidth
              label='Password'
              placeholder='············'
              id='outlined-adornment-password'
              type={isPasswordShown ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton edge='end' onClick={handleClickShowPassword} onMouseDown={e => e.preventDefault()}>
                        <i className={isPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
            />
            <div className='flex justify-between items-center gap-x-3 gap-y-1 flex-wrap'>
              <FormControlLabel 
                control={
                  <Checkbox 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                } 
                label='Remember me' 
              />
              <Typography
                className='text-end'
                color='primary.main'
                component={Link}
                href={getLocalizedUrl('/pages/auth/forgot-password-v1', locale)}
              >
                Forgot password?
              </Typography>
            </div>
            <Button 
              fullWidth 
              variant='contained' 
              type='submit'
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color='inherit' /> : null}
            >
              {loading ? 'Signing in...' : 'Login'}
            </Button>
            <div className='flex justify-center items-center flex-wrap gap-2'>
              <Typography>New on our platform?</Typography>
              <Typography
                component={Link}
                href={getLocalizedUrl('/pages/auth/register-v1', locale)}
                color='primary.main'
              >
                Create an account
              </Typography>
            </div>
            <Divider className='gap-2 text-textPrimary'>or</Divider>
            <div className='flex justify-center items-center gap-1.5'>
              <IconButton className='text-facebook' size='small' disabled>
                <i className='tabler-brand-facebook-filled' />
              </IconButton>
              <IconButton className='text-twitter' size='small' disabled>
                <i className='tabler-brand-twitter-filled' />
              </IconButton>
              <IconButton className='text-textPrimary' size='small' disabled>
                <i className='tabler-brand-github-filled' />
              </IconButton>
              <IconButton 
                className='text-error' 
                size='small'
                onClick={handleGoogleSignIn}
                disabled={loading}
                title='Sign in with Google'
              >
                <i className='tabler-brand-google-filled' />
              </IconButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </AuthIllustrationWrapper>
  )
}

export default LoginV1
