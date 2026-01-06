'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { useParams, useRouter } from 'next/navigation'
import { Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Card, CardContent, Select, MenuItem, FormControl, InputLabel } from '@mui/material'
import { Add, Edit, Delete, Category, Visibility } from '@mui/icons-material'

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({ name: '', slug: '', description: '', parent: 0 })
  const params = useParams()
  const router = useRouter()
  const lang = params?.lang || 'en'

  const loadCategories = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/products/categories')
      setCategories(res.data)
      setError('')
    } catch (err) {
      setError('Failed to load categories')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const handleOpenDialog = (category = null) => {
    if (category) {
      setEditingCategory(category)
      setFormData({ 
        name: category.name, 
        slug: category.slug, 
        description: category.description || '', 
        parent: category.parent || 0 
      })
    } else {
      setEditingCategory(null)
      setFormData({ name: '', slug: '', description: '', parent: 0 })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingCategory(null)
    setFormData({ name: '', slug: '', description: '', parent: 0 })
  }

  const handleSave = async () => {
    try {
      if (editingCategory) {
        await axios.put('/api/products/categories', { id: editingCategory.id, ...formData })
      } else {
        await axios.post('/api/products/categories', formData)
      }
      handleCloseDialog()
      loadCategories()
    } catch (err) {
      alert('Failed to save category')
      console.error(err)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return
    try {
      await axios.delete(`/api/products/categories?id=${id}`)
      loadCategories()
    } catch (err) {
      alert('Failed to delete category')
      console.error(err)
    }
  }

  return (
    <div className='p-8'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-semibold'>Product Categories</h1>
        <Button variant='contained' startIcon={<Add />} onClick={() => handleOpenDialog()}>
          Add Category
        </Button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className='text-red-600'>{error}</p>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent>
            <p>No categories found. Click "Add Category" to create one.</p>
          </CardContent>
        </Card>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {categories.map((category) => (
            <Card key={category.id}>
              <CardContent>
                <div className='flex justify-between items-start'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-2'>
                      <Category color='primary' />
                      <h3 className='text-lg font-semibold'>{category.name}</h3>
                    </div>
                    <p className='text-sm text-gray-500'>{category.slug}</p>
                    {category.description && <p className='text-sm mt-2'>{category.description}</p>}
                    <p className='text-xs text-gray-400 mt-2'>Products: {category.count || 0}</p>
                    <Button 
                      size='small' 
                      startIcon={<Visibility />} 
                      variant='outlined'
                      className='mt-3'
                      onClick={() => router.push(`/${lang}/apps/ecommerce/products/list?category=${category.id}`)}
                    >
                      View Products
                    </Button>
                  </div>
                  <div className='flex gap-1'>
                    <IconButton size='small' onClick={() => handleOpenDialog(category)}>
                      <Edit fontSize='small' />
                    </IconButton>
                    <IconButton size='small' onClick={() => handleDelete(category.id)}>
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
        <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
        <DialogContent>
          <div className='space-y-4 mt-2'>
            <TextField
              fullWidth
              label='Category Name'
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
            <FormControl fullWidth>
              <InputLabel>Parent Category</InputLabel>
              <Select
                value={formData.parent}
                onChange={(e) => setFormData({ ...formData, parent: e.target.value })}
                label='Parent Category'
              >
                <MenuItem value={0}>None (Top Level)</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
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
