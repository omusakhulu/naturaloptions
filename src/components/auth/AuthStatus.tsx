'use client'

import { useSession, signOut } from 'next-auth/react'
import { Button, Typography, Box, Chip } from '@mui/material'

export default function AuthStatus() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <Typography>Loading...</Typography>
  }

  if (!session) {
    return (
      <Box>
        <Chip label="Not Authenticated" color="error" />
        <Typography variant="body2" sx={{ mt: 1 }}>
          You should be redirected to login...
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Chip label="Authenticated" color="success" sx={{ mb: 2 }} />
      <Typography variant="h6">Welcome, {session.user?.name || session.user?.email}!</Typography>
      <Typography variant="body2" color="text.secondary">
        Role: {(session.user as any)?.role || 'USER'}
      </Typography>
      <Button 
        variant="outlined" 
        color="error" 
        size="small" 
        sx={{ mt: 2 }}
        onClick={() => signOut({ callbackUrl: '/en/login' })}
      >
        Logout
      </Button>
    </Box>
  )
}
