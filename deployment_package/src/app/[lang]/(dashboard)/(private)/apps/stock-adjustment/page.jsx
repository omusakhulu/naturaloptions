'use client'

import { useMemo, useState } from 'react'
import AsyncProductAutocomplete from './AsyncProductAutocomplete'

export default function Page() {
  const [location, setLocation] = useState('')
  const [reference, setReference] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 16))
  const [adjustmentType, setAdjustmentType] = useState('')

  const [productQuery, setProductQuery] = useState('')
  const [items, setItems] = useState([])
  const [amountRecovered, setAmountRecovered] = useState('0')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const totalAmount = useMemo(() => {
    return items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0)
  }, [items])

  const addItem = () => {
    const name = productQuery.trim()
    if (!name) return
    setItems(prev => [...prev, { id: Date.now(), product: name, quantity: 1, unitPrice: 0 }])
    setProductQuery('')
  }

  const updateItem = (id, key, value) => {
    setItems(prev => prev.map(it => (it.id === id ? { ...it, [key]: value } : it)))
  }

  const removeItem = id => setItems(prev => prev.filter(it => it.id !== id))

  const canSave = location && date && adjustmentType && reference && items.length > 0

  const onSave = async () => {
    if (!canSave) return
    setSaving(true)
    setMessage('')
    try {
      const body = {
        reference,
        location,
        reason,
        items: JSON.stringify(items),
        date,
        adjustmentType,
        amountRecovered: parseFloat(amountRecovered || '0')
      }
      const res = await fetch('/api/stock-adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!res.ok) throw new Error('Failed to save')
      setMessage('Saved successfully')
      setItems([])
      setReference('')
      setReason('')
      setAmountRecovered('0')
    } catch (e) {
      setMessage('Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='p-8 space-y-6'>
      <h1 className='text-2xl font-semibold'>Add Stock Adjustment</h1>

      {/* Header form */}
      <div className='bg-white border rounded shadow p-4 grid grid-cols-1 md:grid-cols-4 gap-4'>
        <div>
          <label className='block text-xs text-gray-500 mb-1'>Business Location*</label>
          <select value={location} onChange={e=>setLocation(e.target.value)} className='border rounded p-2 w-full'>
            <option value=''>Please Select</option>
            <option value='NATURAL OPTIONS'>NATURAL OPTIONS</option>
            <option value='Warehouse A'>Warehouse A</option>
          </select>
        </div>
        <div>
          <label className='block text-xs text-gray-500 mb-1'>Reference No</label>
          <input value={reference} onChange={e=>setReference(e.target.value)} className='border rounded p-2 w-full' />
        </div>
        <div>
          <label className='block text-xs text-gray-500 mb-1'>Date*</label>
          <input type='datetime-local' value={date} onChange={e=>setDate(e.target.value)} className='border rounded p-2 w-full' />
        </div>
        <div>
          <label className='block text-xs text-gray-500 mb-1'>Adjustment type*</label>
          <select value={adjustmentType} onChange={e=>setAdjustmentType(e.target.value)} className='border rounded p-2 w-full'>
            <option value=''>Please Select</option>
            <option value='increase'>Stock Increase</option>
            <option value='decrease'>Stock Decrease</option>
            <option value='damage'>Damage</option>
            <option value='correction'>Correction</option>
          </select>
        </div>
      </div>

      {/* Items */}
      <div className='bg-white border rounded shadow p-4 space-y-3'>
        <div className='flex items-center gap-2'>
          <AsyncProductAutocomplete
            value={productQuery}
            onSelect={prod => {
              setItems(prev => [...prev, { id: Date.now(), product: prod.name, productId: prod.id, sku: prod.sku, quantity: 1, unitPrice: 0 }])
              setProductQuery('')
            }}
          />
        </div>
        <div className='overflow-auto'>
          <table className='min-w-full text-sm'>
            <thead>
              <tr className='bg-gray-50 text-gray-600'>
                <th className='text-left font-medium px-3 py-2 border-b'>Product</th>
                <th className='text-left font-medium px-3 py-2 border-b'>Quantity</th>
                <th className='text-left font-medium px-3 py-2 border-b'>Unit Price</th>
                <th className='text-right font-medium px-3 py-2 border-b'>Subtotal</th>
                <th className='px-3 py-2 border-b'>🗑️</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className='text-center text-gray-500 py-8'>No items added</td>
                </tr>
              ) : (
                items.map(it => (
                  <tr key={it.id} className='border-b'>
                    <td className='px-3 py-2'>
                      <input value={it.product} onChange={e=>updateItem(it.id, 'product', e.target.value)} className='border rounded p-2 w-full' />
                    </td>
                    <td className='px-3 py-2'>
                      <input type='number' min='0' value={it.quantity} onChange={e=>updateItem(it.id, 'quantity', Number(e.target.value))} className='border rounded p-2 w-full' />
                    </td>
                    <td className='px-3 py-2'>
                      <input type='number' min='0' step='0.01' value={it.unitPrice} onChange={e=>updateItem(it.id, 'unitPrice', Number(e.target.value))} className='border rounded p-2 w-full' />
                    </td>
                    <td className='px-3 py-2 text-right'>KSh {(Number(it.quantity||0)*Number(it.unitPrice||0)).toFixed(2)}</td>
                    <td className='px-3 py-2 text-center'>
                      <button onClick={()=>removeItem(it.id)} className='border rounded px-2 py-1 text-xs'>Remove</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr>
                <td className='px-3 py-2 font-medium' colSpan={3}>Total Amount:</td>
                <td className='px-3 py-2 text-right font-semibold'>KSh {totalAmount.toFixed(2)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className='bg-white border rounded shadow p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-start'>
        <div>
          <label className='block text-xs text-gray-500 mb-1'>Total amount recovered</label>
          <input value={amountRecovered} onChange={e=>setAmountRecovered(e.target.value)} className='border rounded p-2 w-full' />
        </div>
        <div>
          <label className='block text-xs text-gray-500 mb-1'>Reason</label>
          <textarea value={reason} onChange={e=>setReason(e.target.value)} className='border rounded p-2 w-full' rows={4} placeholder='Reason' />
        </div>
        <div className='md:col-span-2 flex items-center justify-end gap-3'>
          {message && <span className='text-sm text-gray-600'>{message}</span>}
          <button disabled={!canSave || saving} onClick={onSave} className={`rounded px-5 py-2 text-sm ${!canSave || saving ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
