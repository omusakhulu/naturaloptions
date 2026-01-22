'use client'

// Next Imports
import { useParams } from 'next/navigation'

// MUI Imports
import { styled, useTheme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

// Component Imports
import Logo from '@components/layout/shared/Logo'
import LoginForm from '@/components/auth/LoginForm'

// Config Imports
import themeConfig from '@configs/themeConfig'

// Hook Imports
import { useImageVariant } from '@core/hooks/useImageVariant'

// Styled Custom Components
const LoginIllustration = styled('img')(({ theme }) => ({
  zIndex: 2,
  height: 'auto',
  maxHeight: 680,
  maxWidth: '100%',
  margin: theme.spacing(12),
  [theme.breakpoints.down(1536)]: {
    maxHeight: 550
  },
  [theme.breakpoints.down('lg')]: {
    maxHeight: 450
  }
}))

const MaskImg = styled('img')({
  height: 'auto',
  maxHeight: 355,
  width: '100%',
  position: 'absolute',
  bottom: 0,
  zIndex: -1
})

const Login = ({ mode = 'light' }) => {
  // Vars
  const darkImg = '/images/pages/auth-mask-dark.png'
  const lightImg = '/images/pages/auth-mask-light.png'
  const darkIllustration = '/images/illustrations/auth/v2-login-dark.png'
  const lightIllustration = '/images/illustrations/auth/v2-login-light.png'
  const borderedDarkIllustration = '/images/illustrations/auth/v2-login-dark-border.png'
  const borderedLightIllustration = '/images/illustrations/auth/v2-login-light-border.png'

  // Hooks
  const { lang: locale } = useParams()
  const theme = useTheme()
  
  // Get the appropriate background and illustration based on the theme mode
  const authBackground = useImageVariant(mode, lightImg, darkImg)
  const characterIllustration = useImageVariant(
    mode,
    lightIllustration,
    darkIllustration,
    borderedLightIllustration,
    borderedDarkIllustration
  )

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100%' }}>
      {/* Left side - Illustration */}
      <Box 
        sx={{ 
          display: { xs: 'none', md: 'flex' },
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: 'background.default'
        }}
      >
        <LoginIllustration 
          src={characterIllustration} 
          alt='Login illustration' 
        />
        <MaskImg alt='mask' src={authBackground} />
      </Box>

      {/* Right side - Login Form */}
      <Box 
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          width: { xs: '100%', md: '480px' },
          padding: { xs: 4, md: 8 },
          backgroundColor: 'background.paper',
          position: 'relative'
        }}
      >
        <Box sx={{ position: 'absolute', top: 24, left: 24 }}>
          <Logo />
        </Box>
        
        <Box sx={{ maxWidth: 400, width: '100%', margin: '0 auto' }}>
          <Typography 
            variant='h4' 
            component='h1' 
            sx={{ 
              textAlign: 'center',
              fontWeight: 600,
              mb: 2
            }}
          >
            Welcome to {themeConfig.templateName}!
          </Typography>
          
          <Typography 
            variant='body1' 
            sx={{ 
              textAlign: 'center',
              color: 'text.secondary',
              mb: 6
            }}
          >
            Please sign-in to your account and start the adventure
          </Typography>
          
          {/* Login Form Component */}
          <LoginForm />
          
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant='body2' sx={{ color: 'text.secondary' }}>
              New on our platform?{' '}
              <Typography 
                component='a' 
                href='/register' 
                sx={{ 
                  color: 'primary.main',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                Create an account
              </Typography>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default Login
