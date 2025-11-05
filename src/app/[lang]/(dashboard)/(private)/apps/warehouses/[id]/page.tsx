'use client'

import { useState, useEffect, use } from 'react'

import Link from 'next/link'

import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Button,
  Grid
} from '@mui/material'

import WarehouseIcon from '@mui/icons-material/Warehouse'
import InventoryIcon from '@mui/icons-material/Inventory'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import EditIcon from '@mui/icons-material/Edit'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div role='tabpanel' hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

export default function WarehouseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [warehouse, setWarehouse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tabValue, setTabValue] = useState(0)

  useEffect(() => {
    fetchWarehouse()
  }, [id])

  const fetchWarehouse = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/warehouses/${id}`)
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch warehouse')
      }

      setWarehouse(data.warehouse)
    } catch (err: any) {
      console.error('Error fetching warehouse:', err)
      setError(err.message)
    } finally {
      setLoading(false)
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

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='400px'>
        <CircularProgress />
      </Box>
    )
  }

  if (error || !warehouse) {
    return <Alert severity='error'>{error || 'Warehouse not found'}</Alert>
  }

  return (
    <Grid container spacing={6}>
      {/* Header */}
      <Grid size={12}>
        <Card>
          <CardHeader
            title={
              <Box display='flex' alignItems='center' gap={2}>
                <WarehouseIcon sx={{ fontSize: 32 }} />
                <Typography variant='h4'>{warehouse.name}</Typography>
                <Chip label={warehouse.code} color='primary' />
                <Chip label={warehouse.status} color={getStatusColor(warehouse.status)} />
              </Box>
            }
            action={
              <Box display='flex' gap={1}>
                <Button
                  component={Link}
                  href={`/en/apps/warehouses/${warehouse.id}/manage`}
                  variant='contained'
                  color='primary'
                >
                  Manage Stock
                </Button>
                <Button
                  component={Link}
                  href={`/en/apps/warehouses/${warehouse.id}/movements`}
                  variant='outlined'
                  color='info'
                >
                  View Movements
                </Button>
                <Button
                  component={Link}
                  href={`/en/apps/warehouses/edit/${warehouse.id}`}
                  variant='outlined'
                  startIcon={<EditIcon />}
                >
                  Edit
                </Button>
              </Box>
            }
          />
        </Card>
      </Grid>

      {/* Overview Cards */}
      <Grid size={3}>
        <Card>
          <CardContent>
            <Box display='flex' flexDirection='column' alignItems='center' textAlign='center'>
              <InventoryIcon color='primary' sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant='body2' color='text.secondary' gutterBottom>
                Inventory Items
              </Typography>
              <Typography variant='h4' fontWeight='bold'>
                {warehouse._count.inventory}
              </Typography>
              {<Typography>Available</Typography>}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={3}>
        <Card>
          <CardContent>
            <Box display='flex' flexDirection='column' alignItems='center' textAlign='center'>
              <LocationOnIcon color='primary' sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant='body2' color='text.secondary' gutterBottom>
                Locations
              </Typography>
              <Typography variant='h4' fontWeight='bold'>
                {warehouse._count.locations}
              </Typography>
              {<Typography>Nairobi</Typography>}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={3}>
        <Card>
          <CardContent>
            <Box display='flex' flexDirection='column' alignItems='center' textAlign='center'>
              <SwapHorizIcon color='primary' sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant='body2' color='text.secondary' gutterBottom>
                Movements
              </Typography>
              <Typography variant='h4' fontWeight='bold'>
                {warehouse._count.movements}
              </Typography>
              {<Typography>Stock In & Out</Typography>}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={3}>
        <Card>
          <CardContent>
            <Box display='flex' flexDirection='column' alignItems='center' textAlign='center'>
              <WarehouseIcon color='primary' sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant='body2' color='text.secondary' gutterBottom>
                Capacity
              </Typography>
              <Typography variant='h4' fontWeight='bold'>
                {warehouse.capacity ? `${warehouse.capacity}` : 'N/A'}
              </Typography>
              {warehouse.capacity && <Typography>cubic meters</Typography>}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Details */}
      <Grid size={6}>
        <Card>
          <CardHeader title='Warehouse Details & Contact Information' />
          <CardContent>
            {/* Location Section */}
            <Box mb={4} pb={4} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant='subtitle2' gutterBottom fontWeight='bold' mb={2}>
                Location
              </Typography>
              <Box mb={3}>
                <Typography variant='caption' color='text.secondary' display='block' gutterBottom>
                  Address
                </Typography>
                <Typography variant='body1'>{warehouse.address || 'N/A'}</Typography>
              </Box>
              <Box display='flex' flexWrap='wrap' gap={3}>
                <Box flex='1 1 150px'>
                  <Typography variant='caption' color='text.secondary' display='block' gutterBottom>
                    City
                  </Typography>
                  <Typography variant='body1'>{warehouse.city || 'N/A'}</Typography>
                </Box>
                <Box flex='1 1 150px'>
                  <Typography variant='caption' color='text.secondary' display='block' gutterBottom>
                    State/Province
                  </Typography>
                  <Typography variant='body1'>{warehouse.state || 'N/A'}</Typography>
                </Box>
                <Box flex='1 1 150px'>
                  <Typography variant='caption' color='text.secondary' display='block' gutterBottom>
                    Country
                  </Typography>
                  <Typography variant='body1'>{warehouse.country || 'N/A'}</Typography>
                </Box>
                <Box flex='1 1 150px'>
                  <Typography variant='caption' color='text.secondary' display='block' gutterBottom>
                    Postal Code
                  </Typography>
                  <Typography variant='body1'>{warehouse.postalCode || 'N/A'}</Typography>
                </Box>
              </Box>
            </Box>

            {/* Contact Section */}
            <Box>
              <Typography variant='subtitle2' gutterBottom fontWeight='bold' mb={2}>
                Contact
              </Typography>
              <Box display='flex' flexWrap='wrap' gap={3}>
                <Box flex='1 1 200px'>
                  <Typography variant='caption' color='text.secondary' display='block' gutterBottom>
                    Manager
                  </Typography>
                  <Typography variant='body1'>{warehouse.managerName || 'Not Assigned'}</Typography>
                </Box>
                <Box flex='1 1 200px'>
                  <Typography variant='caption' color='text.secondary' display='block' gutterBottom>
                    Phone
                  </Typography>
                  <Typography variant='body1'>{warehouse.phone || 'Not Provided'}</Typography>
                </Box>
                <Box flex='1 1 200px'>
                  <Typography variant='caption' color='text.secondary' display='block' gutterBottom>
                    Email
                  </Typography>
                  <Typography variant='body1'>{warehouse.email || 'Not Provided'}</Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Tabs for Inventory, Locations, Movements */}
      <Grid size={6}>
        <Card>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label={`Inventory (${warehouse.inventory.length})`} />
            <Tab label={`Locations (${warehouse.locations.length})`} />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
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
                      <strong>Unit</strong>
                    </TableCell>
                    <TableCell align='right'>
                      <strong>Cost Price</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {warehouse.inventory.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell>{item.location?.locationCode || 'Unassigned'}</TableCell>
                      <TableCell align='right'>{item.quantity}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell align='right'>
                        {item.costPrice ? `KSh ${item.costPrice.toLocaleString()}` : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {warehouse.inventory.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align='center'>
                        <Typography variant='body2' color='text.secondary'>
                          No inventory items found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <TableContainer component={Paper} variant='outlined'>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Location Code</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Zone</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Aisle</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Rack</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Shelf</strong>
                    </TableCell>
                    <TableCell align='right'>
                      <strong>Capacity (m³)</strong>
                    </TableCell>
                    <TableCell align='right'>
                      <strong>Occupied (m³)</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {warehouse.locations.map((location: any) => (
                    <TableRow key={location.id}>
                      <TableCell>
                        <strong>{location.locationCode}</strong>
                      </TableCell>
                      <TableCell>{location.zone}</TableCell>
                      <TableCell>{location.aisle || 'N/A'}</TableCell>
                      <TableCell>{location.rack || 'N/A'}</TableCell>
                      <TableCell>{location.shelf || 'N/A'}</TableCell>
                      <TableCell align='right'>{location.capacity?.toFixed(2) || 'N/A'}</TableCell>
                      <TableCell align='right'>{location.occupied?.toFixed(2) || '0'}</TableCell>
                    </TableRow>
                  ))}
                  {warehouse.locations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align='center'>
                        <Typography variant='body2' color='text.secondary'>
                          No locations found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        </Card>
      </Grid>
    </Grid>
  )
}
