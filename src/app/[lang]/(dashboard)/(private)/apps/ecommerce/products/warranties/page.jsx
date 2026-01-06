'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Select, MenuItem, FormControl, InputLabel } from '@mui/material'
import { Add, Delete, Shield } from '@mui/icons-material'

export default function WarrantiesPage() {
  const [warranties, setWarranties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', duration: '', durationType: 'months', description: '' })

  const loadWarranties = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/products/warranties')
      setWarranties(res.data)
      setError('')
    } catch (err) {
      setError('Failed to load warranties')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWarranties()
  }, [])

  const handleOpenDialog = () => {
    setFormData({ name: '', duration: '', durationType: 'months', description: '' })
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setFormData({ name: '', duration: '', durationType: 'months', description: '' })
  }

  const handleSave = async () => {
    try {
      await axios.post('/api/products/warranties', formData)
      handleCloseDialog()
      loadWarranties()
    } catch (err) {
      alert('Failed to save warranty')
      console.error(err)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this warranty?')) return
    try {
      await axios.delete(`/api/products/warranties?id=${id}`)
      loadWarranties()
    } catch (err) {
      alert('Failed to delete warranty')
      console.error(err)
    }
  }

  return (
    <div className='p-8'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-semibold'>Product Warranties</h1>
        <Button variant='contained' startIcon={<Add />} onClick={handleOpenDialog}>
          Add Warranty
        </Button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className='text-red-600'>{error}</p>
      ) : warranties.length === 0 ? (
        <Card>
          <CardContent>
            <p>No warranties found.</p>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Duration</strong></TableCell>
                <TableCell><strong>Description</strong></TableCell>
                <TableCell align='right'><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {warranties.map((warranty) => (
                <TableRow key={warranty.id} hover>
                  <TableCell>{warranty.id}</TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <Shield color='primary' fontSize='small' />
                      {warranty.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    {warranty.durationType === 'lifetime' ? 'Lifetime' : `${warranty.duration} ${warranty.durationType}`}
                  </TableCell>
                  <TableCell>{warranty.description}</TableCell>
                  <TableCell align='right'>
                    <IconButton size='small' color='error' onClick={() => handleDelete(warranty.id)}>
                      <Delete fontSize='small' />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth='sm' fullWidth>
        <DialogTitle>Add Warranty</DialogTitle>
        <DialogContent>
          <div className='space-y-4 mt-2'>
            <TextField
              fullWidth
              label='Warranty Name'
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <div className='flex gap-2'>
              <TextField
                label='Duration'
                type='number'
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                required
                sx={{ flex: 1 }}
              />
              <FormControl sx={{ flex: 1 }}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.durationType}
                  onChange={(e) => setFormData({ ...formData, durationType: e.target.value })}
                  label='Type'
                >
                  <MenuItem value='months'>Months</MenuItem>
                  <MenuItem value='years'>Years</MenuItem>
                  <MenuItem value='lifetime'>Lifetime</MenuItem>
                </Select>
              </FormControl>
            </div>
            <TextField
              fullWidth
              label='Description'
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={2}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant='contained' disabled={!formData.name || !formData.duration}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
