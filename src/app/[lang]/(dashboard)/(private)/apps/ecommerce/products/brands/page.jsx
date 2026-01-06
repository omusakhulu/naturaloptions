'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Card, CardContent } from '@mui/material'
import { Add, Edit, Delete } from '@mui/icons-material'

export default function BrandsPage() {
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState(null)
  const [formData, setFormData] = useState({ name: '', slug: '', description: '' })

  const loadBrands = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/products/brands')
      setBrands(res.data)
      setError('')
    } catch (err) {
      setError('Failed to load brands')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBrands()
  }, [])

  const handleOpenDialog = (brand = null) => {
    if (brand) {
      setEditingBrand(brand)
      setFormData({ name: brand.name, slug: brand.slug, description: brand.description || '' })
    } else {
      setEditingBrand(null)
      setFormData({ name: '', slug: '', description: '' })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingBrand(null)
    setFormData({ name: '', slug: '', description: '' })
  }

  const handleSave = async () => {
    try {
      if (editingBrand) {
        await axios.put('/api/products/brands', { id: editingBrand.id, ...formData })
      } else {
        await axios.post('/api/products/brands', formData)
      }
      handleCloseDialog()
      loadBrands()
    } catch (err) {
      alert('Failed to save brand')
      console.error(err)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this brand?')) return
    try {
      await axios.delete(`/api/products/brands?id=${id}`)
      loadBrands()
    } catch (err) {
      alert('Failed to delete brand')
      console.error(err)
    }
  }

  return (
    <div className='p-8'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-semibold'>Product Brands</h1>
        <Button variant='contained' startIcon={<Add />} onClick={() => handleOpenDialog()}>
          Add Brand
        </Button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className='text-red-600'>{error}</p>
      ) : brands.length === 0 ? (
        <Card>
          <CardContent>
            <p>No brands found. Click "Add Brand" to create one.</p>
          </CardContent>
        </Card>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {brands.map((brand) => (
            <Card key={brand.id}>
              <CardContent>
                <div className='flex justify-between items-start'>
                  <div>
                    <h3 className='text-lg font-semibold'>{brand.name}</h3>
                    <p className='text-sm text-gray-500'>{brand.slug}</p>
                    {brand.description && <p className='text-sm mt-2'>{brand.description}</p>}
                    <p className='text-xs text-gray-400 mt-2'>Count: {brand.count || 0}</p>
                  </div>
                  <div className='flex gap-1'>
                    <IconButton size='small' onClick={() => handleOpenDialog(brand)}>
                      <Edit fontSize='small' />
                    </IconButton>
                    <IconButton size='small' onClick={() => handleDelete(brand.id)}>
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
        <DialogTitle>{editingBrand ? 'Edit Brand' : 'Add Brand'}</DialogTitle>
        <DialogContent>
          <div className='space-y-4 mt-2'>
            <TextField
              fullWidth
              label='Brand Name'
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label='Slug'
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
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
