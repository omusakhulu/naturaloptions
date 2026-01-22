'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { 
  Autocomplete, 
  TextField, 
  Button, 
  IconButton, 
  CircularProgress,
  InputAdornment
} from '@mui/material'
import { toast } from 'react-toastify'

export default function AddPurchaseReturnPage() {
  const router = useRouter()
  const { lang } = useParams()

  // Data states
  const [suppliers, setSuppliers] = useState([])
  const [purchases, setPurchases] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // Form states
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [selectedPurchase, setSelectedPurchase] = useState(null)
  const [referenceNo, setReferenceNo] = useState('')
  const [returnDate, setReturnDate] = useState(new Date())
  const [selectedWarehouse, setSelectedWarehouse] = useState(null)
  const [returnStatus, setReturnStatus] = useState('pending')
  const [lineItems, setLineItems] = useState([])
  const [notes, setNotes] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('pending')
  const [refundAmount, setRefundAmount] = useState(0)
  
  const [saving, setSaving] = useState(false)

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [suppliersRes, purchasesRes, warehousesRes, productsRes] = await Promise.all([
          fetch('/api/vendors'),
          fetch('/api/purchases/orders'),
          fetch('/api/warehouses'),
          fetch('/api/products/list')
        ])

        const suppliersData = await suppliersRes.json()
        const purchasesData = await purchasesRes.json()
        const warehousesData = await warehousesRes.json()
        const productsData = await productsRes.json()

        setSuppliers(suppliersData.items || [])
        setPurchases(purchasesData.orders || [])
        setWarehouses(warehousesData.warehouses || [])
        setProducts(productsData.products || [])

        if (warehousesData.warehouses?.length > 0) {
          setSelectedWarehouse(warehousesData.warehouses[0])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load initial data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Handle supplier change
  const handleSupplierChange = (event, newValue) => {
    setSelectedSupplier(newValue)
    // Clear parent purchase if supplier changes
    setSelectedPurchase(null)
  }

  // Handle parent purchase selection
  const handlePurchaseChange = (event, newValue) => {
    setSelectedPurchase(newValue)
    if (newValue) {
      // Auto-set supplier if not set
      if (!selectedSupplier && newValue.vendorId) {
        const vendor = suppliers.find(s => s.id === newValue.vendorId)
        if (vendor) setSelectedSupplier(vendor)
      }

      // Load items from purchase
      if (newValue.items) {
        const items = newValue.items.map(item => ({
          id: item.id,
          sku: item.sku,
          name: item.productName,
          quantity: item.quantity,
          returnQuantity: 0,
          unitCost: parseFloat(item.unitPrice),
          total: 0,
          reason: ''
        }))
        setLineItems(items)
      }
    }
  }

  // Handle product selection (manual add)
  const handleProductSelect = (event, newValue) => {
    if (newValue) {
      const exists = lineItems.find(item => item.sku === newValue.sku)
      if (exists) {
        toast.warn('Product already in the list')
        return
      }

      setLineItems([...lineItems, {
        id: newValue.id,
        sku: newValue.sku,
        name: newValue.name,
        quantity: 0, // No limit if manually added
        returnQuantity: 1,
        unitCost: parseFloat(newValue.price || 0),
        total: parseFloat(newValue.price || 0),
        reason: ''
      }])
    }
  }

  const updateLineItem = (index, field, value) => {
    const newList = [...lineItems]
    newList[index][field] = value

    const item = newList[index]
    if (field === 'returnQuantity' || field === 'unitCost') {
      const qty = parseFloat(item.returnQuantity) || 0
      const cost = parseFloat(item.unitCost) || 0
      item.total = qty * cost
    }
    
    setLineItems(newList)
  }

  const removeLineItem = (index) => {
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  const calculateGrandTotal = () => {
    return lineItems.reduce((sum, item) => sum + (item.total || 0), 0)
  }

  const handleSave = async (e) => {
    if (e) e.preventDefault()
    
    if (!selectedSupplier || lineItems.length === 0) {
      toast.error('Please select a supplier and add products')
      return
    }

    const itemsToReturn = lineItems.filter(i => i.returnQuantity > 0)
    if (itemsToReturn.length === 0) {
      toast.error('Please specify return quantity for at least one item')
      return
    }

    setSaving(true)
    try {
      const payload = {
        vendorId: selectedSupplier.id,
        purchaseOrderId: selectedPurchase?.id,
        warehouseId: selectedWarehouse?.id,
        date: returnDate,
        amount: calculateGrandTotal(),
        reason: notes,
        items: itemsToReturn.map(i => ({
          sku: i.sku,
          productName: i.name,
          quantity: parseFloat(i.returnQuantity),
          unitPrice: parseFloat(i.unitCost),
          totalPrice: i.total,
          reason: i.reason
        }))
      }

      const res = await fetch('/api/returns/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast.success('Purchase return saved successfully')
        router.push(`/${lang}/apps/purchases/returns`)
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to save return')
      }
    } catch (error) {
      console.error('Error saving return:', error)
      toast.error('Failed to save return')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className='flex justify-center p-20'>
      <CircularProgress />
    </div>
  )

  return (
    <div className='p-8 space-y-6'>
      <div className='flex justify-between items-center'>
        <h1 className='text-2xl font-semibold'>Add Purchase Return</h1>
        <Button
          variant='outlined'
          size='small'
          onClick={() => router.push(`/${lang}/apps/purchases/returns`)}
        >
          Back to List
        </Button>
      </div>

      <form onSubmit={handleSave}>
        {/* Header fields */}
        <div className='bg-white border rounded shadow p-6 space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <label className='block text-sm font-medium mb-1'>Supplier*:</label>
              <Autocomplete
                options={suppliers}
                getOptionLabel={(option) => option.name || ''}
                value={selectedSupplier}
                onChange={handleSupplierChange}
                renderInput={(params) => <TextField {...params} size='small' placeholder='Search Supplier' required />}
              />
            </div>
            <div>
              <label className='block text-sm font-medium mb-1'>Reference No:</label>
              <TextField 
                fullWidth 
                size='small' 
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder='Auto-generated if empty'
              />
            </div>
            <div>
              <label className='block text-sm font-medium mb-1'>Return Date*:</label>
              <DatePicker 
                selected={returnDate} 
                onChange={setReturnDate} 
                className='w-full border p-2 rounded text-sm h-[40px]'
                required
              />
            </div>
            <div>
              <label className='block text-sm font-medium mb-1'>Parent Purchase:</label>
              <Autocomplete
                options={purchases.filter(p => !selectedSupplier || p.vendorId === selectedSupplier.id)}
                getOptionLabel={(option) => `${option.orderNumber} (${option.vendor?.name || 'Unknown'})`}
                value={selectedPurchase}
                onChange={handlePurchaseChange}
                renderInput={(params) => <TextField {...params} size='small' placeholder='Search Purchase' />}
              />
            </div>
            <div>
              <label className='block text-sm font-medium mb-1'>Business Location*:</label>
              <Autocomplete
                options={warehouses}
                getOptionLabel={(option) => option.name || ''}
                value={selectedWarehouse}
                onChange={(e, v) => setSelectedWarehouse(v)}
                renderInput={(params) => <TextField {...params} size='small' placeholder='Select Location' required />}
              />
            </div>
            <div>
              <label className='block text-sm font-medium mb-1'>Return Status*:</label>
              <select 
                className='w-full border p-2.5 rounded text-sm h-[40px]'
                value={returnStatus}
                onChange={(e) => setReturnStatus(e.target.value)}
                required
              >
                <option value='pending'>Pending</option>
                <option value='completed'>Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product search & table */}
        <div className='bg-white border rounded shadow p-4 space-y-4 mt-6'>
          <div className='flex items-center space-x-2'>
            <Autocomplete
              options={products}
              getOptionLabel={(option) => `${option.name} (${option.sku})`}
              onChange={handleProductSelect}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  size='small' 
                  placeholder='Enter Product name / SKU / Scan bar code' 
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <i className='tabler-search text-gray-500' />
                      </InputAdornment>
                    )
                  }}
                />
              )}
              className='flex-1'
            />
            <Button 
              startIcon={<i className='tabler-plus' />} 
              color='primary' 
              size='small'
              onClick={() => router.push(`/${lang}/apps/ecommerce/products/add`)}
            >
              Add product
            </Button>
          </div>
          <div className='overflow-x-auto'>
            <table className='min-w-full text-sm border border-collapse'>
              <thead className='bg-red-50 uppercase text-xs font-semibold'>
                <tr>
                  <th className='border p-2 text-left w-10'>#</th>
                  <th className='border p-2 text-left'>Product Name</th>
                  <th className='border p-2 text-center w-32'>Return Quantity</th>
                  <th className='border p-2 text-center w-32'>Unit Cost</th>
                  <th className='border p-2 text-right w-32'>Line Total</th>
                  <th className='border p-2 text-center'>Reason</th>
                  <th className='border p-2 text-center w-10'></th>
                </tr>
              </thead>
              <tbody>
                {lineItems.length === 0 ? (
                  <tr><td colSpan={7} className='text-center p-8 text-gray-500 italic'>No products added. Use search or select a parent purchase.</td></tr>
                ) : (
                  lineItems.map((item, index) => (
                    <tr key={item.id} className='hover:bg-gray-50'>
                      <td className='border p-2 text-center'>{index + 1}</td>
                      <td className='border p-2'>
                        <div className='font-medium'>{item.name}</div>
                        <div className='text-xs text-gray-400'>{item.sku}</div>
                        {item.quantity > 0 && <div className='text-[10px] text-blue-600'>Purchased: {item.quantity}</div>}
                      </td>
                      <td className='border p-2'>
                        <input 
                          type='number' 
                          className='w-full border rounded p-1 text-center' 
                          value={item.returnQuantity}
                          onChange={(e) => updateLineItem(index, 'returnQuantity', e.target.value)}
                          max={item.quantity > 0 ? item.quantity : undefined}
                          min='0'
                        />
                      </td>
                      <td className='border p-2'>
                        <input 
                          type='number' 
                          className='w-full border rounded p-1 text-center' 
                          value={item.unitCost}
                          onChange={(e) => updateLineItem(index, 'unitCost', e.target.value)}
                        />
                      </td>
                      <td className='border p-2 text-right font-medium'>
                        {item.total.toLocaleString()}
                      </td>
                      <td className='border p-2'>
                        <TextField 
                          fullWidth 
                          size='small' 
                          placeholder='Reason for return'
                          value={item.reason}
                          onChange={(e) => updateLineItem(index, 'reason', e.target.value)}
                        />
                      </td>
                      <td className='border p-2 text-center'>
                        <IconButton size='small' color='error' onClick={() => removeLineItem(index)}>
                          <i className='tabler-trash' />
                        </IconButton>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className='flex justify-end gap-10 text-sm'>
            <p>Total items: <span className='font-semibold'>{lineItems.filter(i => i.returnQuantity > 0).length}</span></p>
            <p>Net Total Amount: <span className='font-semibold text-red-600 text-lg'>Ksh {calculateGrandTotal().toLocaleString()}</span></p>
          </div>
        </div>

        {/* Additional details */}
        <div className='bg-white border rounded shadow p-6 space-y-4 mt-6'>
          <div>
            <label className='text-sm block font-medium mb-1'>Additional Notes</label>
            <TextField 
              fullWidth 
              multiline 
              rows={3} 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder='Enter any additional notes about this return'
            />
          </div>
          <div className='text-right font-bold text-xl'>
            Return Total: <span className='text-red-700'>Ksh {calculateGrandTotal().toLocaleString()}</span>
          </div>
        </div>

        {/* Payment section */}
        <div className='bg-white border rounded shadow p-6 space-y-4 mt-6'>
          <h2 className='font-semibold text-lg border-b pb-2'>Payment Information</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='text-sm font-medium mb-1 block'>Payment Status*</label>
              <select 
                className='w-full border p-2.5 rounded text-sm h-[40px]'
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                required
              >
                <option value='pending'>Pending</option>
                <option value='refunded'>Refunded</option>
                <option value='partial'>Partial Refund</option>
              </select>
            </div>
            <div>
              <label className='text-sm font-medium mb-1 block'>Refund Amount</label>
              <TextField 
                fullWidth 
                size='small' 
                type='number'
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className='flex gap-3 justify-center mt-8'>
          <Button 
            type='submit'
            variant='contained' 
            color='primary' 
            size='large' 
            className='px-12 py-3'
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Return'}
          </Button>
          <Button 
            variant='outlined'
            size='large'
            className='px-12 py-3'
            onClick={() => router.push(`/${lang}/apps/purchases/returns`)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
