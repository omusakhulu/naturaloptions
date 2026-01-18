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
  CircularProgress,
  InputAdornment
} from '@mui/material'
import { toast } from 'react-toastify'

export default function AddPurchasePage() {
  const router = useRouter()
  const { lang } = useParams()

  // Data states
  const [suppliers, setSuppliers] = useState([])
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [paymentTerms, setPaymentTerms] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // Form states
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [selectedPO, setSelectedPO] = useState(null)
  const [referenceNo, setReferenceNo] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(new Date())
  const [purchaseStatus, setPurchaseStatus] = useState('received')
  const [address, setAddress] = useState('')
  const [selectedWarehouse, setSelectedWarehouse] = useState(null)
  const [payTerm, setPayTerm] = useState(null)
  const [notes, setNotes] = useState('')
  const [lineItems, setLineItems] = useState([])
  const [additionalExpenses, setAdditionalExpenses] = useState([])
  const [shippingCharges, setShippingCharges] = useState(0)
  const [shippingDetails, setShippingDetails] = useState('')
  const [discountType, setDiscountType] = useState('None')
  const [discountAmount, setDiscountAmount] = useState(0)
  const [taxRate, setTaxRate] = useState(0)
  
  // Payment section
  const [paymentAmount, setDiscountPaymentAmount] = useState(0)
  const [paidOn, setPaidOn] = useState(new Date())
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [paymentAccount, setPaymentAccount] = useState('CASH')
  const [paymentNote, setPaymentNote] = useState('')

  const [saving, setSaving] = useState(false)

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [suppliersRes, posRes, termsRes, warehousesRes, productsRes] = await Promise.all([
          fetch('/api/vendors'),
          fetch('/api/purchases/orders'),
          fetch('/api/payment-terms'),
          fetch('/api/warehouses'),
          fetch('/api/products/list')
        ])

        const suppliersData = await suppliersRes.json()
        const posData = await posRes.json()
        const termsData = await termsRes.json()
        const warehousesData = await warehousesRes.json()
        const productsData = await productsRes.json()

        setSuppliers(suppliersData.items || [])
        setPurchaseOrders(posData.orders || [])
        setPaymentTerms(termsData.items || [])
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
    if (newValue) {
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

  // Handle PO selection
  const handlePOChange = (event, newValue) => {
    setSelectedPO(newValue)
    if (newValue) {
      // If a PO is selected, we might want to load its items
      if (newValue.vendor) {
        const supplier = suppliers.find(s => s.id === newValue.vendorId)
        if (supplier) setSelectedSupplier(supplier)
      }
      
      if (newValue.items) {
        const poItems = newValue.items.map(item => ({
          id: item.id,
          sku: item.sku,
          name: item.productName,
          quantity: item.quantity,
          unitCost: parseFloat(item.unitPrice),
          discountPercent: 0,
          taxPercent: 0,
          profitMargin: 0,
          sellingPrice: 0,
          lotNumber: '',
          expDate: null,
          total: parseFloat(item.totalPrice)
        }))
        setLineItems(poItems)
      }
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
        profitMargin: 25, // Default
        sellingPrice: parseFloat(newValue.price || 0) * 1.25,
        lotNumber: '',
        expDate: null,
        total: parseFloat(newValue.price || 0)
      }])
    }
  }

  const updateLineItem = (index, field, value) => {
    const newList = [...lineItems]
    newList[index][field] = value

    const item = newList[index]
    const cost = parseFloat(item.unitCost) || 0
    const qty = parseFloat(item.quantity) || 0
    const disc = parseFloat(item.discountPercent) || 0
    
    const totalBeforeDisc = cost * qty
    item.total = totalBeforeDisc * (1 - disc / 100)
    
    // Update selling price if profit margin changes
    if (field === 'profitMargin') {
      item.sellingPrice = cost * (1 + parseFloat(value) / 100)
    }
    
    setLineItems(newList)
  }

  const removeLineItem = (index) => {
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  const calculateGrandTotal = () => {
    const itemsTotal = lineItems.reduce((sum, item) => sum + (item.total || 0), 0)
    let total = itemsTotal + (parseFloat(shippingCharges) || 0)
    
    if (discountType === 'Fixed') {
      total -= parseFloat(discountAmount) || 0
    } else if (discountType === 'Percentage') {
      total -= itemsTotal * ((parseFloat(discountAmount) || 0) / 100)
    }
    
    return total
  }

  const handleSave = async () => {
    if (!selectedSupplier || lineItems.length === 0) {
      toast.error('Please select a supplier and add products')
      return
    }

    setSaving(true)
    try {
      const itemsTotal = lineItems.reduce((sum, item) => sum + (item.total || 0), 0)
      const payload = {
        vendorId: selectedSupplier.id,
        expectedDate: purchaseDate,
        warehouseId: selectedWarehouse?.id,
        notes,
        terms: payTerm?.name,
        items: lineItems.map(item => {
          const qty = parseFloat(item.quantity) || 0
          const unitPrice = parseFloat(item.unitCost) || 0
          const discountPercent = parseFloat(item.discountPercent) || 0
          const itemTotalBeforeDiscount = qty * unitPrice
          const discount = itemTotalBeforeDiscount * (discountPercent / 100)

          return {
            sku: item.sku,
            productName: item.name,
            quantity: Math.max(1, Math.round(qty)),
            unitPrice,
            discount,
            taxRate: parseFloat(item.taxPercent) || 0,
            lotNumber: item.lotNumber || null,
            expiryDate: item.expDate ? item.expDate : null
          }
        }),
        shippingCost: parseFloat(shippingCharges) || 0,
        discount:
          discountType === 'Fixed'
            ? parseFloat(discountAmount) || 0
            : discountType === 'Percentage'
              ? itemsTotal * ((parseFloat(discountAmount) || 0) / 100)
              : 0
      }

      const res = await fetch('/api/purchases/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast.success('Purchase saved successfully')
        router.push(`/${lang}/apps/purchases/list`)
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Failed to save purchase')
      }
    } catch (error) {
      console.error('Failed to save purchase:', error)
      toast.error('Failed to save purchase')
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
      <h1 className='text-2xl font-semibold'>Add Purchase</h1>

      {/* Header fields */}
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
            <label className='block text-sm font-medium mb-1'>Purchase Date*:</label>
            <DatePicker
              selected={purchaseDate}
              onChange={d => setPurchaseDate(d)}
              className='w-full border p-2 rounded text-sm h-[40px]'
            />
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>Purchase Status*:</label>
            <select 
              className='w-full border p-2.5 rounded text-sm h-[40px]'
              value={purchaseStatus}
              onChange={(e) => setPurchaseStatus(e.target.value)}
            >
              <option value='received'>Received</option>
              <option value='pending'>Pending</option>
              <option value='ordered'>Ordered</option>
            </select>
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
            <Autocomplete
              options={paymentTerms}
              getOptionLabel={(option) => option.name || ''}
              value={payTerm}
              onChange={(e, v) => setPayTerm(v)}
              renderInput={(params) => <TextField {...params} size='small' placeholder='Select term' />}
            />
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>Attach Document:</label>
            <input type='file' className='w-full border p-2 rounded text-sm' />
            <p className='text-xs text-gray-500 mt-1'>Max file size 5MB</p>
          </div>
        </div>
        <div>
          <label className='block text-sm font-medium mb-1'>Purchase Order:</label>
          <Autocomplete
            options={purchaseOrders}
            getOptionLabel={(option) => `${option.orderNumber} (${option.vendor?.name || 'Unknown'})`}
            value={selectedPO}
            onChange={handlePOChange}
            renderInput={(params) => <TextField {...params} size='small' className='max-w-sm' placeholder='Search PO' />}
          />
        </div>
      </div>

      {/* Product search & table */}
      <div className='bg-white border rounded shadow p-4 space-y-4'>
        <div className='flex items-center space-x-2'>
          <Button variant='contained' color='secondary' size='small'>Import Products</Button>
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
            Add new product
          </Button>
        </div>
        <div className='overflow-x-auto'>
          <table className='min-w-full text-sm border border-collapse'>
            <thead className='bg-green-50 uppercase text-xs font-semibold'>
              <tr>
                <th className='border p-2 text-left w-10'>#</th>
                <th className='border p-2 text-left'>Product Name</th>
                <th className='border p-2 text-center w-24'>Qty</th>
                <th className='border p-2 text-center w-32'>Unit Cost</th>
                <th className='border p-2 text-center w-24'>Disc %</th>
                <th className='border p-2 text-right w-32'>Total</th>
                <th className='border p-2 text-center w-24'>Margin %</th>
                <th className='border p-2 text-center w-32'>Selling Price</th>
                <th className='border p-2 text-center'>Lot/EXP</th>
                <th className='border p-2 text-center w-10'></th>
              </tr>
            </thead>
            <tbody>
              {lineItems.length === 0 ? (
                <tr><td colSpan={10} className='text-center p-8 text-gray-500 italic'>No products added</td></tr>
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
                      {item.total.toLocaleString()}
                    </td>
                    <td className='border p-2'>
                      <input 
                        type='number' 
                        className='w-full border rounded p-1 text-center' 
                        value={item.profitMargin}
                        onChange={(e) => updateLineItem(index, 'profitMargin', e.target.value)}
                      />
                    </td>
                    <td className='border p-2'>
                      <input 
                        type='number' 
                        className='w-full border rounded p-1 text-center font-semibold text-green-600' 
                        value={item.sellingPrice}
                        onChange={(e) => updateLineItem(index, 'sellingPrice', e.target.value)}
                      />
                    </td>
                    <td className='border p-2'>
                      <TextField
                        size='small'
                        placeholder='Lot'
                        className='mb-1'
                        value={item.lotNumber || ''}
                        onChange={(e) => updateLineItem(index, 'lotNumber', e.target.value)}
                      />
                      <DatePicker
                        selected={item.expDate}
                        onChange={d => updateLineItem(index, 'expDate', d)}
                        className='w-full border p-1 rounded text-xs'
                        placeholderText='EXP Date'
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
          <p>Total items: <span className='font-semibold'>{lineItems.length}</span></p>
          <p>Net Total Amount: <span className='font-semibold text-purple-600 text-lg'>Ksh {lineItems.reduce((sum, i) => sum + i.total, 0).toLocaleString()}</span></p>
        </div>
      </div>

      {/* Discount & tax card */}
      <div className='bg-white border rounded shadow p-6 space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <div>
            <label className='text-sm font-medium mb-1 block'>Discount Type</label>
            <select 
              className='w-full border p-2 rounded text-sm h-[40px]'
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
            >
              <option value='None'>None</option>
              <option value='Fixed'>Fixed</option>
              <option value='Percentage'>Percentage</option>
            </select>
          </div>
          <div>
            <label className='text-sm font-medium mb-1 block'>Discount Amount</label>
            <TextField 
              fullWidth 
              size='small' 
              type='number'
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              disabled={discountType === 'None'}
            />
          </div>
          <div>
            <label className='text-sm font-medium mb-1 block'>Purchase Tax</label>
            <select className='w-full border p-2 rounded text-sm h-[40px]'>
              <option>None</option>
              <option>VAT (16%)</option>
            </select>
          </div>
        </div>
        <div>
          <label className='text-sm font-medium mb-1 block'>Additional Notes</label>
          <TextField 
            fullWidth 
            multiline 
            rows={2} 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      {/* Shipping details */}
      <div className='bg-white border rounded shadow p-6 space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='text-sm font-medium mb-1 block'>Shipping Details</label>
            <TextField 
              fullWidth 
              multiline 
              rows={2} 
              value={shippingDetails}
              onChange={(e) => setShippingDetails(e.target.value)}
            />
          </div>
          <div>
            <label className='text-sm font-medium mb-1 block'>(*) Additional Shipping charges:</label>
            <TextField 
              fullWidth 
              size='small' 
              type='number'
              value={shippingCharges}
              onChange={(e) => setShippingCharges(e.target.value)}
            />
          </div>
        </div>
        <div className='text-right font-bold text-xl'>
          Purchase Total: <span className='text-purple-700'>Ksh {calculateGrandTotal().toLocaleString()}</span>
        </div>
      </div>

      {/* Payment section */}
      <div className='bg-white border rounded shadow p-6 space-y-4'>
        <h2 className='font-semibold text-lg border-b pb-2'>Add payment</h2>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div>
            <label className='text-sm font-medium mb-1 block'>Amount*</label>
            <TextField 
              fullWidth 
              size='small' 
              type='number'
              value={paymentAmount}
              onChange={(e) => setDiscountPaymentAmount(e.target.value)}
            />
          </div>
          <div>
            <label className='text-sm font-medium mb-1 block'>Paid on*</label>
            <DatePicker 
              selected={paidOn} 
              onChange={setPaidOn} 
              className='w-full border p-2 rounded text-sm h-[40px]' 
            />
          </div>
          <div>
            <label className='text-sm font-medium mb-1 block'>Payment Method*</label>
            <select 
              className='w-full border p-2 rounded text-sm h-[40px]'
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option>Cash</option>
              <option>Bank Transfer</option>
              <option>M-Pesa</option>
              <option>Cheque</option>
            </select>
          </div>
          <div>
            <label className='text-sm font-medium mb-1 block'>Payment Account</label>
            <select 
              className='w-full border p-2 rounded text-sm h-[40px]'
              value={paymentAccount}
              onChange={(e) => setPaymentAccount(e.target.value)}
            >
              <option>CASH</option>
              <option>MPESA</option>
              <option>EQUITY BANK</option>
            </select>
          </div>
        </div>
        <div>
          <label className='text-sm font-medium mb-1 block'>Payment note</label>
          <TextField 
            fullWidth 
            multiline 
            rows={2} 
            value={paymentNote}
            onChange={(e) => setPaymentNote(e.target.value)}
          />
        </div>
        <div className='text-right font-medium text-red-600'>
          Payment due: Ksh {(calculateGrandTotal() - (parseFloat(paymentAmount) || 0)).toLocaleString()}
        </div>
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
          {saving ? 'Saving...' : 'Save Purchase'}
        </Button>
      </div>
    </div>
  )
}
