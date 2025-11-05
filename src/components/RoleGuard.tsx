'use client'

import { ReactNode } from 'react'

import { useRouter } from 'next/navigation'

import { useSession } from 'next-auth/react'

import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'

import { checkRole, UserRole } from '@/lib/auth-utils'

interface RoleGuardProps {
  children: ReactNode
  allowedRoles: UserRole[]
  fallback?: ReactNode
  redirectTo?: string
}

export function RoleGuard({ children, allowedRoles, fallback, redirectTo }: RoleGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Loading state
  if (status === 'loading') {
    return (
      <Box display='flex' alignItems='center' justifyContent='center' minHeight='400px'>
        <CircularProgress />
      </Box>
    )
  }

  // Not authenticated
  if (status === 'unauthenticated') {
    if (redirectTo) {
      router.push(redirectTo)

      return null
    }

    return (
      <Box display='flex' flexDirection='column' alignItems='center' justifyContent='center' minHeight='400px' gap={2}>
        <Typography variant='h5'>Authentication Required</Typography>
        <Typography color='text.secondary'>Please login to access this page</Typography>
        <Button variant='contained' onClick={() => router.push('/login')}>
          Go to Login
        </Button>
      </Box>
    )
  }

  // Check role authorization
  if (!checkRole(session, allowedRoles)) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <Box display='flex' flexDirection='column' alignItems='center' justifyContent='center' minHeight='400px' gap={2}>
        <Typography variant='h5'>Access Denied</Typography>
        <Typography color='text.secondary'>You don&apos;t have permission to access this page</Typography>
        <Typography variant='body2' color='text.secondary'>
          Required role: {allowedRoles.join(' or ')}
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Your role: {session?.user?.role}
        </Typography>
        <Button variant='outlined' onClick={() => router.back()}>
          Go Back
        </Button>
      </Box>
    )
  }

  // Authorized - render children
  return <>{children}</>
}

// HOC version for wrapping components
export function withRoleGuard<P extends object>(Component: React.ComponentType<P>, allowedRoles: UserRole[]) {
  return function GuardedComponent(props: P) {
    return (
      <RoleGuard allowedRoles={allowedRoles}>
        <Component {...props} />
      </RoleGuard>
    )
  }
}
