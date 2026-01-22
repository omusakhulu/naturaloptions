'use client'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Skeleton from '@mui/material/Skeleton'
import Box from '@mui/material/Box'

const DashboardSkeleton = () => {
  return (
    <Grid container spacing={6}>
      {/* Shortcuts Skeleton */}
      <Grid size={12}>
        <Box className='flex gap-2'>
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} variant='rectangular' width={120} height={32} />
          ))}
        </Box>
      </Grid>

      {/* Period Buttons Skeleton */}
      <Grid size={12}>
        <Skeleton variant='rectangular' height={48} />
      </Grid>

      {/* Statistics Cards Skeleton */}
      <Grid size={12}>
        <Card>
          <CardContent>
            <Grid container spacing={6}>
              {[...Array(4)].map((_, i) => (
                <Grid size={3} key={i}>
                  <Skeleton variant='text' width='60%' />
                  <Skeleton variant='text' width='80%' height={40} />
                  <Skeleton variant='text' width='40%' />
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Charts Row */}
      <Grid size={6}>
        <Grid container spacing={6}>
          <Grid size={6}>
            <Card>
              <CardContent>
                <Skeleton variant='rectangular' height={200} />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={6}>
            <Card>
              <CardContent>
                <Skeleton variant='rectangular' height={200} />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={12}>
            <Card>
              <CardContent>
                <Skeleton variant='rectangular' height={200} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Grid>

      <Grid size={6}>
        <Card>
          <CardHeader title={<Skeleton width='40%' />} />
          <CardContent>
            <Skeleton variant='rectangular' height={300} />
          </CardContent>
        </Card>
      </Grid>

      {/* Section Title */}
      <Grid size={12}>
        <Skeleton variant='text' width='30%' height={40} />
      </Grid>

      {/* Cards Grid */}
      {[...Array(6)].map((_, i) => (
        <Grid size={{ sm: 12, md: 6, lg: 4 }} key={i}>
          <Card>
            <CardHeader title={<Skeleton width='60%' />} />
            <CardContent>
              <Skeleton variant='rectangular' height={150} />
              <Skeleton variant='text' className='mbs-2' />
              <Skeleton variant='text' width='80%' />
            </CardContent>
          </Card>
        </Grid>
      ))}

      {/* Table Skeleton */}
      <Grid size={12}>
        <Skeleton variant='text' width='30%' height={40} className='mbs-6' />
      </Grid>
      <Grid size={12}>
        <Card>
          <CardContent>
            {[...Array(5)].map((_, i) => (
              <Box key={i} className='flex items-center gap-4 pbs-3 pbe-3'>
                <Skeleton variant='circular' width={40} height={40} />
                <Box className='flex-1'>
                  <Skeleton variant='text' width='40%' />
                  <Skeleton variant='text' width='60%' />
                </Box>
                <Skeleton variant='rectangular' width={80} height={24} />
              </Box>
            ))}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default DashboardSkeleton
