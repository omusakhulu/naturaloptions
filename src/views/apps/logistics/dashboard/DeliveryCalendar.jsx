'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { styled } from '@mui/material/styles'

const CalendarGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: theme.spacing(1),
  '& > div': {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
    minHeight: 100,
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
      backgroundColor: theme.palette.action.hover
    }
  }
}))

const DayHeader = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  fontWeight: 'bold',
  padding: theme.spacing(1),
  backgroundColor: theme.palette.grey[100]
}))

const DeliveryCalendar = ({ assignments = [], onRefresh }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [calendarDays, setCalendarDays] = useState([])

  useEffect(() => {
    generateCalendar()
  }, [currentDate, assignments])

  const generateCalendar = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // Get first day of month
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    // Get starting day (Sunday = 0)
    const startingDayOfWeek = firstDay.getDay()

    // Calculate days to show
    const daysInMonth = lastDay.getDate()
    const days = []

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ date: null, deliveries: [] })
    }

    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateString = date.toISOString().split('T')[0]

      // Find deliveries for this day
      const dayDeliveries = assignments.filter(a => {
        const assignmentDate = new Date(a.scheduledDate).toISOString().split('T')[0]
        return assignmentDate === dateString
      })

      days.push({
        date: day,
        fullDate: date,
        deliveries: dayDeliveries
      })
    }

    setCalendarDays(days)
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
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

  const isToday = date => {
    if (!date) return false
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <Card>
      <CardHeader
        title='Delivery Schedule Calendar'
        subheader='Driver assignments and order deliveries'
        action={
          <Box display='flex' gap={1}>
            <Button size='small' variant='outlined' onClick={goToToday}>
              Today
            </Button>
            <Button size='small' variant='outlined' onClick={onRefresh}>
              <i className='tabler-refresh' />
            </Button>
          </Box>
        }
      />
      <CardContent>
        {/* Calendar Navigation */}
        <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
          <IconButton onClick={previousMonth}>
            <i className='tabler-chevron-left' />
          </IconButton>
          <Typography variant='h6'>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Typography>
          <IconButton onClick={nextMonth}>
            <i className='tabler-chevron-right' />
          </IconButton>
        </Box>

        {/* Day Headers */}
        <Box display='grid' gridTemplateColumns='repeat(7, 1fr)' gap={1} mb={1}>
          {dayNames.map(day => (
            <DayHeader key={day}>{day}</DayHeader>
          ))}
        </Box>

        {/* Calendar Grid */}
        <CalendarGrid>
          {calendarDays.map((day, index) => (
            <Box
              key={index}
              sx={
                day.date && isToday(day.fullDate)
                  ? {
                      backgroundColor: 'primary.lighter',
                      borderColor: 'primary.main !important',
                      borderWidth: '2px !important'
                    }
                  : {}
              }
            >
              {day.date && (
                <>
                  <Typography variant='subtitle2' mb={1}>
                    {day.date}
                  </Typography>
                  {day.deliveries.length > 0 && (
                    <Box display='flex' flexDirection='column' gap={0.5}>
                      {day.deliveries.slice(0, 3).map(delivery => (
                        <Tooltip
                          key={delivery.id}
                          title={
                            <Box>
                              <Typography variant='caption' display='block'>
                                Order: {delivery.order?.orderNumber}
                              </Typography>
                              <Typography variant='caption' display='block'>
                                Driver: {delivery.driver?.name}
                              </Typography>
                              <Typography variant='caption' display='block'>
                                Vehicle: {delivery.vehicle?.registrationNo}
                              </Typography>
                              {delivery.scheduledTime && (
                                <Typography variant='caption' display='block'>
                                  Time: {delivery.scheduledTime}
                                </Typography>
                              )}
                            </Box>
                          }
                        >
                          <Chip
                            label={`${delivery.driver?.name.split(' ')[0]} - #${delivery.order?.orderNumber}`}
                            size='small'
                            color={getDeliveryStatusColor(delivery.status)}
                            sx={{
                              fontSize: '0.65rem',
                              height: 20,
                              '& .MuiChip-label': {
                                px: 1
                              }
                            }}
                          />
                        </Tooltip>
                      ))}
                      {day.deliveries.length > 3 && (
                        <Typography variant='caption' color='text.secondary' sx={{ pl: 1 }}>
                          +{day.deliveries.length - 3} more
                        </Typography>
                      )}
                    </Box>
                  )}
                </>
              )}
            </Box>
          ))}
        </CalendarGrid>

        {/* Legend */}
        <Box display='flex' gap={2} mt={3} flexWrap='wrap' justifyContent='center'>
          <Chip label='Scheduled' size='small' color='info' />
          <Chip label='In Progress' size='small' color='warning' />
          <Chip label='Completed' size='small' color='success' />
          <Chip label='Cancelled/Delayed' size='small' color='error' />
        </Box>
      </CardContent>
    </Card>
  )
}

export default DeliveryCalendar
