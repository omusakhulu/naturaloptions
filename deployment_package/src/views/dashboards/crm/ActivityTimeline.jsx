'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import { styled } from '@mui/material/styles'
import MuiTimeline from '@mui/lab/Timeline'
import TimelineDot from '@mui/lab/TimelineDot'
import TimelineItem from '@mui/lab/TimelineItem'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import Typography from '@mui/material/Typography'

// Components Imports
import OptionMenu from '@core/components/option-menu'

// Styled Timeline component
const Timeline = styled(MuiTimeline)({
  paddingLeft: 0,
  paddingRight: 0,
  '& .MuiTimelineItem-root': {
    width: '100%',
    '&:before': {
      display: 'none'
    }
  }
})

const ActivityTimeline = ({ activities = [] }) => {
  // Helper to get time ago
  const getTimeAgo = date => {
    if (!date) return 'Recently'

    try {
      const now = new Date()
      const activityDate = new Date(date)
      const diffMs = now - activityDate
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 60) return `${diffMins} min ago`
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`

      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    } catch {
      return 'Recently'
    }
  }

  // Helper to get color based on type
  const getColor = type => {
    switch (type) {
      case 'order':
        return 'primary'
      case 'invoice':
        return 'success'
      case 'payment':
        return 'info'
      default:
        return 'primary'
    }
  }

  // If no activities, show default message
  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader
          avatar={<i className='tabler-list-details text-xl' />}
          title='Activity Timeline'
          titleTypographyProps={{ variant: 'h5' }}
          action={<OptionMenu options={['Share timeline', 'Suggest edits', 'Report bug']} />}
          sx={{ '& .MuiCardHeader-avatar': { mr: 3 } }}
        />
        <CardContent>
          <Typography variant='body2' color='text.secondary'>
            No recent activity
          </Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader
        avatar={<i className='tabler-list-details text-xl' />}
        title='Activity Timeline'
        titleTypographyProps={{ variant: 'h5' }}
        action={<OptionMenu options={['Share timeline', 'Suggest edits', 'Report bug']} />}
        sx={{ '& .MuiCardHeader-avatar': { mr: 3 } }}
      />
      <CardContent className='flex flex-col gap-6 pbe-5'>
        <Timeline>
          {activities.slice(0, 5).map((activity, index) => {
            const isLast = index === Math.min(4, activities.length - 1)

            return (
              <TimelineItem key={index}>
                <TimelineSeparator>
                  <TimelineDot color={getColor(activity.type)} />
                  {!isLast && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent>
                  <div className='flex flex-wrap items-center justify-between gap-x-2 mbe-2.5'>
                    <Typography className='font-medium' color='text.primary'>
                      {activity.title}
                    </Typography>
                    <Typography variant='caption'>{getTimeAgo(activity.date)}</Typography>
                  </div>
                  {activity.type === 'order' && (
                    <Typography className='mbe-2'>
                      Order status: {activity.status} • Amount: KSh{' '}
                      {parseFloat(activity.amount || 0).toLocaleString('en-KE', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </Typography>
                  )}
                  {activity.type === 'invoice' && (
                    <Typography className='mbe-2'>
                      Customer: {activity.customerName} • Amount: KSh{' '}
                      {parseFloat(activity.amount || 0).toLocaleString('en-KE', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </Typography>
                  )}
                </TimelineContent>
              </TimelineItem>
            )
          })}
        </Timeline>
      </CardContent>
    </Card>
  )
}

export default ActivityTimeline
