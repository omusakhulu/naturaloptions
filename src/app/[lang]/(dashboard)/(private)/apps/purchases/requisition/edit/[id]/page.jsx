'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { toast } from 'react-toastify'

export default function EditPurchaseRequisitionPage() {
  const router = useRouter()
  const { lang, id } = useParams()

  // Form states
  const [brand, setBrand] = useState('')
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('NATURAL OPTIONS (BL0001)')
  const [referenceNo, setReferenceNo] = useState('')
  const [requiredDate, setRequiredDate] = useState(new Date())
  const [priority, setPriority] = useState('NORMAL')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('PENDING')

  // Data states
  const [brands, setBrands] = useState([])
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [selectedItems, setSelectedItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searching, setSearching] = useState(false)

  // Fetch requisition and initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [brandsRes, catsRes, reqRes] = await Promise.all([
          fetch('/api/products/brands'),
          fetch('/api/products/categories'),
          fetch(`/api/purchases/requisitions?id=${id}`) // Assuming the GET can take an ID or we fetch all and find
        ])
        
        const brandsData = await brandsRes.json()
        const catsData = await catsRes.json()
        
        setBrands(Array.isArray(brandsData) ? brandsData : [])
        setCategories(Array.isArray(catsData) ? catsData : [])

        // If the API returns all, we might need a specific endpoint or filter
        // Based on the route.ts, GET /api/purchases/requisitions returns a list.
        // Let's check if we can fetch a single one. 
        // The current GET implementation doesn't seem to support single ID directly in a clean way unless it's a search.
        // I will fetch all and filter for now, or assume the API might be updated.
        // Actually, let's look at route.ts GET again. It doesn't have a single ID fetch.
        const reqData = await reqRes.json()
        const currentReq = reqData.requisition

        if (currentReq) {
          setReferenceNo(currentReq.requisitionNumber)
          setRequiredDate(currentReq.requiredDate ? new Date(currentReq.requiredDate) : new Date())
          setPriority(currentReq.priority)
          setNotes(currentReq.notes || '')
          setStatus(currentReq.status)
          setSelectedItems(currentReq.items.map(item => ({
            id: item.id, // This is the item ID, but for our selection logic we might need product ID
            sku: item.sku,
            productName: item.productName,
            quantity: item.quantity,
            alertQuantity: item.alertQuantity || 0,
            estimatedPrice: item.estimatedPrice || 0
          })))
        } else {
          toast.error('Requisition not found')
          router.push(`/${lang}/apps/purchases/requisition`)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id, lang, router])

  const handleShowProducts = async () => {
    setSearching(true)
    try {
      const res = await fetch('/api/products/list')
      const data = await res.json()
      if (data.success) {
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
      const exists = prev.some(item => item.sku === product.sku)
      if (exists) {
        toast.warn('Product already added')
        return prev
      }

      return [
        ...prev,
        {
          id: `new-${Date.now()}`,
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

  const updateAlertQuantity = (id, qty) => {
    setSelectedItems(selectedItems.map(item =>
      item.id === id ? { ...item, alertQuantity: parseFloat(qty) || 0 } : item
    ))
  }

  const handleSave = async () => {
    if (selectedItems.length === 0) {
      toast.error('Please add at least one product')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/purchases/requisitions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          requiredDate,
          priority,
          notes,
          status,
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
        toast.success('Purchase requisition updated successfully')
        router.push(`/${lang}/apps/purchases/requisition`)
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to update requisition')
      }
    } catch (error) {
      toast.error('An error occurred while saving')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className='p-8 text-center'>
        <i className='tabler-loader animate-spin text-4xl mb-4' />
        <p>Loading requisition...</p>
      </div>
    )
  }

  return (
    <div className='p-8 space-y-6'>
      <div className='flex justify-between items-center'>
        <h1 className='text-2xl font-semibold'>Edit Purchase Requisition: {referenceNo}</h1>
        <button 
          onClick={() => router.push(`/${lang}/apps/purchases/requisition`)}
          className='text-sm border px-3 py-1 rounded hover:bg-gray-50'
        >
          Back to List
        </button>
      </div>

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
              className='w-full border p-2 rounded text-sm bg-gray-50 font-bold' 
              value={referenceNo}
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
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div>
            <label className='block text-sm font-medium mb-1'>Priority:</label>
            <select 
              className='w-full border p-2 rounded text-sm'
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value='LOW'>Low</option>
              <option value='NORMAL'>Normal</option>
              <option value='HIGH'>High</option>
              <option value='URGENT'>Urgent</option>
            </select>
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>Status:</label>
            <select 
              className='w-full border p-2 rounded text-sm'
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value='PENDING'>Pending</option>
              <option value='APPROVED'>Approved</option>
              <option value='REJECTED'>Rejected</option>
              <option value='CANCELLED'>Cancelled</option>
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
                  <td className='border px-4 py-2'>
                    <input
                      type='number'
                      className='w-full border p-1 rounded text-center'
                      value={item.alertQuantity}
                      min='0'
                      onChange={(e) => updateAlertQuantity(item.id, e.target.value)}
                    />
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
          disabled={saving || selectedItems.length === 0}
          className='bg-purple-600 text-white px-8 py-3 rounded text-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition shadow-md'
        >
          {saving ? 'Updating...' : 'Update Requisition'}
        </button>
      </div>
    </div>
  )
}
