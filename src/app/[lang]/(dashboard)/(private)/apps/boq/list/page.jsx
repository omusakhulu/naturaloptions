'use client'

import { useState, useEffect } from 'react'

import Link from 'next/link'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import TableContainer from '@mui/material/TableContainer'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import CircularProgress from '@mui/material/CircularProgress'

const BOQListPage = ({ params }) => {
  const [boqs, setBOQs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [lang, setLang] = useState('en')

  // Resolve params async
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params

      setLang(resolvedParams?.lang || 'en')
    }

    resolveParams()
  }, [params])

  useEffect(() => {
    fetchBOQs()
  }, [statusFilter])

  const fetchBOQs = async () => {
    try {
      setLoading(true)
      const url = statusFilter === 'all' ? '/api/boq/list' : `/api/boq/list?status=${statusFilter}`
      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        setBOQs(data.boqs || [])
      }
    } catch (error) {
      console.error('Error fetching BOQs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = status => {
    const s = String(status || 'draft').toLowerCase()

    if (s === 'completed') return 'success'
    if (s === 'approved') return 'info'
    if (s === 'sent') return 'warning'

    return 'default'
  }

  const formatStatus = status => {
    return String(status || 'Draft')
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const formatDate = dateString => {
    if (!dateString) return 'N/A'

    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = value => {
    const num = parseFloat(value || 0)

    return `KES ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const filteredBOQs = boqs.filter(boq => {
    const matchesSearch =
      searchTerm === '' ||
      (boq.boqNumber && boq.boqNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (boq.projectName && boq.projectName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (boq.clientName && boq.clientName.toLowerCase().includes(searchTerm.toLowerCase()))

    return matchesSearch
  })

  return (
    <div>
      {/* Header */}
      <div className='flex flex-wrap items-center justify-between gap-4 mb-6'>
        <div>
          <Typography variant='h4' className='mb-1'>
            Bill of Quantities (BOQ)
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Professional BOQ documents for event projects
          </Typography>
        </div>
      </div>

      {/* Filters */}
      <Card className='mb-6'>
        <CardContent>
          <div className='flex flex-wrap gap-4 items-center'>
            <TextField
              size='small'
              placeholder='Search BOQ number, project, or client...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='flex-1 min-w-[250px]'
              InputProps={{
                startAdornment: <i className='tabler-search text-xl mr-2' />
              }}
            />
            <TextField
              select
              size='small'
              label='Status'
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className='min-w-[150px]'
            >
              <MenuItem value='all'>All Status</MenuItem>
              <MenuItem value='draft'>Draft</MenuItem>
              <MenuItem value='approved'>Approved</MenuItem>
              <MenuItem value='sent'>Sent</MenuItem>
              <MenuItem value='completed'>Completed</MenuItem>
            </TextField>
            <Button onClick={fetchBOQs} variant='outlined' startIcon={<i className='tabler-refresh' />}>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* BOQ Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>BOQ Number</TableCell>
                <TableCell>Project Name</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Event Date</TableCell>
                <TableCell align='right'>Total Value</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align='center'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align='center' className='py-10'>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredBOQs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align='center' className='py-10'>
                    <Typography variant='body2' color='text.secondary'>
                      No BOQs found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredBOQs.map(boq => (
                  <TableRow key={boq.id} hover>
                    <TableCell>
                      <Typography variant='body2' className='font-medium'>
                        {boq.boqNumber || `BOQ-${boq.id}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>{boq.projectName || 'Unnamed Project'}</Typography>
                      {boq.projectLocation && (
                        <Typography variant='caption' color='text.secondary'>
                          {boq.projectLocation}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>{boq.clientName || 'N/A'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>{formatDate(boq.eventDate)}</Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Typography variant='body2' className='font-medium'>
                        {formatCurrency(boq.total)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={formatStatus(boq.status)}
                        size='small'
                        color={getStatusColor(boq.status)}
                        variant='tonal'
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>{formatDate(boq.createdAt)}</Typography>
                    </TableCell>
                    <TableCell align='center'>
                      <div className='flex items-center justify-center gap-1'>
                        <IconButton
                          size='small'
                          component={Link}
                          href={`/${lang}/apps/boq/view/${boq.id}`}
                          title='View BOQ'
                        >
                          <i className='tabler-eye text-xl' />
                        </IconButton>
                        <IconButton size='small' title='Print BOQ'>
                          <i className='tabler-printer text-xl' />
                        </IconButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  )
}

export default BOQListPage
