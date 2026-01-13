'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'react-toastify'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

export default function AddSalesOrderPage() {
  const router = useRouter()
  const params = useParams()
  const lang = params?.lang || 'en'

  // Form state
  const [orderDate, setOrderDate] = useState(new Date())
  const [status, setStatus] = useState('processing')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  // Customer state
  const [customers, setCustomers] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [contactNumber, setContactNumber] = useState('')

  // Location state
  const [warehouses, setWarehouses] = useState([])
  const [selectedWarehouse, setSelectedWarehouse] = useState(null)

  // Product state
  const [products, setProducts] = useState([])
  const [productSearch, setProductSearch] = useState(null)
  const [lineItems, setLineItems] = useState([])

  // Loading states
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loadingWarehouses, setLoadingWarehouses] = useState(false)

  // Fetch initial data
  useEffect(() => {
    fetchCustomers()
    fetchProducts()
    fetchWarehouses()
  }, [])

  const fetchCustomers = async () => {
    setLoadingCustomers(true)
    try {
      const res = await fetch('/api/customers')
      const data = await res.json()
      if (data.success && data.customers) {
        setCustomers(data.customers)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
      toast.error('Failed to load customers')
    } finally {
      setLoadingCustomers(false)
    }
  }

  const fetchProducts = async () => {
    setLoadingProducts(true)
    try {
      const res = await fetch('/api/products/list')
      const data = await res.json()
      if (data.success && data.products) {
        setProducts(data.products)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to load products')
    } finally {
      setLoadingProducts(false)
    }
  }

  const fetchWarehouses = async () => {
    setLoadingWarehouses(true)
    try {
      const res = await fetch('/api/warehouses')
      const data = await res.json()
      if (data.success && data.warehouses) {
        setWarehouses(data.warehouses)
        if (data.warehouses.length > 0) {
          setSelectedWarehouse(data.warehouses[0])
        }
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error)
      toast.error('Failed to load locations')
    } finally {
      setLoadingWarehouses(false)
    }
  }

  // Handle customer selection
  const handleCustomerChange = (event, newValue) => {
    setSelectedCustomer(newValue)
    if (newValue) {
      // Try to parse billing address for phone
      try {
        const billing = newValue.billingAddress ? JSON.parse(newValue.billingAddress) : {}
        setContactNumber(billing.phone || '')
      } catch {
        setContactNumber('')
      }
    } else {
      setContactNumber('')
    }
  }

  // Handle product selection
  const handleProductSelect = (event, newValue) => {
    if (newValue) {
      const existingIndex = lineItems.findIndex(item => item.productId === newValue.id)
      if (existingIndex >= 0) {
        // Increase quantity if already in list
        const updated = [...lineItems]
        updated[existingIndex].quantity += 1
        updated[existingIndex].subtotal = updated[existingIndex].quantity * updated[existingIndex].price
        setLineItems(updated)
      } else {
        // Add new line item
        const price = parseFloat(newValue.price) || 0
        setLineItems([...lineItems, {
          productId: newValue.id,
          wooId: newValue.wooId,
          name: newValue.name,
          sku: newValue.sku || '',
          quantity: 1,
          price: price,
          discount: 0,
          tax: 0,
          subtotal: price
        }])
      }
      setProductSearch(null)
    }
  }

  // Update line item
  const updateLineItem = (index, field, value) => {
    const updated = [...lineItems]
    updated[index][field] = value
    
    // Recalculate subtotal
    const qty = parseFloat(updated[index].quantity) || 0
    const price = parseFloat(updated[index].price) || 0
    const discount = parseFloat(updated[index].discount) || 0
    const tax = parseFloat(updated[index].tax) || 0
    updated[index].subtotal = (qty * price) - discount + tax
    
    setLineItems(updated)
  }

  // Remove line item
  const removeLineItem = (index) => {
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.price), 0)
    const totalDiscount = lineItems.reduce((sum, item) => sum + (parseFloat(item.discount) || 0), 0)
    const totalTax = lineItems.reduce((sum, item) => sum + (parseFloat(item.tax) || 0), 0)
    const total = subtotal - totalDiscount + totalTax
    return { subtotal, totalDiscount, totalTax, total }
  }

  const { subtotal, totalDiscount, totalTax, total } = calculateTotals()

  // Handle save
  const handleSave = async (isDraft = false) => {
    if (!selectedCustomer) {
      toast.error('Please select a customer')
      return
    }
    if (lineItems.length === 0) {
      toast.error('Please add at least one product')
      return
    }

    setSaving(true)
    try {
      // Prepare order data for WooCommerce-style API
      const orderData = {
        items: lineItems.map(item => ({
          id: item.productId,
          wooId: item.wooId,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        subtotal: subtotal,
        discount: totalDiscount,
        discountAmount: totalDiscount,
        tax: totalTax,
        total: total,
        customer: selectedCustomer ? {
          id: selectedCustomer.id,
          firstName: selectedCustomer.firstName,
          lastName: selectedCustomer.lastName,
          email: selectedCustomer.email
        } : null,
        paymentMethod: 'cash',
        status: isDraft ? 'pending' : status,
        notes: notes,
        warehouseId: selectedWarehouse?.id
      }

      console.log('Sending order data:', orderData)
      const res = await fetch('/api/pos/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      console.log('Response status:', res.status)
      const text = await res.text()
      console.log('Response text:', text)

      let result
      try {
        result = text.trim() ? JSON.parse(text) : {}
      } catch (e) {
        console.error('Failed to parse JSON response:', text)
        toast.error('Invalid response from server. Check console for details.')
        setSaving(false)
        return
      }

      if (res.ok && result.success) {
        toast.success(isDraft ? 'Draft saved successfully' : 'Sales order created successfully')
        router.push(`/${lang}/apps/sell/sales-order`)
      } else {
        toast.error(result.error || 'Failed to save sales order')
      }
    } catch (error) {
      console.error('Error saving sales order:', error)
      toast.error('An error occurred while saving')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='p-8 space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>Add Sales Order</h1>
        <div className='space-x-2'>
          <button 
            onClick={() => router.push(`/${lang}/apps/sell/sales-order`)}
            className='border rounded px-4 py-2 text-sm'
          >
            Cancel
          </button>
          <button 
            onClick={() => handleSave(true)}
            disabled={saving}
            className='border rounded px-4 py-2 text-sm'
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button 
            onClick={() => handleSave(false)}
            disabled={saving}
            className='bg-indigo-600 hover:bg-indigo-700 text-white rounded px-4 py-2 text-sm'
          >
            {saving ? 'Saving...' : 'Save Order'}
          </button>
        </div>
      </div>

      {/* Customer & Order Info */}
      <div className='bg-white border rounded shadow p-4 grid grid-cols-1 md:grid-cols-3 gap-4'>
        <div>
          <label className='block text-xs text-gray-500 mb-1'>Customer *</label>
          <Autocomplete
            options={customers}
            getOptionLabel={(option) => `${option.firstName || ''} ${option.lastName || ''}`.trim() || option.email || 'Unknown'}
            value={selectedCustomer}
            onChange={handleCustomerChange}
            loading={loadingCustomers}
            renderInput={(params) => (
              <TextField
                {...params}
                size='small'
                placeholder='Search customer...'
                variant='outlined'
              />
            )}
            isOptionEqualToValue={(option, value) => option.id === value?.id}
          />
        </div>
        <div>
          <label className='block text-xs text-gray-500 mb-1'>Contact Number</label>
          <input 
            className='border rounded p-2 w-full text-sm' 
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            placeholder='Phone number'
          />
        </div>
        <div>
          <label className='block text-xs text-gray-500 mb-1'>Location</label>
          <Autocomplete
            options={warehouses}
            getOptionLabel={(option) => option.name || ''}
            value={selectedWarehouse}
            onChange={(e, newValue) => setSelectedWarehouse(newValue)}
            loading={loadingWarehouses}
            renderInput={(params) => (
              <TextField
                {...params}
                size='small'
                placeholder='Select location...'
                variant='outlined'
              />
            )}
            isOptionEqualToValue={(option, value) => option.id === value?.id}
          />
        </div>
        <div>
          <label className='block text-xs text-gray-500 mb-1'>Order Date</label>
          <DatePicker
            selected={orderDate}
            onChange={(date) => setOrderDate(date)}
            className='border rounded p-2 w-full text-sm'
            dateFormat='yyyy-MM-dd'
          />
        </div>
        <div>
          <label className='block text-xs text-gray-500 mb-1'>Status</label>
          <select 
            className='border rounded p-2 w-full text-sm'
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value='pending'>Pending</option>
            <option value='processing'>Processing</option>
            <option value='completed'>Completed</option>
            <option value='cancelled'>Cancelled</option>
          </select>
        </div>
      </div>

      {/* Products */}
      <div className='bg-white border rounded shadow p-4 space-y-3'>
        <div className='flex items-center gap-2'>
          <div className='flex-1'>
            <Autocomplete
              options={products}
              getOptionLabel={(option) => `${option.name} ${option.sku ? `(${option.sku})` : ''}`}
              value={productSearch}
              onChange={handleProductSelect}
              loading={loadingProducts}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size='small'
                  placeholder='Search product by name or SKU...'
                  variant='outlined'
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <div className='flex justify-between w-full'>
                    <span>{option.name}</span>
                    <span className='text-gray-500 text-sm'>KSh {parseFloat(option.price || 0).toLocaleString()}</span>
                  </div>
                </li>
              )}
              isOptionEqualToValue={(option, value) => option.id === value?.id}
            />
          </div>
        </div>
        <div className='overflow-auto'>
          <table className='min-w-full text-sm'>
            <thead>
              <tr className='bg-gray-50 text-gray-600'>
                <th className='text-left font-medium px-3 py-2 border-b'>#</th>
                <th className='text-left font-medium px-3 py-2 border-b'>Product</th>
                <th className='text-left font-medium px-3 py-2 border-b w-24'>Qty</th>
                <th className='text-left font-medium px-3 py-2 border-b w-32'>Price</th>
                <th className='text-left font-medium px-3 py-2 border-b w-28'>Discount</th>
                <th className='text-left font-medium px-3 py-2 border-b w-28'>Tax</th>
                <th className='text-right font-medium px-3 py-2 border-b'>Subtotal</th>
                <th className='px-3 py-2 border-b w-16'>Action</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className='text-center text-gray-500 py-8'>No items added. Search and select products above.</td>
                </tr>
              ) : (
                lineItems.map((item, index) => (
                  <tr key={index} className='border-b hover:bg-gray-50'>
                    <td className='px-3 py-2'>{index + 1}</td>
                    <td className='px-3 py-2'>
                      <div>{item.name}</div>
                      {item.sku && <div className='text-xs text-gray-500'>SKU: {item.sku}</div>}
                    </td>
                    <td className='px-3 py-2'>
                      <input
                        type='number'
                        min='1'
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        className='border rounded p-1 w-20 text-sm'
                      />
                    </td>
                    <td className='px-3 py-2'>
                      <input
                        type='number'
                        min='0'
                        step='0.01'
                        value={item.price}
                        onChange={(e) => updateLineItem(index, 'price', parseFloat(e.target.value) || 0)}
                        className='border rounded p-1 w-28 text-sm'
                      />
                    </td>
                    <td className='px-3 py-2'>
                      <input
                        type='number'
                        min='0'
                        step='0.01'
                        value={item.discount}
                        onChange={(e) => updateLineItem(index, 'discount', parseFloat(e.target.value) || 0)}
                        className='border rounded p-1 w-24 text-sm'
                      />
                    </td>
                    <td className='px-3 py-2'>
                      <input
                        type='number'
                        min='0'
                        step='0.01'
                        value={item.tax}
                        onChange={(e) => updateLineItem(index, 'tax', parseFloat(e.target.value) || 0)}
                        className='border rounded p-1 w-24 text-sm'
                      />
                    </td>
                    <td className='px-3 py-2 text-right font-medium'>
                      KSh {item.subtotal.toLocaleString()}
                    </td>
                    <td className='px-3 py-2 text-center'>
                      <button
                        type='button'
                        onClick={() => removeLineItem(index)}
                        className='text-red-600 hover:text-red-800'
                        title='Remove'
                      >
                        <i className='tabler-trash' />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className='bg-white border rounded shadow p-4 grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='space-y-3'>
          <div>
            <label className='block text-xs text-gray-500 mb-1'>Notes</label>
            <textarea 
              className='border rounded p-2 w-full text-sm' 
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder='Order notes...'
            />
          </div>
        </div>
        <div className='space-y-2'>
          <div className='flex items-center justify-between text-sm'>
            <span>Subtotal</span>
            <span>KSh {subtotal.toLocaleString()}</span>
          </div>
          <div className='flex items-center justify-between text-sm'>
            <span>Discount</span>
            <span className='text-red-600'>- KSh {totalDiscount.toLocaleString()}</span>
          </div>
          <div className='flex items-center justify-between text-sm'>
            <span>Tax</span>
            <span>KSh {totalTax.toLocaleString()}</span>
          </div>
          <div className='border-t pt-2 flex items-center justify-between font-medium text-lg'>
            <span>Total</span>
            <span className='text-indigo-600'>KSh {total.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
