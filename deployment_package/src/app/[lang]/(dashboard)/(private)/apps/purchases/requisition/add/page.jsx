'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { toast } from 'react-toastify'

export default function AddPurchaseRequisitionPage() {
  const router = useRouter()
  const { lang } = useParams()

  // Form states
  const [brand, setBrand] = useState('')
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('NATURAL OPTIONS (BL0001)')
  const [referenceNo, setReferenceNo] = useState('')
  const [requiredDate, setRequiredDate] = useState(new Date())
  const [priority, setPriority] = useState('NORMAL')
  const [notes, setNotes] = useState('')

  // Data states
  const [brands, setBrands] = useState([])
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [selectedItems, setSelectedItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [brandsRes, catsRes] = await Promise.all([
          fetch('/api/products/brands'),
          fetch('/api/products/categories')
        ])
        
        const brandsData = await brandsRes.json()
        const catsData = await catsRes.json()
        
        setBrands(Array.isArray(brandsData) ? brandsData : [])
        setCategories(Array.isArray(catsData) ? catsData : [])
      } catch (error) {
        console.error('Error fetching filters:', error)
      }
    }
    fetchData()
  }, [])

  const handleShowProducts = async () => {
    setSearching(true)
    try {
      const res = await fetch('/api/products/list')
      const data = await res.json()
      if (data.success) {
        // Filter by brand/category if selected
        let filtered = data.products
        if (brand) {
          filtered = filtered.filter(p => p.brand === brand)
        }
        if (category) {
          filtered = filtered.filter(p => 
            p.categories && p.categories.some(c => c.name === category || c.slug === category)
          )
        }
        setProducts(filtered)
        if (filtered.length === 0) {
          toast.info('No products found matching filters')
        }
      }
    } catch (error) {
      toast.error('Failed to fetch products')
    } finally {
      setSearching(false)
    }
  }

  const addItem = (product) => {
    setSelectedItems(prev => {
      const exists = prev.some(item => String(item.id) === String(product.id))
      if (exists) {
        toast.warn('Product already added')
        return prev
      }

      return [
        ...prev,
        {
          id: product.id,
          sku: product.sku,
          productName: product.name,
          quantity: 1,
          alertQuantity: product.stockQuantity || 0,
          estimatedPrice: product.price || 0
        }
      ]
    })
  }

  const removeItem = (id) => {
    setSelectedItems(selectedItems.filter(item => item.id !== id))
  }

  const updateQuantity = (id, qty) => {
    setSelectedItems(selectedItems.map(item => 
      item.id === id ? { ...item, quantity: parseFloat(qty) || 0 } : item
    ))
  }

  const handleSave = async () => {
    if (selectedItems.length === 0) {
      toast.error('Please add at least one product')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/purchases/requisitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestedBy: 'System', // Replace with actual user ID when auth is ready
          requiredDate,
          priority,
          notes,
          items: selectedItems.map(item => ({
            sku: item.sku,
            productName: item.productName,
            quantity: item.quantity,
            alertQuantity: item.alertQuantity,
            estimatedPrice: item.estimatedPrice
          }))
        })
      })

      if (res.ok) {
        toast.success('Purchase requisition created successfully')
        router.push(`/${lang}/apps/purchases/requisition`)
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to create requisition')
      }
    } catch (error) {
      toast.error('An error occurred while saving')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='p-8 space-y-6'>
      <h1 className='text-2xl font-semibold'>Add Purchase Requisition</h1>

      {/* Top filters */}
      <div className='bg-white border rounded shadow p-6 space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div>
            <label className='block text-sm font-medium mb-1'>Brand:</label>
            <select 
              className='w-full border p-2 rounded text-sm'
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            >
              <option value=''>All Brands</option>
              {brands.map(b => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>Category:</label>
            <select 
              className='w-full border p-2 rounded text-sm'
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value=''>All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>Business Location:</label>
            <select 
              className='w-full border p-2 rounded text-sm'
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option>NATURAL OPTIONS (BL0001)</option>
            </select>
          </div>
        </div>
        <div className='flex gap-4 items-center'>
          <button 
            onClick={handleShowProducts}
            disabled={searching}
            className='bg-yellow-500 text-white px-4 py-2 rounded flex items-center hover:bg-yellow-600 disabled:opacity-50'
          >
            <i className={searching ? 'tabler-loader animate-spin mr-1' : 'tabler-search mr-1'} /> 
            {searching ? 'Searching...' : 'Show products'}
          </button>
          
          {products.length > 0 && (
            <div className='flex-1'>
              <select 
                className='w-full border p-2 rounded text-sm'
                value={selectedProductId}
                onChange={(e) => {
                  const value = e.target.value
                  setSelectedProductId(value)
                  const p = products.find(prod => String(prod.id) === String(value))
                  if (p) {
                    addItem(p)
                    setSelectedProductId('')
                  }
                }}
              >
                <option value='' disabled>Select product to add...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Requisition Details */}
      <div className='bg-white border rounded shadow p-6 space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-medium mb-1'>Reference No:</label>
            <input 
              className='w-full border p-2 rounded text-sm bg-gray-50' 
              placeholder='Auto-generated' 
              disabled
            />
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>Required by date:</label>
            <DatePicker
              selected={requiredDate}
              onChange={d => setRequiredDate(d)}
              className='w-full border p-2 rounded text-sm'
              placeholderText='Select date'
            />
          </div>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-medium mb-1'>Priority:</label>
            <select 
              className='w-full border p-2 rounded text-sm'
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value='NORMAL'>Normal</option>
              <option value='URGENT'>Urgent</option>
              <option value='LOW'>Low</option>
            </select>
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>Notes:</label>
            <textarea 
              className='w-full border p-2 rounded text-sm' 
              rows={1}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder='Add any internal notes here...'
            />
          </div>
        </div>
      </div>

      {/* Selected Products Table */}
      <div className='bg-white border rounded shadow overflow-hidden'>
        <table className='min-w-full text-sm'>
          <thead className='bg-gray-100'>
            <tr>
              <th className='border px-4 py-2 text-left'>Product</th>
              <th className='border px-4 py-2 text-center w-32'>Alert quantity</th>
              <th className='border px-4 py-2 text-center w-32'>Required quantity</th>
              <th className='border px-4 py-2 text-center w-16'>Action</th>
            </tr>
          </thead>
          <tbody>
            {selectedItems.length === 0 ? (
              <tr>
                <td colSpan={4} className='text-center p-8 text-gray-500'>
                  No products selected. Click "Show products" and select items from the list.
                </td>
              </tr>
            ) : (
              selectedItems.map(item => (
                <tr key={item.id} className='hover:bg-gray-50'>
                  <td className='border px-4 py-2 font-medium'>
                    {item.productName}
                    <div className='text-xs text-gray-400'>{item.sku}</div>
                  </td>
                  <td className='border px-4 py-2 text-center text-red-500 font-semibold'>
                    {item.alertQuantity}
                  </td>
                  <td className='border px-4 py-2'>
                    <input 
                      type='number' 
                      className='w-full border p-1 rounded text-center'
                      value={item.quantity}
                      min='1'
                      onChange={(e) => updateQuantity(item.id, e.target.value)}
                    />
                  </td>
                  <td className='border px-4 py-2 text-center'>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className='text-red-500 hover:text-red-700'
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

      {/* Save button */}
      <div className='text-center'>
        <button 
          onClick={handleSave}
          disabled={loading || selectedItems.length === 0}
          className='bg-purple-600 text-white px-8 py-3 rounded text-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition shadow-md'
        >
          {loading ? 'Saving...' : 'Save Requisition'}
        </button>
      </div>
    </div>
  )
}
