'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'react-toastify'

export default function PurchaseOrderEditPage() {
  const router = useRouter()
  const { lang, id } = useParams()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  const [status, setStatus] = useState('DRAFT')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([])

  const fetchOrder = async () => {
    if (!id) return

    setLoading(true)
    try {
      const res = await fetch(`/api/purchases/orders?id=${id}`, { cache: 'no-store' })
      const result = await res.json()

      if (!res.ok) {
        toast.error(result?.error || 'Failed to load purchase order')
        return
      }

      const o = result.order
      setOrderNumber(o?.orderNumber || '')
      setStatus(o?.status || 'DRAFT')
      setNotes(o?.notes || '')
      setItems(Array.isArray(o?.items) ? o.items : [])
    } catch (e) {
      console.error('Failed to load purchase order:', e)
      toast.error('Failed to load purchase order')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrder()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleSave = async () => {
    if (!id) return

    setSaving(true)
    try {
      const res = await fetch('/api/purchases/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status,
          notes,
          items
        })
      })

      const result = await res.json().catch(() => ({}))

      if (!res.ok) {
        toast.error(result?.error || 'Failed to update purchase order')
        return
      }

      toast.success('Purchase order updated')
      router.push(`/${lang}/apps/purchases/order`)
    } catch (e) {
      console.error('Failed to update purchase order:', e)
      toast.error('Failed to update purchase order')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='p-8 space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-semibold'>Edit Purchase Order</h1>
          <div className='text-sm text-gray-500'>Order: {orderNumber || String(id || '')}</div>
        </div>
        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={() => router.push(`/${lang}/apps/purchases/order`)}
            className='border px-4 py-2 rounded'
          >
            Back
          </button>
          <button
            type='button'
            onClick={handleSave}
            disabled={saving || loading}
            className='bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-60'
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className='bg-white border rounded p-8 text-center text-gray-500'>Loading purchase order...</div>
      ) : (
        <div className='bg-white border rounded p-4 space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='text-sm'>Status</label>
              <select
                className='w-full border p-2 rounded text-sm'
                value={status}
                onChange={e => setStatus(e.target.value)}
              >
                <option value='DRAFT'>DRAFT</option>
                <option value='APPROVED'>APPROVED</option>
                <option value='CANCELLED'>CANCELLED</option>
                <option value='RECEIVED'>RECEIVED</option>
              </select>
            </div>
            <div>
              <label className='text-sm'>Notes</label>
              <textarea
                className='w-full border p-2 rounded text-sm'
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div>
            <div className='text-sm font-medium mb-2'>Items</div>
            <div className='overflow-x-auto'>
              <table className='min-w-full text-sm border'>
                <thead className='bg-gray-100'>
                  <tr>
                    {['Product', 'SKU', 'Qty', 'Unit Price'].map(h => (
                      <th key={h} className='border px-2 py-1'>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className='text-center p-4 text-gray-500'>
                        No items
                      </td>
                    </tr>
                  ) : (
                    items.map((it, idx) => (
                      <tr key={it.id || idx} className='odd:bg-gray-50'>
                        <td className='border px-2 py-1'>{it.productName}</td>
                        <td className='border px-2 py-1'>{it.sku}</td>
                        <td className='border px-2 py-1 text-center'>{it.quantity}</td>
                        <td className='border px-2 py-1 text-right'>{it.unitPrice}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
