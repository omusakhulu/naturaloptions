'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DraftsListPage() {
  const router = useRouter()
  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(null)

  const fetchDrafts = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/pos/parked-sales')
      if (!res.ok) throw new Error('Failed to load drafts')
      const data = await res.json()
      setDrafts(data.sales || data || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDrafts()
  }, [])

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this draft?')) return
    
    setDeleting(id)
    try {
      const res = await fetch(`/api/pos/parked-sales?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete draft')
      setDrafts(drafts.filter(d => d.id !== id))
    } catch (e) {
      setError(e.message)
    } finally {
      setDeleting(null)
    }
  }

  const handleResume = async (draft) => {
    // Store draft in sessionStorage and redirect to add sale page
    sessionStorage.setItem('resumeDraft', JSON.stringify(draft))
    router.push('/en/apps/sell/add')
  }

  const handleConvert = async (draft) => {
    try {
      const res = await fetch('/api/sell/pos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: draft.customerId,
          items: JSON.parse(draft.cartItems || '[]').map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.price
          })),
          paymentMethod: 'CASH',
          notes: draft.notes,
          fromDraft: draft.id
        })
      })

      if (!res.ok) throw new Error('Failed to convert draft to sale')
      
      // Delete the draft after successful conversion
      await fetch(`/api/pos/parked-sales?id=${draft.id}`, { method: 'DELETE' })
      
      alert('Draft converted to sale successfully!')
      fetchDrafts()
    } catch (e) {
      setError(e.message)
    }
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-KE', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  }

  const parseCartItems = (cartItemsStr) => {
    try {
      return JSON.parse(cartItemsStr || '[]')
    } catch {
      return []
    }
  }

  return (
    <div className='p-6'>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-2xl font-semibold'>Sales Drafts</h1>
          <p className='text-gray-500 text-sm mt-1'>Manage parked/saved sales that haven&apos;t been completed</p>
        </div>
        <button
          onClick={fetchDrafts}
          disabled={loading}
          className='px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50'
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className='mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded'>
          {error}
        </div>
      )}

      {loading ? (
        <div className='text-center py-12 text-gray-500'>Loading drafts...</div>
      ) : drafts.length === 0 ? (
        <div className='text-center py-12 bg-gray-50 rounded-lg'>
          <p className='text-gray-500'>No drafts found</p>
          <p className='text-sm text-gray-400 mt-2'>
            Drafts are created when you save a sale without completing it
          </p>
        </div>
      ) : (
        <div className='grid gap-4'>
          {drafts.map(draft => {
            const items = parseCartItems(draft.cartItems)
            const itemCount = items.reduce((sum, i) => sum + (i.quantity || 1), 0)
            
            return (
              <div key={draft.id} className='bg-white border rounded-lg p-4'>
                <div className='flex justify-between items-start'>
                  <div>
                    <div className='flex items-center gap-3'>
                      <span className='font-semibold text-lg'>{draft.saleNumber}</span>
                      <span className='px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded'>
                        Draft
                      </span>
                    </div>
                    <p className='text-sm text-gray-500 mt-1'>
                      Created: {formatDate(draft.createdAt)}
                    </p>
                    {draft.notes && (
                      <p className='text-sm text-gray-600 mt-2 italic'>&quot;{draft.notes}&quot;</p>
                    )}
                  </div>
                  <div className='text-right'>
                    <div className='text-lg font-semibold'>
                      KES {parseFloat(draft.totalAmount || 0).toLocaleString()}
                    </div>
                    <div className='text-sm text-gray-500'>
                      {itemCount} item{itemCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                {/* Items Preview */}
                {items.length > 0 && (
                  <div className='mt-4 pt-4 border-t'>
                    <div className='text-xs text-gray-500 mb-2'>Items:</div>
                    <div className='flex flex-wrap gap-2'>
                      {items.slice(0, 5).map((item, idx) => (
                        <span key={idx} className='px-2 py-1 bg-gray-100 rounded text-sm'>
                          {item.name} × {item.quantity}
                        </span>
                      ))}
                      {items.length > 5 && (
                        <span className='px-2 py-1 bg-gray-100 rounded text-sm text-gray-500'>
                          +{items.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className='mt-4 pt-4 border-t flex gap-2'>
                  <button
                    onClick={() => handleConvert(draft)}
                    className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm'
                  >
                    Convert to Sale
                  </button>
                  <button
                    onClick={() => handleResume(draft)}
                    className='px-4 py-2 border rounded hover:bg-gray-50 text-sm'
                  >
                    Edit Draft
                  </button>
                  <button
                    onClick={() => handleDelete(draft.id)}
                    disabled={deleting === draft.id}
                    className='px-4 py-2 border border-red-200 text-red-600 rounded hover:bg-red-50 text-sm disabled:opacity-50'
                  >
                    {deleting === draft.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
