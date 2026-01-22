'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Card, CardContent, IconButton, Chip } from '@mui/material'
import { Add, Edit, Delete, Discount } from '@mui/icons-material'

export default function SellingPriceGroupPage() {
  const [priceGroups, setPriceGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState(null)
  const [formData, setFormData] = useState({ name: '', description: '', discount: 0 })

  const loadPriceGroups = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/products/selling-price-groups')
      setPriceGroups(res.data)
      setError('')
    } catch (err) {
      setError('Failed to load price groups')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPriceGroups()
  }, [])

  const handleOpenDialog = (group = null) => {
    if (group) {
      setEditingGroup(group)
      setFormData({ name: group.name, description: group.description || '', discount: group.discount || 0 })
    } else {
      setEditingGroup(null)
      setFormData({ name: '', description: '', discount: 0 })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingGroup(null)
    setFormData({ name: '', description: '', discount: 0 })
  }

  const handleSave = async () => {
    try {
      if (editingGroup) {
        await axios.put('/api/products/selling-price-groups', { id: editingGroup.id, ...formData })
      } else {
        await axios.post('/api/products/selling-price-groups', formData)
      }
      handleCloseDialog()
      loadPriceGroups()
    } catch (err) {
      alert('Failed to save price group')
      console.error(err)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this price group?')) return
    try {
      await axios.delete(`/api/products/selling-price-groups?id=${id}`)
      loadPriceGroups()
    } catch (err) {
      alert('Failed to delete price group')
      console.error(err)
    }
  }

  return (
    <div className='p-8'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-semibold'>Selling Price Groups</h1>
        <Button variant='contained' startIcon={<Add />} onClick={() => handleOpenDialog()}>
          Add Price Group
        </Button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className='text-red-600'>{error}</p>
      ) : priceGroups.length === 0 ? (
        <Card>
          <CardContent>
            <p>No price groups found. Click "Add Price Group" to create one.</p>
          </CardContent>
        </Card>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {priceGroups.map((group) => (
            <Card key={group.id}>
              <CardContent>
                <div className='flex justify-between items-start'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-2 mb-2'>
                      <Discount color='primary' />
                      <h3 className='text-lg font-semibold'>{group.name}</h3>
                    </div>
                    <Chip 
                      label={`${group.discount}% Discount`} 
                      color={group.discount > 0 ? 'success' : 'default'} 
                      size='small'
                      className='mb-2'
                    />
                    {group.description && <p className='text-sm mt-2'>{group.description}</p>}
                  </div>
                  <div className='flex gap-1'>
                    <IconButton size='small' onClick={() => handleOpenDialog(group)}>
                      <Edit fontSize='small' />
                    </IconButton>
                    <IconButton size='small' onClick={() => handleDelete(group.id)}>
                      <Delete fontSize='small' />
                    </IconButton>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth='sm' fullWidth>
        <DialogTitle>{editingGroup ? 'Edit Price Group' : 'Add Price Group'}</DialogTitle>
        <DialogContent>
          <div className='space-y-4 mt-2'>
            <TextField
              fullWidth
              label='Group Name'
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label='Discount Percentage'
              type='number'
              value={formData.discount}
              onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
              inputProps={{ min: 0, max: 100, step: 0.1 }}
              helperText='Enter discount percentage (0-100)'
            />
            <TextField
              fullWidth
              label='Description'
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant='contained' disabled={!formData.name}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
