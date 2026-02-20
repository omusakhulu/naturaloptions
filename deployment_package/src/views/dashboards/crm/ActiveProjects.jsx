// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'

// Components Imports
import OptionMenu from '@core/components/option-menu'

const ActiveProjects = ({ projects = [] }) => {
  // Filter active projects (not completed or cancelled)
  const activeProjects = projects.filter(p => !['completed', 'cancelled'].includes(p.status))

  // If no active projects, show message
  if (!activeProjects || activeProjects.length === 0) {
    return (
      <Card>
        <CardHeader
          title='Active Projects'
          subheader='No active projects'
          action={<OptionMenu options={['Refresh', 'Update', 'Share']} />}
        />
        <CardContent>
          <Typography variant='body2' color='text.secondary'>
            No active projects at the moment
          </Typography>
        </CardContent>
      </Card>
    )
  }

  // Calculate progress based on status
  const getProgress = status => {
    switch (status) {
      case 'draft':
        return 10
      case 'submitted':
        return 30
      case 'approved':
        return 50
      case 'in_progress':
        return 75
      case 'completed':
        return 100
      default:
        return 20
    }
  }

  const getProgressColor = status => {
    switch (status) {
      case 'draft':
        return 'error'
      case 'submitted':
        return 'warning'
      case 'approved':
        return 'info'
      case 'in_progress':
        return 'primary'
      case 'completed':
        return 'success'
      default:
        return 'secondary'
    }
  }

  const getStatusLabel = status => {
    switch (status) {
      case 'draft':
        return 'Draft'
      case 'submitted':
        return 'Submitted'
      case 'approved':
        return 'Approved'
      case 'in_progress':
        return 'In Progress'
      case 'completed':
        return 'Completed'
      case 'cancelled':
        return 'Cancelled'
      default:
        return status
    }
  }

  // Calculate average completion
  const avgCompletion = Math.round(
    activeProjects.reduce((sum, p) => sum + getProgress(p.status), 0) / activeProjects.length
  )

  return (
    <Card>
      <CardHeader
        title='Active Projects'
        subheader={`Average ${avgCompletion}% completed`}
        action={<OptionMenu options={['Refresh', 'Update', 'Share']} />}
      />
      <CardContent className='flex flex-col gap-4'>
        {activeProjects.slice(0, 6).map((project, index) => {
          const progress = getProgress(project.status)
          const progressColor = getProgressColor(project.status)
          const statusLabel = getStatusLabel(project.status)

          return (
            <div key={index} className='flex items-center gap-4'>
              <div className='flex flex-wrap justify-between items-center gap-x-4 gap-y-1 is-full'>
                <div className='flex flex-col'>
                  <Typography className='font-medium' color='text.primary'>
                    {project.name}
                  </Typography>
                  <Typography variant='body2'>{statusLabel}</Typography>
                </div>
                <div className='flex justify-between items-center is-32'>
                  <LinearProgress
                    value={progress}
                    variant='determinate'
                    color={progressColor}
                    className='min-bs-2 is-20'
                  />
                  <Typography color='text.disabled'>{`${progress}%`}</Typography>
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export default ActiveProjects
