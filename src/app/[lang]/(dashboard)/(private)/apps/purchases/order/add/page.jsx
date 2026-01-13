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
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  CircularProgress
} from '@mui/material'
import { toast } from 'react-toastify'

export default function AddPurchaseOrderPage() {
  const router = useRouter()
  const { lang } = useParams()

  // Data states
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [paymentTerms, setPaymentTerms] = useState([])
  const [loading, setLoading] = useState(true)

  // Form states
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [referenceNo, setReferenceNo] = useState('')
  const [orderDate, setOrderDate] = useState(new Date())
  const [deliveryDate, setDeliveryDate] = useState(null)
  const [address, setAddress] = useState('')
  const [warehouses, setWarehouses] = useState([])
  const [selectedWarehouse, setSelectedWarehouse] = useState(null)
  const [payTerm, setPayTerm] = useState(null)
  const [lineItems, setLineItems] = useState([])
  const [additionalExpenses, setAdditionalExpenses] = useState([])
  const [shippingCharges, setShippingCharges] = useState(0)
  const [shippingDetails, setShippingDetails] = useState('')
  const [shippingAddress, setShippingAddress] = useState('')
  const [shippingStatus, setShippingStatus] = useState('')
  const [deliveredTo, setDeliveredTo] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  // Dialog state
  const [openTermDialog, setOpenTermDialog] = useState(false)
  const [newTerm, setNewTerm] = useState({ name: '', days: 0, description: '' })
  const [savingTerm, setSavingTerm] = useState(false)

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [suppliersRes, productsRes, termsRes, warehousesRes] = await Promise.all([
          fetch('/api/vendors'),
          fetch('/api/products/list'),
          fetch('/api/payment-terms'),
          fetch('/api/warehouses')
        ])

        const suppliersData = await suppliersRes.json()
        const productsData = await productsRes.json()
        const termsData = await termsRes.json()
        const warehousesData = await warehousesRes.json()

        setSuppliers(suppliersData.items || [])
        setProducts(productsData.products || [])
        setPaymentTerms(termsData.items || [])
        setWarehouses(warehousesData.warehouses || [])
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
    if (newValue) {
      // Find the full vendor details if needed, or use what's in newValue
      setAddress(newValue.address || '')
      if (newValue.paymentTerm) {
        const term = paymentTerms.find(t => t.name === newValue.paymentTerm)
        if (term) setPayTerm(term)
      }
    } else {
      setAddress('')
      setPayTerm(null)
    }
  }

  // Handle product selection
  const handleProductSelect = (event, newValue) => {
    if (newValue) {
      const exists = lineItems.find(item => item.sku === newValue.sku)
      if (exists) {
        toast.warn('Product already added')
        return
      }

      setLineItems([...lineItems, {
        id: newValue.id,
        sku: newValue.sku,
        name: newValue.name,
        quantity: 1,
        unitCost: parseFloat(newValue.price || 0),
        discountPercent: 0,
        taxPercent: 0,
        total: parseFloat(newValue.price || 0)
      }])
    }
  }

  const updateLineItem = (index, field, value) => {
    const newList = [...lineItems]
    newList[index][field] = value

    // Recalculate totals
    const item = newList[index]
    const cost = parseFloat(item.unitCost) || 0
    const qty = parseFloat(item.quantity) || 0
    const disc = parseFloat(item.discountPercent) || 0
    
    const totalBeforeDisc = cost * qty
    item.total = totalBeforeDisc * (1 - disc / 100)
    
    setLineItems(newList)
  }

  const removeLineItem = (index) => {
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  const addExpense = () => {
    setAdditionalExpenses([...additionalExpenses, { name: '', amount: 0 }])
  }

  const updateExpense = (index, field, value) => {
    const newList = [...additionalExpenses]
    newList[index][field] = value
    setAdditionalExpenses(newList)
  }

  const removeExpense = (index) => {
    setAdditionalExpenses(additionalExpenses.filter((_, i) => i !== index))
  }

  const calculateGrandTotal = () => {
    const itemsTotal = lineItems.reduce((sum, item) => sum + (item.total || 0), 0)
    const expensesTotal = additionalExpenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0)
    return itemsTotal + expensesTotal + (parseFloat(shippingCharges) || 0)
  }

  const handleSaveTerm = async () => {
    if (!newTerm.name || newTerm.days < 0) {
      toast.error('Please fill required fields')
      return
    }
    setSavingTerm(true)
    try {
      const res = await fetch('/api/payment-terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTerm)
      })
      if (res.ok) {
        const term = await res.json()
        setPaymentTerms([...paymentTerms, term])
        setPayTerm(term)
        setOpenTermDialog(false)
        setNewTerm({ name: '', days: 0, description: '' })
        toast.success('Payment term added')
      }
    } catch (error) {
      toast.error('Failed to add term')
    } finally {
      setSavingTerm(false)
    }
  }

  const handleSave = async () => {
    if (!selectedSupplier || lineItems.length === 0) {
      toast.error('Please select a supplier and add products')
      return
    }

    setSaving(true)
    try {
      const expensesTotal = additionalExpenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0)
      
      const payload = {
        vendorId: selectedSupplier.id,
        expectedDate: deliveryDate,
        warehouseId: selectedWarehouse?.id,
        notes: notes + (additionalExpenses.length > 0 ? '\n\nAdditional Expenses:\n' + additionalExpenses.map(e => `${e.name}: Ksh ${e.amount}`).join('\n') : ''),
        terms: payTerm?.name,
        items: lineItems.map(item => ({
          sku: item.sku,
          productName: item.name,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitCost),
          discount: (parseFloat(item.unitCost) * parseFloat(item.quantity) * (parseFloat(item.discountPercent) / 100)) || 0,
          taxRate: 0 
        })),
        shippingCost: (parseFloat(shippingCharges) || 0) + expensesTotal,
        discount: 0 
      }

      const res = await fetch('/api/purchases/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast.success('Purchase Order saved successfully')
        router.push(`/${lang}/apps/purchases/order`)
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to save order')
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save order')
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
      <h1 className='text-2xl font-semibold'>Add Purchase Order</h1>

      {/* Top grid */}
      <div className='bg-white border rounded shadow p-6 space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <div className='col-span-1'>
            <label className='block text-sm font-medium mb-1'>Supplier*:</label>
            <div className='flex items-center'>
              <Autocomplete
                options={suppliers}
                getOptionLabel={(option) => option.name || ''}
                value={selectedSupplier}
                onChange={handleSupplierChange}
                renderInput={(params) => <TextField {...params} size='small' placeholder='Search Supplier' />}
                className='flex-1'
              />
              <IconButton size='small' className='ml-1 border rounded' onClick={() => router.push(`/${lang}/apps/contacts/suppliers`)}>
                <i className='tabler-plus text-lg' />
              </IconButton>
            </div>
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>Reference No:</label>
            <TextField 
              fullWidth 
              size='small' 
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
            />
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>Order date*:</label>
            <DatePicker
              selected={orderDate}
              onChange={d => setOrderDate(d)}
              className='w-full border p-2 rounded text-sm h-[40px]'
            />
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>Delivery date:</label>
            <DatePicker
              selected={deliveryDate}
              onChange={d => setDeliveryDate(d)}
              className='w-full border p-2 rounded text-sm h-[40px]'
              placeholderText='Select date'
            />
          </div>
          <div className='md:col-span-2'>
            <label className='block text-sm font-medium mb-1'>Address:</label>
            <TextField 
              fullWidth 
              multiline 
              rows={2} 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder='Supplier address'
            />
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>Business Location*:</label>
            <Autocomplete
              options={warehouses}
              getOptionLabel={(option) => option.name || ''}
              value={selectedWarehouse}
              onChange={(e, v) => setSelectedWarehouse(v)}
              renderInput={(params) => <TextField {...params} size='small' placeholder='Select Location' />}
            />
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>Pay term:</label>
            <div className='flex items-center'>
              <Autocomplete
                options={paymentTerms}
                getOptionLabel={(option) => option.name || ''}
                value={payTerm}
                onChange={(e, v) => setPayTerm(v)}
                renderInput={(params) => <TextField {...params} size='small' placeholder='Select term' />}
                className='flex-1'
              />
              <IconButton size='small' className='ml-1 border rounded' onClick={() => setOpenTermDialog(true)}>
                <i className='tabler-plus text-lg' />
              </IconButton>
            </div>
          </div>
        </div>

        <div>
          <label className='block text-sm font-medium mb-1'>Purchase Requisition:</label>
          <TextField 
            size='small' 
            className='max-w-sm' 
            fullWidth
            placeholder='Link to requisition'
          />
        </div>
      </div>

      {/* Product search + table */}
      <div className='bg-white border rounded shadow p-4 space-y-4'>
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
                    <>
                      <i className='tabler-search text-gray-500 mr-2' />
                      {params.InputProps.startAdornment}
                    </>
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
            Add new product
          </Button>
        </div>
        
        <div className='overflow-x-auto'>
          <table className='min-w-full text-sm border border-collapse'>
            <thead className='bg-gray-100 uppercase text-xs font-semibold'>
              <tr>
                <th className='border p-2 text-left w-10'>#</th>
                <th className='border p-2 text-left'>Product Name</th>
                <th className='border p-2 text-center w-24'>Quantity</th>
                <th className='border p-2 text-center w-32'>Unit Cost</th>
                <th className='border p-2 text-center w-24'>Disc %</th>
                <th className='border p-2 text-right w-32'>Line Total</th>
                <th className='border p-2 text-center w-10'></th>
              </tr>
            </thead>
            <tbody>
              {lineItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className='text-center p-8 text-gray-500 italic'>No products added yet. Use search to find products.</td>
                </tr>
              ) : (
                lineItems.map((item, index) => (
                  <tr key={item.id} className='hover:bg-gray-50'>
                    <td className='border p-2 text-center'>{index + 1}</td>
                    <td className='border p-2'>
                      <div className='font-medium'>{item.name}</div>
                      <div className='text-xs text-gray-400'>{item.sku}</div>
                    </td>
                    <td className='border p-2'>
                      <input 
                        type='number' 
                        className='w-full border rounded p-1 text-center' 
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                        min='1'
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
                    <td className='border p-2'>
                      <input 
                        type='number' 
                        className='w-full border rounded p-1 text-center' 
                        value={item.discountPercent}
                        onChange={(e) => updateLineItem(index, 'discountPercent', e.target.value)}
                      />
                    </td>
                    <td className='border p-2 text-right font-medium'>
                      Ksh {item.total.toLocaleString()}
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
          <p>Total items: <span className='font-semibold'>{lineItems.length}</span></p>
          <p>Net Total Amount: <span className='font-semibold text-purple-600 text-lg'>Ksh {lineItems.reduce((sum, i) => sum + i.total, 0).toLocaleString()}</span></p>
        </div>
      </div>

      {/* Shipping details */}
      <div className='bg-white border rounded shadow p-6 space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <div className='md:col-span-2'>
            <label className='block text-sm font-medium mb-1'>Shipping Details</label>
            <TextField 
              fullWidth 
              multiline 
              rows={2} 
              value={shippingDetails}
              onChange={(e) => setShippingDetails(e.target.value)}
            />
          </div>
          <div className='md:col-span-2'>
            <label className='block text-sm font-medium mb-1'>Shipping Address</label>
            <TextField 
              fullWidth 
              multiline 
              rows={2} 
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
            />
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>Shipping Charges</label>
            <TextField 
              fullWidth 
              type='number' 
              size='small'
              value={shippingCharges}
              onChange={(e) => setShippingCharges(e.target.value)}
            />
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>Shipping Status</label>
            <select 
              className='w-full border p-2.5 rounded text-sm h-[40px]'
              value={shippingStatus}
              onChange={(e) => setShippingStatus(e.target.value)}
            >
              <option value=''>Please Select</option>
              <option value='Ordered'>Ordered</option>
              <option value='Shipped'>Shipped</option>
              <option value='Delivered'>Delivered</option>
            </select>
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>Delivered To</label>
            <TextField 
              fullWidth 
              size='small'
              value={deliveredTo}
              onChange={(e) => setDeliveredTo(e.target.value)}
            />
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>Shipping Documents</label>
            <input type='file' className='w-full border p-2 rounded text-sm' />
            <p className='text-xs text-gray-500 mt-1'>Max file size: 5MB<br />Allowed file: .pdf, .csv, .zip, .doc, .docx, .jpeg, .jpg, .png</p>
          </div>
        </div>

        {/* Additional Expenses */}
        <div className='space-y-4 pt-4 border-t'>
          <div className='flex justify-between items-center'>
            <h3 className='text-sm font-semibold'>Additional Expenses</h3>
            <Button 
              startIcon={<i className='tabler-plus' />} 
              variant='outlined' 
              size='small'
              onClick={addExpense}
            >
              Add expense
            </Button>
          </div>
          
          {additionalExpenses.map((exp, index) => (
            <div key={index} className='flex gap-4 items-center animate-fadeIn'>
              <TextField
                size='small'
                placeholder='Expense Name (e.g. Customs)'
                className='flex-1'
                value={exp.name}
                onChange={(e) => updateExpense(index, 'name', e.target.value)}
              />
              <TextField
                size='small'
                type='number'
                placeholder='Amount'
                className='w-40'
                value={exp.amount}
                onChange={(e) => updateExpense(index, 'amount', e.target.value)}
              />
              <IconButton size='small' color='error' onClick={() => removeExpense(index)}>
                <i className='tabler-x' />
              </IconButton>
            </div>
          ))}
        </div>

        <div className='text-right pt-4 border-t'>
          <span className='text-gray-500 mr-4'>Order Total:</span>
          <span className='text-xl font-bold text-purple-700'>Ksh {calculateGrandTotal().toLocaleString()}</span>
        </div>
      </div>

      {/* Additional notes */}
      <div className='bg-white border rounded shadow p-6'>
        <label className='block text-sm font-medium mb-1'>Additional Notes</label>
        <TextField 
          fullWidth 
          multiline 
          rows={3} 
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder='Any other instructions...'
        />
      </div>

      <div className='text-center'>
        <Button 
          variant='contained' 
          color='primary' 
          size='large' 
          className='px-12 py-3'
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Order'}
        </Button>
      </div>

      {/* Add Payment Term Dialog */}
      <Dialog open={openTermDialog} onClose={() => setOpenTermDialog(false)} fullWidth maxWidth='xs'>
        <DialogTitle>Add New Payment Term</DialogTitle>
        <DialogContent className='space-y-4 pt-2'>
          <TextField
            fullWidth
            label='Term Name*'
            placeholder='e.g. Net 45'
            size='small'
            value={newTerm.name}
            onChange={(e) => setNewTerm({...newTerm, name: e.target.value})}
          />
          <TextField
            fullWidth
            label='Days*'
            type='number'
            size='small'
            value={newTerm.days}
            onChange={(e) => setNewTerm({...newTerm, days: parseInt(e.target.value) || 0})}
          />
          <TextField
            fullWidth
            label='Description'
            multiline
            rows={2}
            size='small'
            value={newTerm.description}
            onChange={(e) => setNewTerm({...newTerm, description: e.target.value})}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTermDialog(false)}>Cancel</Button>
          <Button 
            variant='contained' 
            onClick={handleSaveTerm} 
            disabled={savingTerm}
          >
            {savingTerm ? 'Saving...' : 'Save Term'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
