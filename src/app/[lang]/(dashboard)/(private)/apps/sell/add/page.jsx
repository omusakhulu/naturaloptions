'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AddSalePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Form state
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [cartItems, setCartItems] = useState([])
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [discount, setDiscount] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')

  // Load customers and products
  useEffect(() => {
    const loadData = async () => {
      try {
        const [custRes, prodRes] = await Promise.all([
          fetch('/api/pos/customers'),
          fetch('/api/products/fetch-all?limit=100')
        ])
        
        if (custRes.ok) {
          const custData = await custRes.json()
          setCustomers(custData.customers || custData || [])
        }
        
        if (prodRes.ok) {
          const prodData = await prodRes.json()
          setProducts(prodData.products || prodData || [])
        }
      } catch (e) {
        console.error('Failed to load data:', e)
      }
    }
    loadData()
  }, [])

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const addToCart = (product) => {
    const existing = cartItems.find(item => item.productId === product.id)
    if (existing) {
      setCartItems(cartItems.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCartItems([...cartItems, {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        price: parseFloat(product.price || product.regularPrice || 0),
        quantity: 1
      }])
    }
  }

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      setCartItems(cartItems.filter(item => item.productId !== productId))
    } else {
      setCartItems(cartItems.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      ))
    }
  }

  const removeFromCart = (productId) => {
    setCartItems(cartItems.filter(item => item.productId !== productId))
  }

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const discountAmount = (subtotal * discount) / 100
  const total = subtotal - discountAmount

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (cartItems.length === 0) {
      setError('Please add at least one item to the cart')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/sell/pos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer || null,
          items: cartItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.price
          })),
          paymentMethod,
          discountPercent: discount,
          notes
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create sale')
      }

      const sale = await res.json()
      setSuccess(`Sale #${sale.saleNumber} created successfully!`)
      setCartItems([])
      setSelectedCustomer('')
      setNotes('')
      setDiscount(0)
      
      // Optionally redirect
      setTimeout(() => router.push('/en/apps/sell/sales'), 1500)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const saveDraft = async () => {
    if (cartItems.length === 0) {
      setError('Please add at least one item to save as draft')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/pos/parked-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer || null,
          cartItems,
          notes
        })
      })

      if (!res.ok) throw new Error('Failed to save draft')
      
      setSuccess('Draft saved successfully!')
      setCartItems([])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='p-6'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-semibold'>Add Sale / Manual Entry</h1>
        <div className='space-x-2'>
          <button
            onClick={saveDraft}
            disabled={loading || cartItems.length === 0}
            className='px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50'
          >
            Save as Draft
          </button>
        </div>
      </div>

      {error && (
        <div className='mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded'>
          {error}
        </div>
      )}

      {success && (
        <div className='mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded'>
          {success}
        </div>
      )}

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Product Selection */}
        <div className='lg:col-span-2 space-y-4'>
          <div className='bg-white border rounded-lg p-4'>
            <h2 className='font-medium mb-3'>Select Products</h2>
            <input
              type='text'
              placeholder='Search products by name or SKU...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-full border rounded px-3 py-2 mb-4'
            />
            <div className='grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto'>
              {filteredProducts.slice(0, 50).map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className='p-3 border rounded hover:bg-blue-50 hover:border-blue-300 text-left transition-colors'
                >
                  <div className='font-medium text-sm truncate'>{product.name}</div>
                  <div className='text-xs text-gray-500'>{product.sku || 'No SKU'}</div>
                  <div className='text-sm font-semibold mt-1'>
                    KES {parseFloat(product.price || product.regularPrice || 0).toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Cart Items */}
          <div className='bg-white border rounded-lg p-4'>
            <h2 className='font-medium mb-3'>Cart Items ({cartItems.length})</h2>
            {cartItems.length === 0 ? (
              <p className='text-gray-500 text-sm'>No items in cart. Click products above to add.</p>
            ) : (
              <table className='w-full'>
                <thead>
                  <tr className='text-left text-sm text-gray-600 border-b'>
                    <th className='pb-2'>Product</th>
                    <th className='pb-2 text-right'>Price</th>
                    <th className='pb-2 text-center'>Qty</th>
                    <th className='pb-2 text-right'>Total</th>
                    <th className='pb-2'></th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map(item => (
                    <tr key={item.productId} className='border-b'>
                      <td className='py-2'>
                        <div className='font-medium text-sm'>{item.name}</div>
                        <div className='text-xs text-gray-500'>{item.sku}</div>
                      </td>
                      <td className='py-2 text-right text-sm'>
                        KES {item.price.toLocaleString()}
                      </td>
                      <td className='py-2'>
                        <div className='flex items-center justify-center gap-2'>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className='w-6 h-6 border rounded hover:bg-gray-100'
                          >
                            -
                          </button>
                          <span className='w-8 text-center'>{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className='w-6 h-6 border rounded hover:bg-gray-100'
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className='py-2 text-right font-medium text-sm'>
                        KES {(item.price * item.quantity).toLocaleString()}
                      </td>
                      <td className='py-2 text-right'>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className='text-red-500 hover:text-red-700'
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Order Summary & Payment */}
        <div className='space-y-4'>
          <div className='bg-white border rounded-lg p-4'>
            <h2 className='font-medium mb-3'>Customer</h2>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className='w-full border rounded px-3 py-2'
            >
              <option value=''>Walk-in Customer</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} {c.email ? `(${c.email})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className='bg-white border rounded-lg p-4'>
            <h2 className='font-medium mb-3'>Payment Method</h2>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className='w-full border rounded px-3 py-2'
            >
              <option value='CASH'>Cash</option>
              <option value='CREDIT_CARD'>Credit Card</option>
              <option value='DEBIT_CARD'>Debit Card</option>
              <option value='DIGITAL_WALLET'>M-Pesa / Digital Wallet</option>
              <option value='CHECK'>Check</option>
            </select>
          </div>

          <div className='bg-white border rounded-lg p-4'>
            <h2 className='font-medium mb-3'>Discount (%)</h2>
            <input
              type='number'
              min='0'
              max='100'
              value={discount}
              onChange={(e) => setDiscount(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
              className='w-full border rounded px-3 py-2'
            />
          </div>

          <div className='bg-white border rounded-lg p-4'>
            <h2 className='font-medium mb-3'>Notes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder='Add any notes...'
              className='w-full border rounded px-3 py-2 h-20'
            />
          </div>

          <div className='bg-white border rounded-lg p-4'>
            <h2 className='font-medium mb-3'>Order Summary</h2>
            <div className='space-y-2 text-sm'>
              <div className='flex justify-between'>
                <span>Subtotal</span>
                <span>KES {subtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className='flex justify-between text-green-600'>
                  <span>Discount ({discount}%)</span>
                  <span>-KES {discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className='flex justify-between font-bold text-lg pt-2 border-t'>
                <span>Total</span>
                <span>KES {total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || cartItems.length === 0}
            className='w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {loading ? 'Processing...' : 'Complete Sale'}
          </button>
        </div>
      </div>
    </div>
  )
}
