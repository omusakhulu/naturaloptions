'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import { styled } from '@mui/material/styles'
import TimelineDot from '@mui/lab/TimelineDot'
import TimelineItem from '@mui/lab/TimelineItem'
import Typography from '@mui/material/Typography'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import MuiTimeline from '@mui/lab/Timeline'

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

const UserActivityTimeLine = ({ events = [] }) => {
  return (
    <Card>
      <CardHeader title='User Activity Timeline' />
      <CardContent>
        <Timeline>
          {events.map((ev, idx) => (
            <TimelineItem key={idx}>
              <TimelineSeparator>
                <TimelineDot color={ev.color || 'primary'} />
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                <div className='flex flex-wrap items-center justify-between gap-x-2 mbe-2.5'>
                  <Typography className='font-medium' color='text.primary'>
                    {ev.title}
                  </Typography>
                  <Typography variant='caption' color='text.disabled'>
                    {ev.at ? new Date(ev.at).toLocaleString() : ''}
                  </Typography>
                </div>
                {ev.subtitle ? <Typography className='mbe-2'>{ev.subtitle}</Typography> : null}
                {ev.icon ? (
                  <div className='flex items-center gap-2.5 is-fit bg-actionHover rounded plb-[5px] pli-2.5'>
                    <i className={`${ev.icon} text-lg`} />
                    <Typography className='font-medium'>{ev.color ? ev.color.toString() : ''}</Typography>
                  </div>
                ) : null}
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </CardContent>
    </Card>
  )
}

export default UserActivityTimeLine
