'use client'

import { useEffect } from 'react'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className='flex items-center justify-center min-h-screen p-4'>
      <Card className='max-w-md'>
        <CardContent className='flex flex-col items-center gap-4 p-8'>
          <i className='tabler-alert-circle text-6xl text-error' />
          <Typography variant='h4'>Dashboard Error</Typography>
          <Typography variant='body1' color='text.secondary' align='center'>
            {error?.message || 'Something went wrong loading the dashboard'}
          </Typography>
          <Button
            variant='contained'
            onClick={() => reset()}
            className='mt-4'
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
