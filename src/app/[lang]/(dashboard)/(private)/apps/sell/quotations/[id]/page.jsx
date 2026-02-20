'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import { toast } from 'react-toastify'

export default function ViewEditQuotationPage() {
  const { lang, id } = useParams()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [serviceType, setServiceType] = useState('')
  const [customers, setCustomers] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [payTerm, setPayTerm] = useState('')
  const [saleDate, setSaleDate] = useState('')
  const [status, setStatus] = useState('')
  const [invoiceScheme, setInvoiceScheme] = useState('Default')
  const [invoiceNo, setInvoiceNo] = useState('')
  const [salesOrder, setSalesOrder] = useState('')
  const [discountType, setDiscountType] = useState('Percentage')
  const [discountAmount, setDiscountAmount] = useState('0')
  const [orderTax, setOrderTax] = useState('None')
  const [sellNote, setSellNote] = useState('')
  const [shippingDetails, setShippingDetails] = useState('')
  const [shippingAddress, setShippingAddress] = useState('')
  const [shippingCharges, setShippingCharges] = useState('0')
  const [shippingStatus, setShippingStatus] = useState('')
  const [deliveredTo, setDeliveredTo] = useState('')
  const [deliveryPerson, setDeliveryPerson] = useState('')

  const [products, setProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [lineItems, setLineItems] = useState([])
  const [quotationNumber, setQuotationNumber] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      setLoading(true)
      try {
        const [quotRes, custRes, prodRes] = await Promise.all([
          fetch(`/api/quotations/${id}`),
          fetch('/api/customers'),
          fetch('/api/products/list')
        ])

        const quot = await quotRes.json()
        if (!quotRes.ok) {
          toast.error(quot.error || 'Failed to load quotation')
          return
        }

        if (!cancelled) {
          setQuotationNumber(quot.quotationNumber || '')
          setServiceType(quot.serviceType || '')
          setSaleDate(quot.saleDate ? new Date(quot.saleDate).toISOString().slice(0, 16) : '')
          setStatus(quot.status || '')
          setInvoiceScheme(quot.invoiceScheme || 'Default')
          setInvoiceNo(quot.invoiceNo || '')
          setSalesOrder(quot.salesOrder || '')
          setDiscountType(quot.discountType || 'Percentage')
          setDiscountAmount(String(quot.discountAmount || '0'))
          setOrderTax(quot.orderTax || 'None')
          setSellNote(quot.sellNote || '')
          setShippingDetails(quot.shippingDetails || '')
          setShippingAddress(quot.shippingAddress || '')
          setShippingCharges(String(quot.shippingCharges || '0'))
          setShippingStatus(quot.shippingStatus || '')
          setDeliveredTo(quot.deliveredTo || '')
          setDeliveryPerson(quot.deliveryPerson || '')

          try {
            const items = JSON.parse(quot.lineItems || '[]')
            setLineItems(Array.isArray(items) ? items : [])
          } catch { setLineItems([]) }

          const custData = await custRes.json()
          if (custRes.ok && custData?.success && Array.isArray(custData?.customers)) {
            setCustomers(custData.customers)
            if (quot.customerId) {
              const match = custData.customers.find(c => c.id === quot.customerId)
              if (match) setSelectedCustomer(match)
            }
          }

          const prodData = await prodRes.json()
          if (prodRes.ok && prodData?.success && Array.isArray(prodData?.products)) {
            setProducts(prodData.products)
          }
        }
      } catch (err) {
        console.error('Error loading quotation:', err)
        toast.error('Failed to load quotation')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadData()
    return () => { cancelled = true }
  }, [id])

  const addProductToLineItems = (product) => {
    if (!product) return
    setLineItems(prev => {
      const existingIndex = prev.findIndex(li => li.productId === product.id)
      if (existingIndex >= 0) {
        const updated = [...prev]
        const existing = updated[existingIndex]
        const nextQty = (parseFloat(existing.quantity) || 0) + 1
        const unitPrice = parseFloat(existing.unitPrice) || 0
        const discount = parseFloat(existing.discount) || 0
        updated[existingIndex] = { ...existing, quantity: nextQty, subtotal: (nextQty * unitPrice) - discount }
        return updated
      }
      const unitPrice = parseFloat(product.price) || 0
      return [...prev, { productId: product.id, name: product.name, sku: product.sku || '', quantity: 1, unitPrice, discount: 0, subtotal: unitPrice }]
    })
  }

  const updateLineItem = (index, field, value) => {
    setLineItems(prev => {
      const updated = [...prev]
      const current = updated[index]
      if (!current) return prev
      const next = { ...current, [field]: value }
      const quantity = parseFloat(next.quantity) || 0
      const unitPrice = parseFloat(next.unitPrice) || 0
      const discount = parseFloat(next.discount) || 0
      next.subtotal = (quantity * unitPrice) - discount
      updated[index] = next
      return updated
    })
  }

  const removeLineItem = (index) => {
    setLineItems(prev => prev.filter((_, i) => i !== index))
  }

  const itemsSubtotal = useMemo(() => lineItems.reduce((sum, li) => sum + (parseFloat(li.subtotal) || 0), 0), [lineItems])
  const totalPayable = useMemo(() => itemsSubtotal + (parseFloat(shippingCharges) || 0), [itemsSubtotal, shippingCharges])

  const getCustomerLabel = (c) => {
    if (!c) return ''
    const name = `${c.firstName || ''} ${c.lastName || ''}`.trim()
    if (name) return c.email ? `${name} (${c.email})` : name
    return c.email || String(c.id || '')
  }

  const getProductLabel = (p) => {
    if (!p) return ''
    const sku = p.sku ? ` - ${p.sku}` : ''
    return `${p.name || ''}${sku}`.trim() || String(p.id || '')
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        customerId: selectedCustomer?.id || null,
        customerName: selectedCustomer ? `${selectedCustomer.firstName || ''} ${selectedCustomer.lastName || ''}`.trim() : null,
        serviceType, status: status || 'Draft', saleDate, invoiceScheme, invoiceNo, salesOrder,
        discountType, discountAmount, orderTax, sellNote,
        shippingDetails, shippingAddress, shippingCharges, shippingStatus, deliveredTo, deliveryPerson,
        lineItems, subtotal: itemsSubtotal, totalPayable
      }

      const res = await fetch(`/api/quotations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Quotation updated successfully')
      } else {
        toast.error(data.error || 'Failed to update quotation')
      }
    } catch (err) {
      console.error('Error updating quotation:', err)
      toast.error('Failed to update quotation')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className='p-8 flex items-center justify-center'>
        <div className='flex flex-col items-center gap-2'>
          <i className='tabler-loader animate-spin text-3xl text-gray-400' />
          <span className='text-gray-500'>Loading quotation...</span>
        </div>
      </div>
    )
  }

  return (
    <div className='p-8 space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-semibold'>Quotation {quotationNumber}</h1>
          <button onClick={() => router.push(`/${lang}/apps/sell/quotations`)} className='text-sm text-blue-600 hover:underline mt-1'>&larr; Back to list</button>
        </div>
        <div className='flex items-center gap-2'>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            status === 'Accepted' ? 'bg-green-100 text-green-700' :
            status === 'Declined' ? 'bg-red-100 text-red-700' :
            status === 'Sent' ? 'bg-blue-100 text-blue-700' :
            status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-700'
          }`}>{status || 'Draft'}</span>
        </div>
      </div>

      <div className='bg-white border rounded shadow p-4 grid grid-cols-1 md:grid-cols-3 gap-4'>
        <div>
          <label className='block text-xs text-gray-500 mb-1'>Service Type</label>
          <select value={serviceType} onChange={e => setServiceType(e.target.value)} className='border rounded p-2 w-full'>
            <option value=''>Select</option>
            <option value='retail'>Retail</option>
            <option value='wholesale'>Wholesale</option>
            <option value='service'>Service</option>
          </select>
        </div>
        <div>
          <label className='block text-xs text-gray-500 mb-1'>Customer</label>
          <Autocomplete
            options={customers}
            value={selectedCustomer}
            onChange={(_, v) => setSelectedCustomer(v)}
            getOptionLabel={getCustomerLabel}
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            renderInput={(params) => <TextField {...params} placeholder='Search customer' size='small' />}
          />
        </div>
        <div>
          <label className='block text-xs text-gray-500 mb-1'>Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)} className='border rounded p-2 w-full'>
            <option value=''>Select</option>
            <option>Draft</option>
            <option>Pending</option>
            <option>Sent</option>
            <option>Accepted</option>
            <option>Declined</option>
          </select>
        </div>
        <div>
          <label className='block text-xs text-gray-500 mb-1'>Sale Date</label>
          <input type='datetime-local' value={saleDate} onChange={e => setSaleDate(e.target.value)} className='border rounded p-2 w-full' />
        </div>
        <div>
          <label className='block text-xs text-gray-500 mb-1'>Invoice No.</label>
          <input value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} className='border rounded p-2 w-full' placeholder={quotationNumber} />
        </div>
        <div>
          <label className='block text-xs text-gray-500 mb-1'>Sales Order</label>
          <input value={salesOrder} onChange={e => setSalesOrder(e.target.value)} className='border rounded p-2 w-full' />
        </div>
      </div>

      <div className='bg-white border rounded shadow p-4 space-y-3'>
        <h2 className='font-medium text-gray-700'>Line Items</h2>
        <div className='overflow-auto'>
          <table className='min-w-full text-sm'>
            <thead>
              <tr className='bg-gray-50 text-gray-600'>
                <th className='text-left font-medium px-3 py-2 border-b'>#</th>
                <th className='text-left font-medium px-3 py-2 border-b'>Product</th>
                <th className='text-left font-medium px-3 py-2 border-b'>Quantity</th>
                <th className='text-left font-medium px-3 py-2 border-b'>Unit Price</th>
                <th className='text-left font-medium px-3 py-2 border-b'>Discount</th>
                <th className='text-right font-medium px-3 py-2 border-b'>Subtotal</th>
                <th className='px-3 py-2 border-b'></th>
              </tr>
            </thead>
            <tbody>
              {lineItems.length === 0 ? (
                <tr><td colSpan={7} className='text-center text-gray-500 py-8'>No items</td></tr>
              ) : lineItems.map((li, idx) => (
                <tr key={li.productId || idx} className='border-b'>
                  <td className='px-3 py-2'>{idx + 1}</td>
                  <td className='px-3 py-2'>
                    <div className='font-medium'>{li.name}</div>
                    <div className='text-xs text-gray-500'>{li.sku || ''}</div>
                  </td>
                  <td className='px-3 py-2'>
                    <input type='number' min='0' className='border rounded p-1 w-24' value={li.quantity} onChange={e => updateLineItem(idx, 'quantity', e.target.value)} />
                  </td>
                  <td className='px-3 py-2'>
                    <input type='number' min='0' className='border rounded p-1 w-28' value={li.unitPrice} onChange={e => updateLineItem(idx, 'unitPrice', e.target.value)} />
                  </td>
                  <td className='px-3 py-2'>
                    <input type='number' min='0' className='border rounded p-1 w-24' value={li.discount} onChange={e => updateLineItem(idx, 'discount', e.target.value)} />
                  </td>
                  <td className='px-3 py-2 text-right'>{(parseFloat(li.subtotal) || 0).toLocaleString('en-KE')}</td>
                  <td className='px-3 py-2 text-center'>
                    <button className='text-red-500 hover:text-red-700' onClick={() => removeLineItem(idx)}>
                      <i className='tabler-trash text-lg' />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className='flex items-center gap-2'>
          <div className='flex-1'>
            <Autocomplete
              options={products}
              loading={loadingProducts}
              value={selectedProduct}
              onChange={(_, v) => { setSelectedProduct(null); addProductToLineItems(v) }}
              getOptionLabel={getProductLabel}
              isOptionEqualToValue={(option, value) => option?.id === value?.id}
              renderInput={(params) => <TextField {...params} placeholder='Add product by name / SKU' size='small' />}
            />
          </div>
        </div>
      </div>

      <div className='bg-white border rounded shadow p-4 grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='block text-xs text-gray-500 mb-1'>Discount Type</label>
            <select value={discountType} onChange={e => setDiscountType(e.target.value)} className='border rounded p-2 w-full'>
              <option>Percentage</option>
              <option>Fixed</option>
            </select>
          </div>
          <div>
            <label className='block text-xs text-gray-500 mb-1'>Discount Amount</label>
            <input value={discountAmount} onChange={e => setDiscountAmount(e.target.value)} className='border rounded p-2 w-full' />
          </div>
          <div className='md:col-span-2'>
            <label className='block text-xs text-gray-500 mb-1'>Order Tax</label>
            <select value={orderTax} onChange={e => setOrderTax(e.target.value)} className='border rounded p-2 w-full'>
              <option>None</option>
              <option>VAT (16%)</option>
            </select>
          </div>
          <div className='md:col-span-2'>
            <label className='block text-xs text-gray-500 mb-1'>Sell note</label>
            <textarea value={sellNote} onChange={e => setSellNote(e.target.value)} className='border rounded p-2 w-full' rows={3} />
          </div>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='block text-xs text-gray-500 mb-1'>Shipping Details</label>
            <input value={shippingDetails} onChange={e => setShippingDetails(e.target.value)} className='border rounded p-2 w-full' />
          </div>
          <div>
            <label className='block text-xs text-gray-500 mb-1'>Shipping Address</label>
            <input value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} className='border rounded p-2 w-full' />
          </div>
          <div>
            <label className='block text-xs text-gray-500 mb-1'>Shipping Charges</label>
            <input value={shippingCharges} onChange={e => setShippingCharges(e.target.value)} className='border rounded p-2 w-full' />
          </div>
          <div>
            <label className='block text-xs text-gray-500 mb-1'>Shipping Status</label>
            <select value={shippingStatus} onChange={e => setShippingStatus(e.target.value)} className='border rounded p-2 w-full'>
              <option value=''>Select</option>
              <option>Pending</option>
              <option>In Transit</option>
              <option>Delivered</option>
              <option>Cancelled</option>
            </select>
          </div>
          <div>
            <label className='block text-xs text-gray-500 mb-1'>Delivered To</label>
            <input value={deliveredTo} onChange={e => setDeliveredTo(e.target.value)} className='border rounded p-2 w-full' />
          </div>
          <div>
            <label className='block text-xs text-gray-500 mb-1'>Delivery Person</label>
            <input value={deliveryPerson} onChange={e => setDeliveryPerson(e.target.value)} className='border rounded p-2 w-full' />
          </div>
        </div>
      </div>

      <div className='bg-white border rounded shadow p-4 flex items-center justify-between'>
        <div className='text-sm text-gray-700'>Total Payable: <span className='font-semibold'>KSh {Number(totalPayable).toLocaleString('en-KE')}</span></div>
        <div className='space-x-2'>
          <button onClick={() => router.push(`/${lang}/apps/sell/quotations`)} className='border rounded px-4 py-2 text-sm'>Cancel</button>
          <button onClick={handleSave} disabled={saving} className='bg-indigo-600 hover:bg-indigo-700 text-white rounded px-4 py-2 text-sm disabled:opacity-50'>
            {saving ? 'Saving...' : 'Update Quotation'}
          </button>
        </div>
      </div>
    </div>
  )
}
