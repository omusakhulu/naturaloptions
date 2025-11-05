'use client'

import { useState, useEffect, use } from 'react'

import Link from 'next/link'

import {
  Card,
  CardHeader,
  CardContent,
  Grid,
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
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material'
import InventoryIcon from '@mui/icons-material/Inventory'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import TuneIcon from '@mui/icons-material/Tune'
import RefreshIcon from '@mui/icons-material/Refresh'

// Custom Select Icon
const SelectIcon = () => <i className='tabler-chevron-down' />

export default function ManageInventoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [inventory, setInventory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Stock movement dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [movementType, setMovementType] = useState<string>('inbound')
  const [movementQuantity, setMovementQuantity] = useState('')
  const [movementNotes, setMovementNotes] = useState('')
  const [movementReference, setMovementReference] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchInventory()
  }, [id])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/warehouses/${id}/inventory`)
      const data = await response.json()

      if (data.success) {
        setInventory(data.inventory)
      }
    } catch (err: any) {
      console.error('Error fetching inventory:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const openMovementDialog = (item: any, type: string) => {
    setSelectedItem(item)
    setMovementType(type)
    setMovementQuantity('')
    setMovementNotes('')
    setMovementReference('')
    setDialogOpen(true)
  }

  const closeMovementDialog = () => {
    setDialogOpen(false)
    setSelectedItem(null)
  }

  const handleStockMovement = async () => {
    if (!selectedItem || !movementQuantity) return

    setProcessing(true)
    setError(null)

    try {
      const response = await fetch(`/api/warehouses/${id}/movements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inventoryId: selectedItem.id,
          type: movementType,
          quantity: parseInt(movementQuantity),
          referenceNumber: movementReference || null,
          notes: movementNotes || null,
          performedBy: 'Admin' // You can replace with actual user
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create stock movement')
      }

      // Refresh inventory
      fetchInventory()
      closeMovementDialog()
    } catch (err: any) {
      console.error('Error creating movement:', err)
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  const getStockStatus = (quantity: number, reorderLevel: number) => {
    if (quantity === 0) return { label: 'Out of Stock', color: 'error' as const }
    if (quantity <= reorderLevel) return { label: 'Low Stock', color: 'warning' as const }

    return { label: 'In Stock', color: 'success' as const }
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
      <Grid size={5}>
        <Card>
          <CardHeader
            title={
              <Box display='flex' alignItems='center' gap={2}>
                <InventoryIcon sx={{ fontSize: 32 }} />
                <Typography variant='h5'>Manage Inventory</Typography>
              </Box>
            }
            action={
              <Box display='flex' gap={1}>
                <Button
                  component={Link}
                  href={`/en/apps/warehouses/${id}/inventory`}
                  variant='contained'
                  startIcon={<AddIcon />}
                >
                  Add Item
                </Button>
                <IconButton onClick={fetchInventory}>
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

      {/* Inventory Table */}
      <Grid size={12}>
        <Card>
          <CardContent>
            <TableContainer component={Paper} variant='outlined'>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>SKU</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Product Name</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Location</strong>
                    </TableCell>
                    <TableCell align='right'>
                      <strong>Quantity</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Status</strong>
                    </TableCell>
                    <TableCell align='right'>
                      <strong>Cost Price</strong>
                    </TableCell>
                    <TableCell align='center'>
                      <strong>Actions</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inventory.map(item => {
                    const status = getStockStatus(item.quantity, item.reorderLevel || 0)

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <strong>{item.sku}</strong>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>{item.productName}</Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {item.category || 'Uncategorized'}
                          </Typography>
                        </TableCell>
                        <TableCell>{item.location?.locationCode || 'Unassigned'}</TableCell>
                        <TableCell align='right'>
                          <Typography variant='body2'>
                            <strong>{item.quantity}</strong> {item.unit}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            Reorder at: {item.reorderLevel}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={status.label} color={status.color} size='small' />
                        </TableCell>
                        <TableCell align='right'>
                          {item.costPrice ? `KSh ${item.costPrice.toLocaleString()}` : 'N/A'}
                        </TableCell>
                        <TableCell align='center'>
                          <IconButton
                            size='small'
                            color='success'
                            onClick={() => openMovementDialog(item, 'inbound')}
                            title='Add Stock'
                          >
                            <AddIcon />
                          </IconButton>
                          <IconButton
                            size='small'
                            color='error'
                            onClick={() => openMovementDialog(item, 'outbound')}
                            title='Remove Stock'
                          >
                            <RemoveIcon />
                          </IconButton>
                          <IconButton
                            size='small'
                            color='primary'
                            onClick={() => openMovementDialog(item, 'transfer')}
                            title='Transfer'
                          >
                            <SwapHorizIcon />
                          </IconButton>
                          <IconButton
                            size='small'
                            color='warning'
                            onClick={() => openMovementDialog(item, 'adjustment')}
                            title='Adjust'
                          >
                            <TuneIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {inventory.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align='center'>
                        <Box py={3}>
                          <Typography variant='body2' color='text.secondary' gutterBottom>
                            No inventory items found
                          </Typography>
                          <Button
                            component={Link}
                            href={`/en/apps/warehouses/${id}/inventory`}
                            variant='contained'
                            startIcon={<AddIcon />}
                            sx={{ mt: 2 }}
                          >
                            Add First Item
                          </Button>
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

      {/* Stock Movement Dialog */}
      <Dialog open={dialogOpen} onClose={closeMovementDialog} maxWidth='sm' fullWidth>
        <DialogTitle>
          {movementType === 'inbound' && 'Add Stock'}
          {movementType === 'outbound' && 'Remove Stock'}
          {movementType === 'transfer' && 'Transfer Stock'}
          {movementType === 'adjustment' && 'Adjust Stock'}
        </DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box sx={{ pt: 2 }}>
              <Typography variant='body2' gutterBottom>
                <strong>Product:</strong> {selectedItem.productName}
              </Typography>
              <Typography variant='body2' gutterBottom>
                <strong>Current Quantity:</strong> {selectedItem.quantity} {selectedItem.unit}
              </Typography>

              <Box sx={{ mt: 3 }}>
                <Grid container spacing={2}>
                  <Grid>
                    <FormControl fullWidth>
                      <InputLabel>Movement Type</InputLabel>
                      <Select
                        value={movementType}
                        label='Movement Type'
                        onChange={e => setMovementType(e.target.value)}
                        IconComponent={SelectIcon}
                      >
                        <MenuItem value='inbound'>Inbound (Add)</MenuItem>
                        <MenuItem value='outbound'>Outbound (Remove)</MenuItem>
                        <MenuItem value='transfer'>Transfer</MenuItem>
                        <MenuItem value='adjustment'>Adjustment</MenuItem>
                        <MenuItem value='return'>Return</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid>
                    <TextField
                      fullWidth
                      required
                      label={movementType === 'adjustment' ? 'New Quantity' : 'Quantity'}
                      type='number'
                      value={movementQuantity}
                      onChange={e => setMovementQuantity(e.target.value)}
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                  <Grid>
                    <TextField
                      fullWidth
                      label='Reference Number'
                      value={movementReference}
                      onChange={e => setMovementReference(e.target.value)}
                      placeholder='e.g., PO-001, SO-002'
                    />
                  </Grid>
                  <Grid>
                    <TextField
                      fullWidth
                      label='Notes'
                      value={movementNotes}
                      onChange={e => setMovementNotes(e.target.value)}
                      multiline
                      rows={3}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeMovementDialog} disabled={processing}>
            Cancel
          </Button>
          <Button variant='contained' onClick={handleStockMovement} disabled={processing || !movementQuantity}>
            {processing ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}
