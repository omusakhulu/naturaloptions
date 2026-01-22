'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, Typography, Button, Box, Chip } from '@mui/material'

export default function TestAuthPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  return (
    <Box sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            🔒 Authentication Test Page
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6">Session Status:</Typography>
            <Chip 
              label={status} 
              color={status === 'authenticated' ? 'success' : status === 'loading' ? 'warning' : 'error'} 
              sx={{ mt: 1 }}
            />
          </Box>

          {status === 'loading' && (
            <Typography>Loading session...</Typography>
          )}

          {status === 'unauthenticated' && (
            <Box>
              <Typography color="error" gutterBottom>
                ❌ You are NOT authenticated! 
              </Typography>
              <Typography variant="body2" gutterBottom>
                If you can see this page, the middleware is NOT working correctly.
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => router.push('/en/login')}
                sx={{ mt: 2 }}
              >
                Go to Login
              </Button>
            </Box>
          )}

          {status === 'authenticated' && session && (
            <Box>
              <Typography color="success.main" gutterBottom>
                ✅ Authentication working correctly!
              </Typography>
              <Typography variant="body1">
                <strong>User:</strong> {session.user?.email}
              </Typography>
              <Typography variant="body1">
                <strong>Name:</strong> {session.user?.name || 'Not provided'}
              </Typography>
              <Typography variant="body1">
                <strong>Role:</strong> {(session.user as any)?.role || 'USER'}
              </Typography>
              
              <Button 
                variant="contained" 
                onClick={() => router.push('/en/dashboard')}
                sx={{ mt: 2, mr: 2 }}
              >
                Go to Dashboard
              </Button>
              
              <Button 
                variant="outlined" 
                onClick={() => router.push('/en/login')}
                sx={{ mt: 2 }}
              >
                Go to Login (should redirect back)
              </Button>
            </Box>
          )}

          <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Test Instructions:</strong><br/>
              1. If you're not logged in, you should NOT be able to see this page<br/>
              2. The middleware should redirect you to /en/login immediately<br/>
              3. If you can see this page without being logged in, the authentication is broken
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
