// MUI Imports
import Link from 'next/link'

import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'

// Component Imports
import { getAllProjects } from '@/lib/db/projects'

const statusColors = {
  draft: 'default',
  submitted: 'info',
  approved: 'success',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'error'
}

async function ProjectsListPage() {
  const projects = await getAllProjects()

  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        <div className='flex justify-between items-center mb-6'>
          <Typography variant='h4'>Projects</Typography>
          <Button variant='contained' component={Link} href='/apps/projects/create'>
            Create New Quote
          </Button>
        </div>
      </Grid>

      <Grid size={6}>
        <Grid container spacing={6}>
          {projects.length === 0 ? (
            <Grid item xs={12}>
              <Card>
                <CardContent className='flex flex-col items-center justify-center py-12'>
                  <i className='tabler-briefcase text-6xl mb-4 text-textDisabled' />
                  <Typography variant='h5' className='mb-2'>
                    No Projects Yet
                  </Typography>
                  <Typography color='text.secondary' className='mb-4'>
                    Get started by creating your first project quote
                  </Typography>
                  <Button variant='contained' component={Link} href='/apps/projects/create'>
                    Create New Quote
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ) : (
            projects.map(project => (
              <Grid key={project.id} size={12}>
                <Card>
                  <CardContent>
                    <div className='flex justify-between items-start mb-4'>
                      <Typography variant='h6' className='font-semibold'>
                        {project.name}
                      </Typography>
                      <Chip
                        label={project.status}
                        color={statusColors[project.status] || 'default'}
                        size='small'
                        variant='tonal'
                      />
                    </div>

                    <div className='space-y-2 mb-4'>
                      <div className='flex justify-between'>
                        <Typography variant='body2' color='text.secondary'>
                          Crew Details:
                        </Typography>
                        <Typography variant='body2'>{project.crewDetails?.length || 0}</Typography>
                      </div>
                      <div className='flex justify-between'>
                        <Typography variant='body2' color='text.secondary'>
                          Transport:
                        </Typography>
                        <Typography variant='body2'>{project.transport?.length || 0}</Typography>
                      </div>
                      <div className='flex justify-between'>
                        <Typography variant='body2' color='text.secondary'>
                          Created:
                        </Typography>
                        <Typography variant='body2'>{new Date(project.createdAt).toLocaleDateString()}</Typography>
                      </div>
                    </div>

                    <div className='flex gap-2'>
                      <Button
                        variant='outlined'
                        size='small'
                        component={Link}
                        href={`/apps/projects/${project.id}`}
                        fullWidth
                      >
                        View Details
                      </Button>
                      <Button
                        variant='contained'
                        size='small'
                        component={Link}
                        href={`/apps/projects/edit/${project.id}`}
                        fullWidth
                      >
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </Grid>
    </Grid>
  )
}

export default ProjectsListPage
