'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton } from '@mui/material'
import { Add, Edit, Delete } from '@mui/icons-material'

export default function UnitsPage() {
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', shortName: '', description: '' })

  const loadUnits = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/products/units')
      setUnits(res.data)
      setError('')
    } catch (err) {
      setError('Failed to load units')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUnits()
  }, [])

  const handleOpenDialog = () => {
    setFormData({ name: '', shortName: '', description: '' })
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setFormData({ name: '', shortName: '', description: '' })
  }

  const handleSave = async () => {
    try {
      await axios.post('/api/products/units', formData)
      handleCloseDialog()
      loadUnits()
    } catch (err) {
      alert('Failed to save unit')
      console.error(err)
    }
  }

  return (
    <div className='p-8'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-semibold'>Product Units</h1>
        <Button variant='contained' startIcon={<Add />} onClick={handleOpenDialog}>
          Add Unit
        </Button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className='text-red-600'>{error}</p>
      ) : units.length === 0 ? (
        <Card>
          <CardContent>
            <p>No units found.</p>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Short Name</strong></TableCell>
                <TableCell><strong>Description</strong></TableCell>
                <TableCell align='right'><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {units.map((unit) => (
                <TableRow key={unit.id} hover>
                  <TableCell>{unit.id}</TableCell>
                  <TableCell>{unit.name}</TableCell>
                  <TableCell><strong>{unit.shortName}</strong></TableCell>
                  <TableCell>{unit.description}</TableCell>
                  <TableCell align='right'>
                    <IconButton size='small' color='primary'>
                      <Edit fontSize='small' />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth='sm' fullWidth>
        <DialogTitle>Add Unit</DialogTitle>
        <DialogContent>
          <div className='space-y-4 mt-2'>
            <TextField
              fullWidth
              label='Unit Name'
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label='Short Name'
              value={formData.shortName}
              onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
              required
              helperText='e.g., kg, pc, L'
            />
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
          <Button onClick={handleSave} variant='contained' disabled={!formData.name || !formData.shortName}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
