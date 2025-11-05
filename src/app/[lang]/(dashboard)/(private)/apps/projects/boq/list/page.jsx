'use client'

import { useState, useEffect } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'
import Tooltip from '@mui/material/Tooltip'

const statusColors = {
  draft: 'default',
  approved: 'success',
  sent: 'info',
  completed: 'success'
}

const ProjectBOQListPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectIdParam = searchParams?.get('projectId')

  const [boqs, setBOQs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState(projectIdParam || 'all')

  useEffect(() => {
    fetchBOQs()
  }, [statusFilter, projectFilter])

  const fetchBOQs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/boq/list')
      const data = await response.json()

      if (data.success) {
        // Filter BOQs to only show project-based ones
        let filteredBOQs = data.boqs.filter(boq => boq.projectId != null)

        // Apply status filter
        if (statusFilter && statusFilter !== 'all') {
          filteredBOQs = filteredBOQs.filter(boq => boq.status === statusFilter)
        }

        // Apply project filter
        if (projectFilter && projectFilter !== 'all') {
          filteredBOQs = filteredBOQs.filter(boq => boq.projectId === projectFilter)
        }

        setBOQs(filteredBOQs)
      }
    } catch (error) {
      console.error('Error fetching BOQs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchBOQs()
  }

  const formatCurrency = value => {
    const num = parseFloat(value || 0)

    return `KES ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDate = dateString => {
    if (!dateString) return 'N/A'

    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Filter by search query
  const filteredBOQs = boqs.filter(
    boq =>
      boq.boqNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      boq.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      boq.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        <div className='flex justify-between items-center mb-6'>
          <div>
            <Typography variant='h4'>Project BOQs</Typography>
            <Typography color='text.secondary'>Bills of Quantities generated from projects</Typography>
          </div>
          <Button
            variant='outlined'
            startIcon={<i className='tabler-refresh' />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </Grid>

      {/* Filters */}
      <Grid size={12}>
        <Card>
          <CardContent>
            <div className='flex flex-wrap gap-4'>
              <TextField
                label='Search BOQs'
                variant='outlined'
                size='small'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder='Search by BOQ#, project, or client...'
                sx={{ minWidth: 300 }}
                InputProps={{
                  startAdornment: <i className='tabler-search' style={{ marginRight: 8 }} />
                }}
              />

              <FormControl size='small' sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label='Status' onChange={e => setStatusFilter(e.target.value)}>
                  <MenuItem value='all'>All Status</MenuItem>
                  <MenuItem value='draft'>Draft</MenuItem>
                  <MenuItem value='approved'>Approved</MenuItem>
                  <MenuItem value='sent'>Sent</MenuItem>
                  <MenuItem value='completed'>Completed</MenuItem>
                </Select>
              </FormControl>
            </div>
          </CardContent>
        </Card>
      </Grid>

      {/* BOQ List Table */}
      <Grid size={12}>
        <Card>
          <CardContent>
            {loading ? (
              <div className='flex justify-center items-center p-8'>
                <CircularProgress />
              </div>
            ) : filteredBOQs.length === 0 ? (
              <div className='text-center p-8'>
                <Typography variant='h6' color='text.secondary'>
                  No project BOQs found
                </Typography>
                <Typography color='text.secondary' className='mt-2'>
                  Generate BOQs from your projects to see them here
                </Typography>
              </div>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>BOQ Number</TableCell>
                    <TableCell>Project</TableCell>
                    <TableCell>Client</TableCell>
                    <TableCell>Event Date</TableCell>
                    <TableCell align='right'>Total Value</TableCell>
                    <TableCell align='center'>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align='center'>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredBOQs.map(boq => (
                    <TableRow key={boq.id} hover>
                      <TableCell>
                        <Typography variant='body2' fontWeight={600}>
                          {boq.boqNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2'>{boq.projectName}</Typography>
                        {boq.projectLocation && (
                          <Typography variant='caption' color='text.secondary'>
                            {boq.projectLocation}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2'>{boq.clientName}</Typography>
                      </TableCell>
                      <TableCell>{formatDate(boq.eventDate)}</TableCell>
                      <TableCell align='right'>
                        <Typography variant='body2' fontWeight={600}>
                          {formatCurrency(boq.total)}
                        </Typography>
                      </TableCell>
                      <TableCell align='center'>
                        <Chip label={boq.status} color={statusColors[boq.status]} size='small' variant='tonal' />
                      </TableCell>
                      <TableCell>{formatDate(boq.createdAt)}</TableCell>
                      <TableCell align='center'>
                        <div className='flex gap-1 justify-center'>
                          <Tooltip title='View BOQ'>
                            <IconButton size='small' component={Link} href={`/apps/boq/view/${boq.id}`} color='primary'>
                              <i className='tabler-eye' />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title='Print BOQ'>
                            <IconButton
                              size='small'
                              onClick={() => {
                                router.push(`/apps/boq/view/${boq.id}`)
                                setTimeout(() => window.print(), 500)
                              }}
                            >
                              <i className='tabler-printer' />
                            </IconButton>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default ProjectBOQListPage
