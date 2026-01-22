'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // If session is not loading and user is not authenticated, redirect to login
    if (status !== 'loading' && !session) {
      console.log('🔒 AuthGuard: No session found, redirecting to login')
      router.push('/en/login')
    }
  }, [session, status, router])

  // Show loading while checking session
  if (status === 'loading') {
    return (
      fallback || (
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          minHeight="100vh"
        >
          <CircularProgress size={40} />
        </Box>
      )
    )
  }

  // Show children only if authenticated
  if (session) {
    return <>{children}</>
  }

  // Fallback while redirecting
  return (
    <Box 
      display="flex" 
      justifyContent="center" 
      alignItems="center" 
      minHeight="100vh"
    >
      <CircularProgress size={40} />
    </Box>
  )
}
