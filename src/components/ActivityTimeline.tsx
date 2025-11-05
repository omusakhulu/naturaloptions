'use client'

import { useState, useEffect } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Timeline from '@mui/lab/Timeline'
import TimelineItem from '@mui/lab/TimelineItem'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineDot from '@mui/lab/TimelineDot'
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'
import classnames from 'classnames'
import { formatDistanceToNow } from 'date-fns'

interface Activity {
  id: string
  action: string
  description: string
  icon?: string
  color?: string
  createdAt: string
  performedBy: {
    id: string
    name: string
    email: string
    image?: string
    role: string
  }
  relatedUser?: {
    id: string
    name: string
    email: string
  }
  metadata?: string
}

interface ActivityTimelineProps {
  open: boolean
  onClose: () => void
  userId?: string
  entityType?: string
  entityId?: string
  title?: string
  limit?: number
}

const ActivityTimeline = ({
  open,
  onClose,
  userId,
  entityType,
  entityId,
  title = 'Activity Log',
  limit = 50
}: ActivityTimelineProps) => {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      fetchActivities()
    }
  }, [open, userId, entityType, entityId])

  const fetchActivities = async () => {
    setLoading(true)

    try {
      const params = new URLSearchParams()

      if (userId) params.append('userId', userId)
      if (entityType) params.append('entityType', entityType)
      if (entityId) params.append('entityId', entityId)
      params.append('limit', limit.toString())

      const response = await fetch(`/api/activity-logs?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setActivities(data.activities)
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const getColorClass = (color?: string) => {
    switch (color) {
      case 'success':
        return 'success'
      case 'error':
        return 'error'
      case 'warning':
        return 'warning'
      case 'info':
        return 'info'
      default:
        return 'primary'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'error'
      case 'ADMIN':
        return 'warning'
      case 'MANAGER':
        return 'info'
      case 'SALES':
        return 'success'
      default:
        return 'default'
    }
  }

  const formatRole = (role: string) => {
    return role
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ')
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <i className="tabler-timeline text-2xl" />
          <span>{title}</span>
        </div>
        <IconButton onClick={onClose} size="small">
          <i className="tabler-x" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <CircularProgress />
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <i className="tabler-timeline-event-x text-6xl text-textDisabled" />
            <Typography variant="h6" color="textSecondary">
              No activities found
            </Typography>
          </div>
        ) : (
          <Timeline position="right">
            {activities.map((activity, index) => (
              <TimelineItem key={activity.id}>
                <TimelineOppositeContent color="textSecondary" className="flex-[0.3]">
                  <Typography variant="caption">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </Typography>
                  <Typography variant="caption" display="block">
                    {new Date(activity.createdAt).toLocaleString()}
                  </Typography>
                </TimelineOppositeContent>

                <TimelineSeparator>
                  <TimelineDot color={getColorClass(activity.color)}>
                    {activity.icon && <i className={classnames(activity.icon, 'text-base')} />}
                  </TimelineDot>
                  {index < activities.length - 1 && <TimelineConnector />}
                </TimelineSeparator>

                <TimelineContent>
                  <div className="flex flex-col gap-2 pb-6">
                    <Typography variant="subtitle1" fontWeight={600}>
                      {activity.description}
                    </Typography>

                    <div className="flex items-center gap-2">
                      <Avatar
                        src={activity.performedBy.image || undefined}
                        alt={activity.performedBy.name}
                        sx={{ width: 24, height: 24 }}
                      >
                        {activity.performedBy.name?.charAt(0)}
                      </Avatar>
                      <Typography variant="body2" color="textSecondary">
                        {activity.performedBy.name}
                      </Typography>
                      <Chip
                        label={formatRole(activity.performedBy.role)}
                        size="small"
                        color={getRoleColor(activity.performedBy.role)}
                        variant="tonal"
                      />
                    </div>

                    {activity.relatedUser && (
                      <Typography variant="caption" color="textSecondary">
                        Related to: {activity.relatedUser.name}
                      </Typography>
                    )}

                    {activity.metadata && activity.metadata !== '{}' && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-textSecondary hover:text-primary">
                          View details
                        </summary>
                        <pre className="mt-2 text-xs bg-actionHover p-2 rounded overflow-auto max-h-32">
                          {JSON.stringify(JSON.parse(activity.metadata), null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={fetchActivities} startIcon={<i className="tabler-refresh" />} disabled={loading}>
          Refresh
        </Button>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ActivityTimeline
