'use client'

import { useState, useEffect } from 'react'

import Link from 'next/link'

import {
  Card,
  CardHeader,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Typography,
  Box,
  Button,
  CircularProgress,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import WarehouseIcon from '@mui/icons-material/Warehouse'

// Custom Select Icon
const SelectIcon = () => <i className='tabler-chevron-down' />

interface Warehouse {
  id: string
  name: string
  code: string
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  managerName: string | null
  capacity: number | null
  status: string
  _count: {
    locations: number
    inventory: number
    movements: number
  }
  createdAt: string
}

export default function WarehousesListPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchWarehouses = async () => {
    try {
      setLoading(true)
      const url = new URL('/api/warehouses', window.location.origin)

      if (statusFilter !== 'all') {
        url.searchParams.set('status', statusFilter)
      }

      const response = await fetch(url.toString())
      const data = await response.json()

      if (data.success) {
        setWarehouses(data.warehouses)
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWarehouses()
  }, [statusFilter])

  const deleteWarehouse = async (id: string) => {
    if (!confirm('Are you sure you want to delete this warehouse?')) return

    try {
      const response = await fetch(`/api/warehouses/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        fetchWarehouses()
      }
    } catch (error) {
      console.error('Error deleting warehouse:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'inactive':
        return 'default'
      case 'maintenance':
        return 'warning'
      default:
        return 'default'
    }
  }

  const filteredWarehouses = warehouses.filter(
    warehouse =>
      warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.city?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Card>
      <CardHeader
        title={
          <Box display='flex' alignItems='center' gap={2}>
            <WarehouseIcon sx={{ fontSize: 32 }} />
            <Typography variant='h5'>Warehouses</Typography>
            <Chip label={`${filteredWarehouses.length} warehouses`} color='primary' size='small' />
          </Box>
        }
        action={
          <Box display='flex' gap={1}>
            <Button component={Link} href='/en/apps/warehouses/add' variant='contained' startIcon={<AddIcon />}>
              Add Warehouse
            </Button>
            <IconButton onClick={fetchWarehouses} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Box>
        }
      />
      <CardContent>
        {/* Filters */}
        <Box display='flex' gap={2} mb={3}>
          <TextField
            placeholder='Search warehouses...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon />
                </InputAdornment>
              )
            }}
            sx={{ minWidth: 300 }}
          />
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label='Status'
              onChange={e => setStatusFilter(e.target.value)}
              IconComponent={SelectIcon}
            >
              <MenuItem value='all'>All Statuses</MenuItem>
              <MenuItem value='active'>Active</MenuItem>
              <MenuItem value='inactive'>Inactive</MenuItem>
              <MenuItem value='maintenance'>Maintenance</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Table */}
        {loading ? (
          <Box display='flex' justifyContent='center' py={5}>
            <CircularProgress />
          </Box>
        ) : filteredWarehouses.length === 0 ? (
          <Box textAlign='center' py={5}>
            <Typography variant='h6' color='text.secondary'>
              No warehouses found
            </Typography>
            <Button component={Link} href='/en/apps/warehouses/add' variant='contained' sx={{ mt: 2 }}>
              Create Your First Warehouse
            </Button>
          </Box>
        ) : (
          <TableContainer component={Paper} variant='outlined'>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Code</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Name</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Location</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Manager</strong>
                  </TableCell>
                  <TableCell align='right'>
                    <strong>Capacity (m³)</strong>
                  </TableCell>
                  <TableCell align='center'>
                    <strong>Inventory Items</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Status</strong>
                  </TableCell>
                  <TableCell align='center'>
                    <strong>Actions</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredWarehouses.map(warehouse => (
                  <TableRow key={warehouse.id} hover>
                    <TableCell>
                      <Typography variant='body2' fontWeight='bold'>
                        {warehouse.code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>{warehouse.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>
                        {[warehouse.city, warehouse.state, warehouse.country].filter(Boolean).join(', ') || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>{warehouse.managerName || 'N/A'}</Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Typography variant='body2'>{warehouse.capacity?.toLocaleString() || 'N/A'}</Typography>
                    </TableCell>
                    <TableCell align='center'>
                      <Chip label={warehouse._count.inventory} size='small' color='primary' />
                    </TableCell>
                    <TableCell>
                      <Chip label={warehouse.status} color={getStatusColor(warehouse.status)} size='small' />
                    </TableCell>
                    <TableCell align='center'>
                      <IconButton
                        size='small'
                        color='primary'
                        component={Link}
                        href={`/en/apps/warehouses/${warehouse.id}`}
                        title='View Details'
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        size='small'
                        color='info'
                        component={Link}
                        href={`/en/apps/warehouses/edit/${warehouse.id}`}
                        title='Edit'
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size='small'
                        color='error'
                        onClick={() => deleteWarehouse(warehouse.id)}
                        title='Delete'
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  )
}
