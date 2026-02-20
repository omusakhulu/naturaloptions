'use client'

import { useTheme } from '@mui/material/styles'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import LinearProgress from '@mui/material/LinearProgress'

const formatKSh = value => {
  const num = Number(value) || 0

  if (num >= 1000000) return `KSh ${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `KSh ${(num / 1000).toFixed(1)}k`

  return `KSh ${num.toLocaleString('en-KE')}`
}

const StatCard = ({ icon, title, value, subtitle, color = 'primary' }) => {
  const theme = useTheme()

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 1,
        backgroundColor: 'var(--mui-palette-action-hover)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 1
      }}
    >
      <Box display='flex' alignItems='center' gap={1.5}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: `${color}.main`,
            color: 'white'
          }}
        >
          <i className={icon} style={{ fontSize: '1.125rem' }} />
        </Box>
        <Typography variant='caption' color='text.secondary' sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
          {title}
        </Typography>
      </Box>
      <Typography variant='h5' fontWeight={700} color='text.primary'>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant='caption' color='text.disabled'>
          {subtitle}
        </Typography>
      )}
    </Box>
  )
}

const ProgressOverview = ({ target, progress }) => {
  const theme = useTheme()

  if (!target || !progress) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardHeader title='Progress Overview' />
        <CardContent
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}
        >
          <Typography variant='body2' color='text.secondary'>
            Set a target to see your progress
          </Typography>
        </CardContent>
      </Card>
    )
  }

  const {
    achieved = 0,
    remaining = 0,
    dailyRequired = 0,
    dailyAverage = 0,
    percentComplete = 0,
    daysElapsed = 0,
    daysRemaining = 0,
    daysInMonth = 30
  } = progress

  const progressBarColor =
    percentComplete >= 80 ? 'success' : percentComplete >= 50 ? 'warning' : 'error'

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title='Progress Overview'
        subheader={`Day ${daysElapsed} of ${daysInMonth}`}
      />
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Progress bar */}
        <Box>
          <Box display='flex' justifyContent='space-between' mb={1}>
            <Typography variant='body2' color='text.secondary'>
              {formatKSh(achieved)} of {formatKSh(target.revenueTarget)}
            </Typography>
            <Typography variant='body2' fontWeight={600} color={`${progressBarColor}.main`}>
              {Math.round(percentComplete)}%
            </Typography>
          </Box>
          <LinearProgress
            variant='determinate'
            value={Math.min(percentComplete, 100)}
            color={progressBarColor}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {/* 2x2 KPI grid */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 6 }}>
            <StatCard
              icon='tabler-trending-up'
              title='Achieved'
              value={formatKSh(achieved)}
              subtitle={`${Math.round(percentComplete)}% of target`}
              color='success'
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <StatCard
              icon='tabler-clock'
              title='Remaining'
              value={formatKSh(remaining)}
              subtitle={`${daysRemaining} days left`}
              color='warning'
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <StatCard
              icon='tabler-chart-arrows-vertical'
              title='Need Daily'
              value={`${formatKSh(dailyRequired)}/day`}
              subtitle='To hit target'
              color='info'
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <StatCard
              icon='tabler-chart-line'
              title='Daily Average'
              value={`${formatKSh(dailyAverage)}/day`}
              subtitle={dailyAverage >= dailyRequired ? 'Ahead of pace' : 'Below pace'}
              color='secondary'
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default ProgressOverview
