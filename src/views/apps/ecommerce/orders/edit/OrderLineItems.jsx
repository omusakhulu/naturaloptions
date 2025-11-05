'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Typography from '@mui/material/Typography'
import Autocomplete from '@mui/material/Autocomplete'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

const OrderLineItems = ({ lineItems = [], onUpdate }) => {
  const ensureItemId = (item, idx = 0) => {
    const candidate = item?.id || item?.item_id || item?.product_id || item?.variation_id
    if (candidate) return String(candidate)
    return `${item?.name || 'item'}-${item?.price || item?.total || 0}-${idx}-${Math.random().toString(36).slice(2, 8)}`
  }

  const [items, setItems] = useState(() =>
    Array.isArray(lineItems) ? lineItems.map((it, i) => ({ id: ensureItemId(it, i), ...it })) : []
  )
  const [openDialog, setOpenDialog] = useState(false)
  const [products, setProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [newItem, setNewItem] = useState({
    product_id: undefined,
    variation_id: undefined,
    name: '',
    quantity: 1,
    price: 0
  })

  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products/list')
        if (response.ok) {
          const data = await response.json()
          const list = Array.isArray(data.products) ? data.products : []
          const withKeys = list.map((p, idx) => ({ ...p, uid: ensureItemId(p, idx) }))
          setProducts(withKeys)
        }
      } catch (error) {
        console.error('Failed to fetch products:', error)
      }
    }

    fetchProducts()
  }, [])

  const handleAddItem = () => {
    if (!newItem.product_id) {
      alert('Please select a product to add to the order')
      return
    }
    if (!newItem.name || newItem.quantity <= 0 || newItem.price < 0) {
      alert('Please fill in all fields correctly')
      return
    }

    const updatedItems = [
      ...items,
      {
        id: ensureItemId(newItem, items.length),
        ...newItem,
        quantity: parseInt(newItem.quantity),
        price: parseFloat(newItem.price)
      }
    ]

    setItems(updatedItems)
    onUpdate(updatedItems)
    setNewItem({ product_id: undefined, variation_id: undefined, name: '', quantity: 1, price: 0 })
    setSelectedProduct(null)
    setOpenDialog(false)
  }

  const handleProductSelect = product => {
    if (product) {
      setSelectedProduct(product)
      setNewItem({
        product_id: product.wooId || product.id,
        name: product.name,
        quantity: 1,
        price: parseFloat(product.regularPrice || product.price || 0)
      })
    }
  }

  const handleRemoveItem = id => {
    const updatedItems = items.filter(item => item.id !== id)
    setItems(updatedItems)
    onUpdate(updatedItems)
  }

  const handleQuantityChange = (id, newQuantity) => {
    const qty = parseInt(newQuantity)
    if (qty > 0) {
      const updatedItems = items.map(item => (item.id === id ? { ...item, quantity: qty } : item))
      setItems(updatedItems)
      onUpdate(updatedItems)
    }
  }

  const handlePriceChange = (id, newPrice) => {
    const price = parseFloat(newPrice)
    if (price >= 0) {
      const updatedItems = items.map(item => (item.id === id ? { ...item, price } : item))
      setItems(updatedItems)
      onUpdate(updatedItems)
    }
  }

  const calculateTotal = () => {
    return items.reduce((total, item) => total + item.quantity * item.price, 0).toFixed(2)
  }

  return (
    <Card>
      <CardHeader
        title='Order Line Items'
        action={
          <Button variant='contained' size='small' onClick={() => setOpenDialog(true)}>
            Add Product
          </Button>
        }
      />
      <CardContent>
        {items.length === 0 ? (
          <Typography color='textSecondary'>No products in this order</Typography>
        ) : (
          <>
            <div className='overflow-x-auto'>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product Name</TableCell>
                    <TableCell align='right'>Quantity</TableCell>
                    <TableCell align='right'>Price</TableCell>
                    <TableCell align='right'>Total</TableCell>
                    <TableCell align='center'>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell align='right'>
                        <CustomTextField
                          type='number'
                          size='small'
                          value={item.quantity}
                          onChange={e => handleQuantityChange(item.id, e.target.value)}
                          inputProps={{ min: 1 }}
                          className='w-20'
                        />
                      </TableCell>
                      <TableCell align='right'>
                        <CustomTextField
                          type='number'
                          size='small'
                          value={item.price}
                          onChange={e => handlePriceChange(item.id, e.target.value)}
                          inputProps={{ min: 0, step: 0.01 }}
                          className='w-24'
                        />
                      </TableCell>
                      <TableCell align='right'>${(item.quantity * item.price).toFixed(2)}</TableCell>
                      <TableCell align='center'>
                        <IconButton size='small' onClick={() => handleRemoveItem(item.id)} color='error'>
                          <i className='tabler-trash' />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} align='right'>
                      <Typography className='font-semibold'>Order Total:</Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Typography className='font-semibold'>${calculateTotal()}</Typography>
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>

      {/* Add Product Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Add Product to Order</DialogTitle>
        <DialogContent className='pt-4'>
          <Grid container spacing={4}>
            <Grid size={12}>
              <Autocomplete
                fullWidth
                options={products}
                getOptionLabel={option => `${option.name} - $${option.regularPrice || option.price || 0}`}
                isOptionEqualToValue={(opt, val) => (opt.wooId || opt.id) === (val?.wooId || val?.id)}
                value={selectedProduct}
                onChange={(event, value) => handleProductSelect(value)}
                renderOption={(props, option) => (
                  <li {...props} key={String(option.uid || ensureItemId(option))}>
                    {`${option.name} - $${option.regularPrice || option.price || 0}`}
                  </li>
                )}
                renderInput={params => (
                  <CustomTextField {...params} label='Search Products' placeholder='Type to search products...' />
                )}
                noOptionsText='No products found'
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                type='number'
                label='Quantity'
                value={newItem.quantity}
                onChange={e => setNewItem({ ...newItem, quantity: e.target.value })}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                type='number'
                label='Price'
                value={newItem.price}
                onChange={e => setNewItem({ ...newItem, price: e.target.value })}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenDialog(false)
              setSelectedProduct(null)
              setNewItem({ name: '', quantity: 1, price: 0 })
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleAddItem} variant='contained' disabled={!selectedProduct}>
            Add Product
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default OrderLineItems
