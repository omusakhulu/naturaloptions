'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useTheme } from '@mui/material/styles'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import InputAdornment from '@mui/material/InputAdornment'
import Divider from '@mui/material/Divider'

import CustomTextField from '@core/components/mui/TextField'

const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

const TargetSettingCard = ({ target, progress, month, year, onTargetSaved }) => {
  const theme = useTheme()
  const [isEditing, setIsEditing] = useState(!target)
  const [revenueTarget, setRevenueTarget] = useState(target?.revenueTarget || '')
  const [notes, setNotes] = useState(target?.notes || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setRevenueTarget(target?.revenueTarget || '')
    setNotes(target?.notes || '')
    setIsEditing(!target)
  }, [target])

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      const response = await fetch('/api/sales-targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          revenueTarget: Number(revenueTarget),
          month,
          year,
          notes
        })
      })

      const data = await response.json()

      if (data.success) {
        setIsEditing(false)
        onTargetSaved()
      } else {
        setError(data.error || 'Failed to save target')
      }
    } catch (err) {
      setError('Failed to save target')
      console.error('Error saving target:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = () => {
    setRevenueTarget(target?.revenueTarget || '')
    setNotes(target?.notes || '')
    setIsEditing(true)
  }

  const handleCancel = () => {
    setRevenueTarget(target?.revenueTarget || '')
    setNotes(target?.notes || '')
    setIsEditing(false)
    setError(null)
  }

  const percentComplete = progress?.percentComplete || 0
  const daysRemaining = progress?.daysRemaining || 0
  const onTrack = progress?.onTrack || false

  const getProgressColor = percent => {
    if (percent >= 80) return theme.palette.success.main
    if (percent >= 50) return theme.palette.warning.main

    return theme.palette.error.main
  }

  const progressColor = getProgressColor(percentComplete)

  const chartOptions = {
    chart: { sparkline: { enabled: true } },
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        hollow: { size: '65%' },
        track: { background: 'var(--mui-palette-customColors-trackBg)' },
        dataLabels: {
          name: { show: false },
          value: {
            fontSize: '24px',
            fontWeight: 600,
            offsetY: -5,
            color: 'var(--mui-palette-text-primary)',
            formatter: val => `${Math.round(val)}%`
          }
        }
      }
    },
    colors: [progressColor],
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        shadeIntensity: 0.5,
        gradientToColors: [progressColor],
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 0.6,
        stops: [0, 100]
      }
    }
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title='Sales Target'
        action={
          !isEditing && target ? (
            <Button size='small' variant='text' onClick={handleEdit} startIcon={<i className='tabler-edit' />}>
              Edit
            </Button>
          ) : null
        }
      />
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {error && (
          <Alert severity='error' sx={{ mb: 1 }}>
            {error}
          </Alert>
        )}

        {!isEditing && target ? (
          <>
            {/* Target amount */}
            <Box textAlign='center'>
              <Typography variant='h4' color='primary' fontWeight={700}>
                KSh {Number(target.revenueTarget).toLocaleString('en-KE')}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Monthly target
              </Typography>
            </Box>

            <Divider />

            {/* Gauge */}
            {progress && (
              <Box textAlign='center'>
                <AppReactApexCharts
                  type='radialBar'
                  height={180}
                  series={[Math.min(Math.round(percentComplete), 100)]}
                  options={chartOptions}
                />
                <Box display='flex' justifyContent='center' alignItems='center' gap={2} mt={-2}>
                  <Typography variant='body2' color='text.secondary'>
                    {daysRemaining} days left
                  </Typography>
                  <Chip
                    label={onTrack ? 'On Track' : 'Behind'}
                    color={onTrack ? 'success' : 'error'}
                    size='small'
                    variant='tonal'
                  />
                </Box>
              </Box>
            )}

            {target.notes && (
              <>
                <Divider />
                <Box>
                  <Typography variant='caption' color='text.disabled' sx={{ textTransform: 'uppercase' }}>
                    Notes
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {target.notes}
                  </Typography>
                </Box>
              </>
            )}
          </>
        ) : (
          <Box display='flex' flexDirection='column' gap={3}>
            <CustomTextField
              fullWidth
              label='Revenue Target'
              type='number'
              value={revenueTarget}
              onChange={e => setRevenueTarget(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position='start'>KSh</InputAdornment>
                }
              }}
              placeholder='e.g. 500000'
            />

            <CustomTextField
              fullWidth
              label='Notes (Optional)'
              multiline
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder='Add any notes about this target...'
            />

            <Box display='flex' gap={2}>
              <Button fullWidth variant='contained' onClick={handleSave} disabled={!revenueTarget || saving}>
                {saving ? <CircularProgress size={20} /> : 'Save Target'}
              </Button>
              {target && (
                <Button fullWidth variant='outlined' onClick={handleCancel} disabled={saving}>
                  Cancel
                </Button>
              )}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default TargetSettingCard
