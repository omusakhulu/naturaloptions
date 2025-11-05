'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import Grid from '@mui/material/Grid'

// Component Imports
import AssignOrderDialog from './AssignOrderDialog'

const DeliveryAssignments = () => {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)

  const fetchAssignments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/logistics/assignments')
      const data = await response.json()

      if (data.success) {
        setAssignments(data.assignments)
      }
    } catch (error) {
      console.error('Error fetching assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssignments()
  }, [])

  const getStatusColor = status => {
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

  const formatStatus = status => {
    return status.replace('_', ' ')
  }

  const handleAssignOrder = () => {
    setFormOpen(true)
  }

  const handleFormClose = () => {
    setFormOpen(false)
  }

  const handleFormSuccess = () => {
    fetchAssignments()
  }

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' py={6}>
        <CircularProgress />
      </Box>
    )
  }

  // Get statistics
  const stats = {
    total: assignments.length,
    scheduled: assignments.filter(a => a.status === 'SCHEDULED').length,
    inProgress: assignments.filter(a => a.status === 'IN_PROGRESS').length,
    completed: assignments.filter(a => a.status === 'COMPLETED').length
  }

  return (
    <>
      <Grid container spacing={6}>
        {/* Header */}
        <Grid item xs={12}>
          <Box display='flex' justifyContent='space-between' alignItems='center'>
            <div>
              <Typography variant='h4' fontWeight='bold'>
                Delivery Assignments
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Manage order deliveries and driver assignments
              </Typography>
            </div>
          </Box>
        </Grid>

        {/* Statistics Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display='flex' alignItems='center' gap={2}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'primary.light'
                  }}
                >
                  <i className='tabler-calendar-event' style={{ fontSize: 20 }} />
                </Box>
                <div>
                  <Typography variant='h5' fontWeight='bold'>
                    {stats.total}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    Total Assignments
                  </Typography>
                </div>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display='flex' alignItems='center' gap={2}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'info.light'
                  }}
                >
                  <i className='tabler-clock' style={{ fontSize: 20 }} />
                </Box>
                <div>
                  <Typography variant='h5' fontWeight='bold'>
                    {stats.scheduled}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    Scheduled
                  </Typography>
                </div>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display='flex' alignItems='center' gap={2}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'warning.light'
                  }}
                >
                  <i className='tabler-truck-delivery' style={{ fontSize: 20 }} />
                </Box>
                <div>
                  <Typography variant='h5' fontWeight='bold'>
                    {stats.inProgress}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    In Progress
                  </Typography>
                </div>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display='flex' alignItems='center' gap={2}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'success.light'
                  }}
                >
                  <i className='tabler-circle-check' style={{ fontSize: 20 }} />
                </Box>
                <div>
                  <Typography variant='h5' fontWeight='bold'>
                    {stats.completed}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    Completed
                  </Typography>
                </div>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Assignments Table */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title='All Assignments'
              subheader={`${assignments.length} delivery assignments`}
              action={
                <Box display='flex' gap={2}>
                  <Button variant='outlined' onClick={fetchAssignments}>
                    <i className='tabler-refresh' style={{ marginRight: 8 }} />
                    Refresh
                  </Button>
                  <Button variant='contained' onClick={handleAssignOrder}>
                    <i className='tabler-plus' style={{ marginRight: 8 }} />
                    Assign Order
                  </Button>
                </Box>
              }
            />
            <CardContent>
              {assignments.length === 0 ? (
                <Box textAlign='center' py={4}>
                  <Typography variant='body2' color='text.secondary'>
                    No delivery assignments yet. Start by assigning orders to drivers.
                  </Typography>
                  <Button variant='outlined' onClick={handleAssignOrder} sx={{ mt: 2 }}>
                    <i className='tabler-plus' style={{ marginRight: 8 }} />
                    Create First Assignment
                  </Button>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Order</TableCell>
                        <TableCell>Driver</TableCell>
                        <TableCell>Vehicle</TableCell>
                        <TableCell>Scheduled Date</TableCell>
                        <TableCell>Time</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Priority</TableCell>
                        <TableCell>Route</TableCell>
                        <TableCell align='right'>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {assignments.map(assignment => (
                        <TableRow key={assignment.id}>
                          <TableCell>
                            <Typography variant='subtitle2'>#{assignment.order?.orderNumber}</Typography>
                            <Typography variant='caption' color='text.secondary'>
                              KES {assignment.order?.total}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant='body2'>{assignment.driver?.name}</Typography>
                            <Typography variant='caption' color='text.secondary'>
                              {assignment.driver?.phone}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant='body2'>
                              {assignment.vehicle?.registrationNo}
                            </Typography>
                            <Typography variant='caption' color='text.secondary'>
                              {assignment.vehicle?.make} {assignment.vehicle?.model}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant='body2'>{formatDate(assignment.scheduledDate)}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant='body2'>{assignment.scheduledTime || 'All day'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={formatStatus(assignment.status)}
                              size='small'
                              color={getStatusColor(assignment.status)}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={assignment.priority}
                              size='small'
                              color={getPriorityColor(assignment.priority)}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant='caption'>{assignment.route || 'N/A'}</Typography>
                          </TableCell>
                          <TableCell align='right'>
                            <Tooltip title='View Details'>
                              <IconButton size='small'>
                                <i className='tabler-eye' />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title='Edit'>
                              <IconButton size='small'>
                                <i className='tabler-edit' />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title='Delete'>
                              <IconButton size='small' color='error'>
                                <i className='tabler-trash' />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Assignment Dialog */}
      <AssignOrderDialog open={formOpen} onClose={handleFormClose} onSuccess={handleFormSuccess} />
    </>
  )
}

export default DeliveryAssignments
