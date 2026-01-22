// MUI Imports
import Link from 'next/link'

import { redirect } from 'next/navigation'

import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'

// Component Imports
import { getProjectById } from '@/lib/db/projects'
import ProjectActions from '@/components/projects/ProjectActions'

const statusColors = {
  draft: 'default',
  submitted: 'info',
  approved: 'success',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'error'
}

const workTypeLabels = {
  loading_offloading: 'Loading / Offloading',
  buttoning_up_during_event: 'Buttoning up / During event',
  standby: 'Standby',
  build: 'Build',
  takedown_return: 'Takedown / Return',
  roof_floor_walls: 'Roof / Floor / Walls',
  carpeting_general_cleaning: 'Carpeting and General cleaning'
}

async function ProjectDetailsPage({ params }) {
  const { id } = await params

  if (!id) {
    redirect('/apps/projects/list')
  }

  const project = await getProjectById(id)

  if (!project) {
    redirect('/apps/projects/list')
  }

  // Calculate totals
  const crewTotal = project.crewDetails.reduce((sum, detail) => {
    return sum + detail.numberOfCrew * detail.shiftsNeeded * detail.fare
  }, 0)

  const transportTotal = project.transport.reduce((sum, transport) => {
    return sum + transport.numberOfTrips * transport.pricePerTrip + (transport.contingency || 0)
  }, 0)

  const grandTotal = crewTotal + transportTotal

  return (
    <Grid size={12}>
      {/* Header */}
      <Grid item xs={8}>
        <div className='flex flex-wrap justify-between items-center gap-4'>
          <div className='flex items-center gap-4'>
            <Typography variant='h4'>{project.name}</Typography>
            <Chip label={project.status} color={statusColors[project.status]} variant='tonal' />
          </div>
          <div className='flex gap-2'>
            <Button variant='outlined' component={Link} href='/apps/projects/list'>
              Back to List
            </Button>
            <Button variant='contained' component={Link} href={`/apps/projects/edit/${project.id}`}>
              Edit Project
            </Button>
          </div>
        </div>
        <div className='flex flex-wrap gap-2 mt-4'>
          <ProjectActions projectId={project.id} projectName={project.name} />
        </div>
        <Typography color='text.secondary' className='mt-2'>
          Created: {new Date(project.createdAt).toLocaleString()}
          {project.orderId && ` • Order ID: ${project.orderId}`}
        </Typography>
      </Grid>

      {/* Linked BOQs and Reports Section */}
      <Grid size={12} sx={{ mt: 3 }}>
        <Card>
          <CardContent>
            <div className='flex justify-between items-center mb-4'>
              <Typography variant='h6'>BOQs & Cost Reports</Typography>
              <div className='flex gap-2'>
                <Button
                  size='small'
                  variant='outlined'
                  component={Link}
                  href={`/apps/projects/boq/list?projectId=${project.id}`}
                  startIcon={<i className='tabler-file-invoice' />}
                >
                  View All BOQs
                </Button>
                <Button
                  size='small'
                  variant='outlined'
                  component={Link}
                  href={`/apps/projects/cost-reports/list?projectId=${project.id}`}
                  startIcon={<i className='tabler-report-money' />}
                >
                  View All Reports
                </Button>
              </div>
            </div>
            <Typography color='text.secondary'>
              Generate BOQs and Cost Reports for this project to track estimates and profitability.
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Remove duplicate text */}
      <Grid item xs={6} style={{ display: 'none' }}>
        <div className='flex flex-wrap justify-between items-center gap-4'>
          <div className='flex items-center gap-4'>
            <Typography variant='h4'>{project.name}</Typography>
            <Chip label={project.status} color={statusColors[project.status]} variant='tonal' />
          </div>
          <div className='flex gap-2'>
            <Button variant='outlined' component={Link} href='/apps/projects/list'>
              Back to List
            </Button>
            <Button variant='contained' component={Link} href={`/apps/projects/edit/${project.id}`}>
              Edit Project
            </Button>
          </div>
        </div>
        <Typography color='text.secondary' className='mt-2'>
          Created: {new Date(project.createdAt).toLocaleString()}
          {project.orderId && ` • Order ID: ${project.orderId}`}
        </Typography>
      </Grid>

      {/* Main Content - Left Side */}
      <Grid size={6}>
        <Card>
          <CardContent>
            {/* Crew Details */}
            <Typography variant='h5' className='mb-4'>
              Crew Details
            </Typography>

            {project.crewDetails.length === 0 ? (
              <Typography color='text.secondary' className='mb-6'>
                No crew details added yet.
              </Typography>
            ) : (
              <TableContainer component={Paper} className='mb-6'>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Type of Work</TableCell>
                      <TableCell align='right'>Crew</TableCell>
                      <TableCell align='right'>Shifts</TableCell>
                      <TableCell align='right'>Fare</TableCell>
                      <TableCell>Accommodation</TableCell>
                      <TableCell align='right'>Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {project.crewDetails.map(detail => (
                      <TableRow key={detail.id}>
                        <TableCell>{workTypeLabels[detail.workType] || detail.workType}</TableCell>
                        <TableCell align='right'>{detail.numberOfCrew}</TableCell>
                        <TableCell align='right'>{detail.shiftsNeeded}</TableCell>
                        <TableCell align='right'>${detail.fare.toFixed(2)}</TableCell>
                        <TableCell>{detail.accommodation || '-'}</TableCell>
                        <TableCell align='right'>
                          ${(detail.numberOfCrew * detail.shiftsNeeded * detail.fare).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={5} align='right'>
                        <strong>Total Crew Cost:</strong>
                      </TableCell>
                      <TableCell align='right'>
                        <strong>${crewTotal.toFixed(2)}</strong>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            <Divider className='my-6' />

            {/* Transport Details */}
            <Typography variant='h5' className='mb-4'>
              Transport Details
            </Typography>

            {project.transport.length === 0 ? (
              <Typography color='text.secondary'>No transport details added yet.</Typography>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Vehicle Type</TableCell>
                      <TableCell align='right'>Trips</TableCell>
                      <TableCell align='right'>Price/Trip</TableCell>
                      <TableCell align='right'>Contingency</TableCell>
                      <TableCell align='right'>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {project.transport.map(transport => (
                      <TableRow key={transport.id}>
                        <TableCell>{transport.vehicleType}</TableCell>
                        <TableCell align='right'>{transport.numberOfTrips}</TableCell>
                        <TableCell align='right'>${transport.pricePerTrip.toFixed(2)}</TableCell>
                        <TableCell align='right'>${(transport.contingency || 0).toFixed(2)}</TableCell>
                        <TableCell align='right'>
                          $
                          {(transport.numberOfTrips * transport.pricePerTrip + (transport.contingency || 0)).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={4} align='right'>
                        <strong>Total Transport Cost:</strong>
                      </TableCell>
                      <TableCell align='right'>
                        <strong>${transportTotal.toFixed(2)}</strong>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Summary - Right Side */}
      <Grid size={6}>
        <Card>
          <CardContent>
            <Typography variant='h5' className='mb-4'>
              Project Summary
            </Typography>

            <div className='space-y-3'>
              <div className='flex justify-between'>
                <Typography variant='body2' color='text.secondary'>
                  Total Crew Cost:
                </Typography>
                <Typography variant='body1' className='font-semibold'>
                  ${crewTotal.toFixed(2)}
                </Typography>
              </div>
              <div className='flex justify-between'>
                <Typography variant='body2' color='text.secondary'>
                  Total Transport Cost:
                </Typography>
                <Typography variant='body1' className='font-semibold'>
                  ${transportTotal.toFixed(2)}
                </Typography>
              </div>
              <Divider />
              <div className='flex justify-between'>
                <Typography variant='h6'>Grand Total:</Typography>
                <Typography variant='h6' color='primary' className='font-bold'>
                  ${grandTotal.toFixed(2)}
                </Typography>
              </div>
            </div>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default ProjectDetailsPage
