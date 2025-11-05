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
import Box from '@mui/material/Box'

const statusColors = {
  draft: 'default',
  in_progress: 'info',
  completed: 'success'
}

const CostReportsListPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectIdParam = searchParams?.get('projectId')

  const [reports, setReports] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState(projectIdParam || 'all')

  useEffect(() => {
    fetchCostReports()
  }, [statusFilter, projectFilter])

  const fetchCostReports = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (projectFilter && projectFilter !== 'all') {
        params.append('projectId', projectFilter)
      }

      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/projects/cost-reports?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setReports(data.costReports)
        setSummary(data.summary)
      }
    } catch (error) {
      console.error('Error fetching cost reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchCostReports()
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

  const getVarianceColor = variance => {
    const val = parseFloat(variance)

    if (val < 0) return 'success' // Under budget
    if (val > 0) return 'error' // Over budget

    return 'default'
  }

  const getVarianceLabel = variance => {
    const val = parseFloat(variance)

    if (val < 0) return 'Under Budget'
    if (val > 0) return 'Over Budget'

    return 'On Budget'
  }

  // Filter by search query
  const filteredReports = reports.filter(
    report =>
      report.reportNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.projectName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        <div className='flex justify-between items-center mb-6'>
          <div>
            <Typography variant='h4'>Project Cost Reports</Typography>
            <Typography color='text.secondary'>Track estimated vs actual costs and profitability</Typography>
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

      {/* Summary Cards */}
      {summary && (
        <Grid size={12}>
          <Grid container spacing={4}>
            <Grid size={3}>
              <Card>
                <CardContent>
                  <Typography variant='caption' color='text.secondary'>
                    Total Reports
                  </Typography>
                  <Typography variant='h4'>{summary.total}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={3}>
              <Card>
                <CardContent>
                  <Typography variant='caption' color='text.secondary'>
                    Total Revenue
                  </Typography>
                  <Typography variant='h5' color='primary.main'>
                    {formatCurrency(summary.totalRevenue)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={3}>
              <Card>
                <CardContent>
                  <Typography variant='caption' color='text.secondary'>
                    Total Profit
                  </Typography>
                  <Typography variant='h5' color='success.main'>
                    {formatCurrency(summary.totalProfit)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={3}>
              <Card>
                <CardContent>
                  <Typography variant='caption' color='text.secondary'>
                    Avg Profit Margin
                  </Typography>
                  <Typography variant='h5' color='info.main'>
                    {summary.avgProfitMargin}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Grid size={12}>
        <Card>
          <CardContent>
            <div className='flex flex-wrap gap-4'>
              <TextField
                label='Search Reports'
                variant='outlined'
                size='small'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder='Search by report# or project...'
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
                  <MenuItem value='in_progress'>In Progress</MenuItem>
                  <MenuItem value='completed'>Completed</MenuItem>
                </Select>
              </FormControl>
            </div>
          </CardContent>
        </Card>
      </Grid>

      {/* Cost Reports Table */}
      <Grid size={12}>
        <Card>
          <CardContent>
            {loading ? (
              <div className='flex justify-center items-center p-8'>
                <CircularProgress />
              </div>
            ) : filteredReports.length === 0 ? (
              <div className='text-center p-8'>
                <Typography variant='h6' color='text.secondary'>
                  No cost reports found
                </Typography>
                <Typography color='text.secondary' className='mt-2'>
                  Generate cost reports from your projects to see them here
                </Typography>
              </div>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Report #</TableCell>
                    <TableCell>Project</TableCell>
                    <TableCell align='right'>Estimated</TableCell>
                    <TableCell align='right'>Actual</TableCell>
                    <TableCell align='center'>Variance</TableCell>
                    <TableCell align='right'>Profit</TableCell>
                    <TableCell align='center'>Margin</TableCell>
                    <TableCell align='center'>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align='center'>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredReports.map(report => {
                    const variance = parseFloat(report.variance)
                    const profitMargin = parseFloat(report.profitMargin)

                    return (
                      <TableRow key={report.id} hover>
                        <TableCell>
                          <Typography variant='body2' fontWeight={600}>
                            {report.reportNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>{report.projectName}</Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='body2'>{formatCurrency(report.estimatedCost)}</Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='body2' fontWeight={600}>
                            {formatCurrency(report.actualCost)}
                          </Typography>
                        </TableCell>
                        <TableCell align='center'>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                            <Typography
                              variant='body2'
                              fontWeight={600}
                              color={variance < 0 ? 'success.main' : variance > 0 ? 'error.main' : 'text.primary'}
                            >
                              {formatCurrency(Math.abs(variance))}
                            </Typography>
                            <Chip
                              label={getVarianceLabel(variance)}
                              color={getVarianceColor(variance)}
                              size='small'
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='body2' color='success.main' fontWeight={600}>
                            {formatCurrency(report.profit)}
                          </Typography>
                        </TableCell>
                        <TableCell align='center'>
                          <Chip
                            label={`${profitMargin.toFixed(1)}%`}
                            color={profitMargin > 30 ? 'success' : profitMargin > 20 ? 'info' : 'warning'}
                            size='small'
                          />
                        </TableCell>
                        <TableCell align='center'>
                          <Chip
                            label={report.status}
                            color={statusColors[report.status]}
                            size='small'
                            variant='tonal'
                          />
                        </TableCell>
                        <TableCell>{formatDate(report.createdAt)}</TableCell>
                        <TableCell align='center'>
                          <div className='flex gap-1 justify-center'>
                            <Tooltip title='View Report'>
                              <IconButton
                                size='small'
                                component={Link}
                                href={`/apps/projects/cost-reports/view/${report.id}`}
                                color='primary'
                              >
                                <i className='tabler-eye' />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title='Edit Report'>
                              <IconButton
                                size='small'
                                component={Link}
                                href={`/apps/projects/cost-reports/view/${report.id}?edit=true`}
                                color='secondary'
                              >
                                <i className='tabler-edit' />
                              </IconButton>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default CostReportsListPage
