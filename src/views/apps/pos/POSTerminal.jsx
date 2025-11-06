// POS Terminal Interface
'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  TextField,
  Divider,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert
} from '@mui/material'
import {
  Add,
  Remove,
  Delete,
  Search,
  Receipt,
  CreditCard,
  Money,
  QrCode,
  Print,
  Clear
} from '@mui/icons-material'

const POSTerminal = () => {
  // Cart state
  const [cart, setCart] = useState([])
  const [subtotal, setSubtotal] = useState(0)
  const [tax, setTax] = useState(0)
  const [total, setTotal] = useState(0)
  
  // UI state
  const [searchQuery, setSearchQuery] = useState('')
  const [products, setProducts] = useState([])
  const [paymentDialog, setPaymentDialog] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [cashTendered, setCashTendered] = useState('')
  const [change, setChange] = useState(0)

  // Sample products - Replace with real data
  const sampleProducts = [
    { id: '1', name: 'Coffee', price: 4.99, sku: 'COF001', image: '/images/coffee.jpg' },
    { id: '2', name: 'Croissant', price: 3.50, sku: 'CRO001', image: '/images/croissant.jpg' },
    { id: '3', name: 'Orange Juice', price: 5.99, sku: 'OJ001', image: '/images/oj.jpg' },
    { id: '4', name: 'Sandwich', price: 8.99, sku: 'SAN001', image: '/images/sandwich.jpg' }
  ]

  useEffect(() => {
    setProducts(sampleProducts)
  }, [])

  useEffect(() => {
    const newSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const newTax = newSubtotal * 0.08 // 8% tax rate
    setSubtotal(newSubtotal)
    setTax(newTax)
    setTotal(newSubtotal + newTax)
  }, [cart])

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id)
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
  }

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(id)
    } else {
      setCart(cart.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      ))
    }
  }

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id))
  }

  const clearCart = () => {
    setCart([])
  }

  const handlePayment = () => {
    setPaymentDialog(true)
    if (paymentMethod === 'cash') {
      setCashTendered(total.toFixed(2))
    }
  }

  const processPayment = () => {
    // Process payment logic here
    console.log('Processing payment:', {
      cart,
      subtotal,
      tax,
      total,
      paymentMethod,
      cashTendered: paymentMethod === 'cash' ? cashTendered : null
    })
    
    // Clear cart after successful payment
    setCart([])
    setPaymentDialog(false)
    setCashTendered('')
    
    // Show success message or receipt
    alert('Payment processed successfully!')
  }

  const calculateChange = () => {
    if (paymentMethod === 'cash' && cashTendered) {
      const changeAmount = parseFloat(cashTendered) - total
      setChange(changeAmount > 0 ? changeAmount : 0)
    }
  }

  useEffect(() => {
    calculateChange()
  }, [cashTendered, total, paymentMethod])

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Natural Options POS Terminal
        </Typography>
        <Typography variant="body2">
          Terminal #1 - Main Register
        </Typography>
      </Box>

      <Grid container sx={{ flex: 1 }}>
        {/* Products Section */}
        <Grid item xs={12} md={8} sx={{ p: 2 }}>
          {/* Search Bar */}
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Search products by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Box>

          {/* Product Grid */}
          <Grid container spacing={2}>
            {filteredProducts.map((product) => (
              <Grid item xs={6} sm={4} md={3} key={product.id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'scale(1.05)' }
                  }}
                  onClick={() => addToCart(product)}
                >
                  <CardContent sx={{ p: 2, textAlign: 'center' }}>
                    <Box
                      sx={{
                        width: '100%',
                        height: 80,
                        bgcolor: 'grey.200',
                        borderRadius: 1,
                        mb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Image
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {product.name}
                    </Typography>
                    <Typography variant="h6" color="primary">
                      ${product.price.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {product.sku}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Cart Section */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1 }}>
              {/* Cart Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Current Sale</Typography>
                <IconButton onClick={clearCart} disabled={cart.length === 0}>
                  <Clear />
                </IconButton>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Cart Items */}
              <Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
                {cart.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    Cart is empty
                  </Typography>
                ) : (
                  cart.map((item) => (
                    <Box key={item.id} sx={{ mb: 2, p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {item.name}
                        </Typography>
                        <IconButton size="small" onClick={() => removeFromCart(item.id)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <IconButton size="small" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                            <Remove fontSize="small" />
                          </IconButton>
                          <Typography sx={{ mx: 1 }}>{item.quantity}</Typography>
                          <IconButton size="small" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                            <Add fontSize="small" />
                          </IconButton>
                        </Box>
                        <Typography variant="body2">
                          ${(item.price * item.quantity).toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  ))
                )}
              </Box>

              <Divider />

              {/* Totals */}
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Subtotal:</Typography>
                  <Typography>${subtotal.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Tax (8%):</Typography>
                  <Typography>${tax.toFixed(2)}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Total:</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>${total.toFixed(2)}</Typography>
                </Box>

                {/* Payment Buttons */}
                <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={cart.length === 0}
                    onClick={handlePayment}
                    startIcon={<Receipt />}
                  >
                    Checkout
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onClose={() => setPaymentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Process Payment</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" sx={{ textAlign: 'center', mb: 1 }}>
              Total: ${total.toFixed(2)}
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>Select Payment Method:</Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant={paymentMethod === 'cash' ? 'contained' : 'outlined'}
                onClick={() => setPaymentMethod('cash')}
                startIcon={<Money />}
              >
                Cash
              </Button>
              <Button
                variant={paymentMethod === 'card' ? 'contained' : 'outlined'}
                onClick={() => setPaymentMethod('card')}
                startIcon={<CreditCard />}
              >
                Card
              </Button>
            </Box>
          </Box>

          {paymentMethod === 'cash' && (
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Cash Tendered"
                type="number"
                value={cashTendered}
                onChange={(e) => setCashTendered(e.target.value)}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
                }}
              />
              {change > 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Change: ${change.toFixed(2)}
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={processPayment}
            disabled={paymentMethod === 'cash' && (!cashTendered || parseFloat(cashTendered) < total)}
          >
            Process Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default POSTerminal
