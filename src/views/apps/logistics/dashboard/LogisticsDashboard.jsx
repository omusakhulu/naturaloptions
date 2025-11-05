'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import CircularProgress from '@mui/material/CircularProgress'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'

// Component Imports
import DeliveryCalendar from './DeliveryCalendar'
import FleetStatCard from './FleetStatCard'

const LogisticsDashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/logistics/dashboard/stats')
      const data = await response.json()

      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching logistics stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='400px'>
        <CircularProgress />
      </Box>
    )
  }

  const getDriverStatusColor = status => {
    switch (status) {
      case 'AVAILABLE':
        return 'success'
      case 'ON_DELIVERY':
        return 'info'
      case 'OFF_DUTY':
        return 'default'
      case 'ON_LEAVE':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getDeliveryStatusColor = status => {
    switch (status) {
      case 'SCHEDULED':
        return 'info'
      case 'IN_PROGRESS':
        return 'warning'
      case 'COMPLETED':
        return 'success'
      case 'CANCELLED':
        return 'error'
      case 'DELAYED':
        return 'error'
      default:
        return 'default'
    }
  }

  const getPriorityColor = priority => {
    switch (priority) {
      case 'URGENT':
        return 'error'
      case 'HIGH':
        return 'warning'
      case 'NORMAL':
        return 'info'
      case 'LOW':
        return 'default'
      default:
        return 'default'
    }
  }

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = dateString => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Grid container spacing={2} size={12}>
      {/* Header */}
      <Grid item size={12}>
        <Box size={6} display='flex' justifyContent='space-between' alignItems='center'>
          <div>
            <Typography variant='h4' fontWeight='bold'>
              Logistics Dashboard
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Fleet management, driver scheduling & delivery tracking
            </Typography>
          </div>
          <Button variant='outlined' onClick={fetchStats}>
            <i className='tabler-refresh' style={{ marginRight: 8 }} />
            Refresh
          </Button>
        </Box>
      </Grid>

      {/* Fleet Statistics Cards */}
      <Grid item size={3} spacing={2}>
        <FleetStatCard
          title='Total Drivers'
          value={stats?.fleet.totalDrivers || 0}
          subtitle={`${stats?.fleet.availableDrivers || 0} available`}
          icon='tabler-users'
          color='primary'
        />
      </Grid>
      <Grid item size={3} sm={6} md={3}>
        <FleetStatCard
          title='Total Vehicles'
          value={stats?.fleet.totalVehicles || 0}
          subtitle={`${stats?.fleet.availableVehicles || 0} available`}
          icon='tabler-truck'
          color='success'
        />
      </Grid>
      <Grid item size={3} sm={6} md={3}>
        <FleetStatCard
          title='Today Deliveries'
          value={stats?.deliveries.today || 0}
          subtitle={`${stats?.deliveries.completedToday || 0} completed`}
          icon='tabler-package'
          color='warning'
        />
      </Grid>
      <Grid item size={3} sm={6} md={3}>
        <FleetStatCard
          title='This Week'
          value={stats?.deliveries.thisWeek || 0}
          subtitle={`${stats?.deliveries.completedThisWeek || 0} completed`}
          icon='tabler-calendar-week'
          color='info'
        />
      </Grid>

      {/* Fleet Utilization */}
      <Grid item size={6}>
        <Card>
          <CardHeader title='Fleet Utilization' />
          <CardContent>
            <Box mb={4}>
              <Box display='flex' justifyContent='space-between' mb={1}>
                <Typography variant='body2'>Drivers</Typography>
                <Typography variant='body2' fontWeight='bold'>
                  {stats?.fleet.utilization.drivers || 0}%
                </Typography>
              </Box>
              <Box
                sx={{
                  height: 8,
                  backgroundColor: 'grey.200',
                  borderRadius: 1,
                  overflow: 'hidden'
                }}
              >
                <Box
                  sx={{
                    height: '100%',
                    width: `${stats?.fleet.utilization.drivers || 0}%`,
                    backgroundColor: 'primary.main',
                    transition: 'width 0.3s ease'
                  }}
                />
              </Box>
              <Box display='flex' gap={2} mt={2}>
                <Chip label={`${stats?.fleet.onDeliveryDrivers || 0} On Delivery`} size='small' color='info' />
                <Chip label={`${stats?.fleet.availableDrivers || 0} Available`} size='small' color='success' />
              </Box>
            </Box>

            <Box>
              <Box display='flex' justifyContent='space-between' mb={1}>
                <Typography variant='body2'>Vehicles</Typography>
                <Typography variant='body2' fontWeight='bold'>
                  {stats?.fleet.utilization.vehicles || 0}%
                </Typography>
              </Box>
              <Box
                sx={{
                  height: 8,
                  backgroundColor: 'grey.200',
                  borderRadius: 1,
                  overflow: 'hidden'
                }}
              >
                <Box
                  sx={{
                    height: '100%',
                    width: `${stats?.fleet.utilization.vehicles || 0}%`,
                    backgroundColor: 'success.main',
                    transition: 'width 0.3s ease'
                  }}
                />
              </Box>
              <Box display='flex' gap={2} mt={2}>
                <Chip label={`${stats?.fleet.vehiclesInUse || 0} In Use`} size='small' color='info' />
                <Chip label={`${stats?.fleet.availableVehicles || 0} Available`} size='small' color='success' />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Delivery Status Overview */}
      <Grid item size={6} md={6}>
        <Card>
          <CardHeader title='Delivery Status Overview' />
          <CardContent>
            <Box display='flex' flexDirection='column' gap={3}>
              <Box display='flex' justifyContent='space-between' alignItems='center'>
                <Box display='flex' alignItems='center' gap={2}>
                  <Avatar sx={{ bgcolor: 'info.light', width: 40, height: 40 }}>
                    <i className='tabler-calendar-clock' />
                  </Avatar>
                  <div>
                    <Typography variant='body2' color='text.secondary'>
                      Scheduled
                    </Typography>
                    <Typography variant='h6'>{stats?.deliveries.scheduled || 0}</Typography>
                  </div>
                </Box>
              </Box>

              <Box display='flex' justifyContent='space-between' alignItems='center'>
                <Box display='flex' alignItems='center' gap={2}>
                  <Avatar sx={{ bgcolor: 'warning.light', width: 40, height: 40 }}>
                    <i className='tabler-truck-delivery' />
                  </Avatar>
                  <div>
                    <Typography variant='body2' color='text.secondary'>
                      In Progress
                    </Typography>
                    <Typography variant='h6'>{stats?.deliveries.inProgress || 0}</Typography>
                  </div>
                </Box>
              </Box>

              <Box display='flex' justifyContent='space-between' alignItems='center'>
                <Box display='flex' alignItems='center' gap={2}>
                  <Avatar sx={{ bgcolor: 'success.light', width: 40, height: 40 }}>
                    <i className='tabler-circle-check' />
                  </Avatar>
                  <div>
                    <Typography variant='body2' color='text.secondary'>
                      Completed Today
                    </Typography>
                    <Typography variant='h6'>{stats?.deliveries.completedToday || 0}</Typography>
                  </div>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Delivery Calendar */}
      <Grid item size={12}>
        <DeliveryCalendar assignments={stats?.upcoming || []} onRefresh={fetchStats} />
      </Grid>

      {/* Today's Scheduled Drivers */}
      <Grid item size={6} lg={6}>
        <Card>
          <CardHeader
            title="Today's Scheduled Drivers"
            subheader={`${stats?.driversToday?.length || 0} drivers on the road`}
          />
          <CardContent>
            {stats?.driversToday && stats.driversToday.length > 0 ? (
              <List>
                {stats.driversToday.map((driver, index) => (
                  <div key={driver.id}>
                    <ListItem alignItems='flex-start'>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.light' }}>
                          <i className='tabler-user' />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display='flex' alignItems='center' gap={1}>
                            <Typography variant='subtitle1'>{driver.name}</Typography>
                            <Chip label={driver.status} size='small' color={getDriverStatusColor(driver.status)} />
                          </Box>
                        }
                        secondary={
                          <Box mt={1}>
                            <Typography variant='body2' color='text.secondary'>
                              {driver.vehicle
                                ? `${driver.vehicle.make} ${driver.vehicle.model} (${driver.vehicle.registrationNo})`
                                : 'No vehicle assigned'}
                            </Typography>
                            <Typography variant='caption' color='text.secondary' display='block' mt={1}>
                              {driver.deliveries.length} delivery(ies) scheduled
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < stats.driversToday.length - 1 && <Divider component='li' />}
                  </div>
                ))}
              </List>
            ) : (
              <Box textAlign='center' py={4}>
                <Typography variant='body2' color='text.secondary'>
                  No drivers scheduled for today
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
      {/* Upcoming Deliveries */}
      <Grid item size={6} lg={6}>
        <Card>
          <CardHeader title='Upcoming Deliveries (Next 7 Days)' subheader='Scheduled assignments' />
          <CardContent>
            {stats?.upcoming && stats.upcoming.length > 0 ? (
              <List>
                {stats.upcoming.slice(0, 5).map((assignment, index) => (
                  <div key={assignment.id}>
                    <ListItem alignItems='flex-start'>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'warning.light' }}>
                          <i className='tabler-package' />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display='flex' alignItems='center' gap={1} flexWrap='wrap'>
                            <Typography variant='subtitle2'>Order #{assignment.order.orderNumber}</Typography>
                            <Chip
                              label={assignment.status}
                              size='small'
                              color={getDeliveryStatusColor(assignment.status)}
                            />
                            <Chip
                              label={assignment.priority}
                              size='small'
                              color={getPriorityColor(assignment.priority)}
                            />
                          </Box>
                        }
                        secondary={
                          <Box mt={1}>
                            <Typography variant='body2' color='text.secondary'>
                              Driver: {assignment.driver.name}
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                              Vehicle: {assignment.vehicle.registrationNo}
                            </Typography>
                            <Typography variant='caption' color='primary' display='block' mt={1}>
                              {formatDate(assignment.scheduledDate)}
                              {assignment.scheduledTime && ` • ${assignment.scheduledTime}`}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < Math.min(stats.upcoming.length, 5) - 1 && <Divider component='li' />}
                  </div>
                ))}
              </List>
            ) : (
              <Box textAlign='center' py={4}>
                <Typography variant='body2' color='text.secondary'>
                  No upcoming deliveries
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default LogisticsDashboard
