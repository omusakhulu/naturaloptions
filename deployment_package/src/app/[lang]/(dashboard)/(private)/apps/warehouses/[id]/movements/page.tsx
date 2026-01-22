'use client'

import { useState, useEffect, use } from 'react'

import Link from 'next/link'

import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Tooltip
} from '@mui/material'
import Grid from '@mui/material/Grid'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import RefreshIcon from '@mui/icons-material/Refresh'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import DescriptionIcon from '@mui/icons-material/Description'
import VisibilityIcon from '@mui/icons-material/Visibility'

// Custom Select Icon
const SelectIcon = () => <i className='tabler-chevron-down' />

interface PackingSlip {
  id: string
  wooOrderId: number
  packingSlipNumber: string
  status: string
  boothNumber: string | null
  assignedUserId: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

interface Movement {
  id: string
  type: string
  quantity: number
  referenceNumber: string | null
  notes: string | null
  performedBy: string | null
  fromLocation: string | null
  toLocation: string | null
  createdAt: string
  inventory: {
    sku: string
    productName: string
  }
  packingSlip: PackingSlip | null
}

export default function StockMovementsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    fetchMovements()
  }, [id, filterType])

  const fetchMovements = async () => {
    try {
      setLoading(true)
      const url = new URL(`/api/warehouses/${id}/movements`, window.location.origin)

      if (filterType !== 'all') {
        url.searchParams.set('type', filterType)
      }

      const response = await fetch(url.toString())
      const data = await response.json()

      if (data.success) {
        setMovements(data.movements)
      }
    } catch (err: any) {
      console.error('Error fetching movements:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'inbound':
      case 'return':
        return 'success'
      case 'outbound':
        return 'error'
      case 'transfer':
        return 'info'
      case 'adjustment':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'inbound':
      case 'return':
        return <ArrowDownwardIcon fontSize='small' />
      case 'outbound':
        return <ArrowUpwardIcon fontSize='small' />
      default:
        return <SwapHorizIcon fontSize='small' />
    }
  }

  const getPackingSlipStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'collected':
        return 'success'
      case 'en_route':
        return 'info'
      case 'awaiting_collection':
        return 'warning'
      default:
        return 'default'
    }
  }

  const formatPackingSlipStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='400px'>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Grid container spacing={6}>
      {/* Header */}
      <Grid size={12}>
        <Card>
          <CardHeader
            title={
              <Box display='flex' alignItems='center' gap={2}>
                <SwapHorizIcon sx={{ fontSize: 32 }} />
                <Typography variant='h5'>Stock Movements</Typography>
                <Chip label={`${movements.length} movements`} color='primary' size='small' />
              </Box>
            }
            action={
              <Box display='flex' gap={2} alignItems='center'>
                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={filterType}
                    label='Type'
                    onChange={e => setFilterType(e.target.value)}
                    IconComponent={SelectIcon}
                    size='small'
                  >
                    <MenuItem value='all'>All Types</MenuItem>
                    <MenuItem value='inbound'>Inbound</MenuItem>
                    <MenuItem value='outbound'>Outbound</MenuItem>
                    <MenuItem value='transfer'>Transfer</MenuItem>
                    <MenuItem value='adjustment'>Adjustment</MenuItem>
                    <MenuItem value='return'>Return</MenuItem>
                  </Select>
                </FormControl>
                <IconButton onClick={fetchMovements}>
                  <RefreshIcon />
                </IconButton>
              </Box>
            }
          />
        </Card>
      </Grid>

      {error && (
        <Grid size={12}>
          <Alert severity='error' onClose={() => setError(null)}>
            {error}
          </Alert>
        </Grid>
      )}

      {/* Movements Table */}
      <Grid size={12}>
        <Card>
          <CardContent>
            <TableContainer component={Paper} variant='outlined'>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Date & Time</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Product</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Type</strong>
                    </TableCell>
                    <TableCell align='right'>
                      <strong>Quantity</strong>
                    </TableCell>
                    <TableCell>
                      <strong>From/To</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Reference</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Packing Slip</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Notes</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Performed By</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {movements.map(movement => (
                    <TableRow key={movement.id}>
                      <TableCell>
                        <Typography variant='body2'>{new Date(movement.createdAt).toLocaleDateString()}</Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {new Date(movement.createdAt).toLocaleTimeString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2'>{movement.inventory.productName}</Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {movement.inventory.sku}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getMovementIcon(movement.type)}
                          label={movement.type}
                          color={getMovementColor(movement.type)}
                          size='small'
                        />
                      </TableCell>
                      <TableCell align='right'>
                        <Typography
                          variant='body2'
                          fontWeight='bold'
                          color={
                            movement.type === 'inbound' || movement.type === 'return'
                              ? 'success.main'
                              : movement.type === 'outbound'
                                ? 'error.main'
                                : 'text.primary'
                          }
                        >
                          {movement.type === 'inbound' || movement.type === 'return' ? '+' : ''}
                          {movement.type === 'outbound' ? '-' : ''}
                          {movement.quantity}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {movement.fromLocation && (
                          <Typography variant='caption' display='block'>
                            From: {movement.fromLocation}
                          </Typography>
                        )}
                        {movement.toLocation && (
                          <Typography variant='caption' display='block'>
                            To: {movement.toLocation}
                          </Typography>
                        )}
                        {!movement.fromLocation && !movement.toLocation && (
                          <Typography variant='caption' color='text.secondary'>
                            N/A
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {movement.referenceNumber ? (
                          <Box>
                            <Chip
                              label={movement.referenceNumber}
                              size='small'
                              color={
                                movement.referenceNumber.startsWith('ORDER-')
                                  ? 'primary'
                                  : movement.referenceNumber.startsWith('RETURN-')
                                    ? 'warning'
                                    : 'default'
                              }
                              variant='outlined'
                            />
                            {movement.referenceNumber.startsWith('ORDER-') && (
                              <Typography variant='caption' display='block' sx={{ mt: 0.5 }}>
                                Order #{movement.referenceNumber.replace('ORDER-', '')}
                              </Typography>
                            )}
                            {movement.referenceNumber.startsWith('RETURN-') && (
                              <Typography variant='caption' display='block' sx={{ mt: 0.5 }}>
                                Return from Order #{movement.referenceNumber.replace('RETURN-', '')}
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography variant='caption' color='text.secondary'>
                            N/A
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {movement.packingSlip ? (
                          <Box>
                            <Tooltip
                              title={`Click to view/edit packing slip${movement.packingSlip.boothNumber ? ` - Stand ${movement.packingSlip.boothNumber}` : ''}`}
                            >
                              <Button
                                component={Link}
                                href={`/en/packing-slips/${movement.packingSlip.wooOrderId}`}
                                size='small'
                                variant='outlined'
                                startIcon={<DescriptionIcon />}
                                sx={{ textTransform: 'none' }}
                              >
                                {movement.packingSlip.packingSlipNumber}
                              </Button>
                            </Tooltip>
                            <Box display='flex' alignItems='center' gap={1} mt={0.5}>
                              <Chip
                                label={formatPackingSlipStatus(movement.packingSlip.status)}
                                size='small'
                                color={getPackingSlipStatusColor(movement.packingSlip.status)}
                              />
                              {movement.packingSlip.boothNumber && (
                                <Chip label={`Stand ${movement.packingSlip.boothNumber}`} size='small' variant='outlined' />
                              )}
                            </Box>
                          </Box>
                        ) : movement.referenceNumber && movement.referenceNumber.startsWith('ORDER-') ? (
                          <Typography variant='caption' color='text.secondary'>
                            No packing slip
                          </Typography>
                        ) : (
                          <Typography variant='caption' color='text.secondary'>
                            N/A
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {movement.notes || (
                          <Typography variant='caption' color='text.secondary'>
                            No notes
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{movement.performedBy || 'System'}</TableCell>
                    </TableRow>
                  ))}
                  {movements.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} align='center'>
                        <Box py={3}>
                          <Typography variant='body2' color='text.secondary'>
                            No stock movements found
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}
