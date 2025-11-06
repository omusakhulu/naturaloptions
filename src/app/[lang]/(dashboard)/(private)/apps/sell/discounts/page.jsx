'use client'

import { useMemo, useState } from 'react'

export default function DiscountsPage() {
  // Sample products (replace with real data later)
  const [productSearch, setProductSearch] = useState('')
  const [products] = useState([
    { id: 1, sku: 'SKU-001', name: 'Non Woven Bag', price: 30 },
    { id: 2, sku: 'SKU-002', name: 'KAGI Lotion', price: 220 },
    { id: 3, sku: 'SKU-003', name: 'Kids Analgesic', price: 350 },
    { id: 4, sku: 'SKU-004', name: 'Youth Clock T-Shirt', price: 1200 },
    { id: 5, sku: 'SKU-005', name: 'Beauty Hand Cream 50ml', price: 450 },
    { id: 6, sku: 'SKU-006', name: 'Aloe Vera Gel 100ml', price: 680 },
    { id: 7, sku: 'SKU-007', name: 'Face Mask Pack', price: 260 },
    { id: 8, sku: 'SKU-008', name: 'Hair Serum 30ml', price: 1500 }
  ])

  const [selectedIds, setSelectedIds] = useState([])
  const allVisibleSelected = useMemo(() => {
    const visibleIds = new Set(
      products
        .filter(p => `${p.name} ${p.sku}`.toLowerCase().includes(productSearch.toLowerCase()))
        .map(p => p.id)
    )
    return products
      .filter(p => visibleIds.has(p.id))
      .every(p => selectedIds.includes(p.id))
  }, [products, selectedIds, productSearch])

  const [campaignName, setCampaignName] = useState('')
  const [discountType, setDiscountType] = useState('percentage') // 'percentage' | 'fixed'
  const [discountValue, setDiscountValue] = useState('')
  const [startAt, setStartAt] = useState(() => new Date().toISOString().slice(0, 16))
  const [endAt, setEndAt] = useState('')

  const [activeDiscounts, setActiveDiscounts] = useState([])

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase()
    if (!q) return products
    return products.filter(p => `${p.name} ${p.sku}`.toLowerCase().includes(q))
  }, [products, productSearch])

  const toggleSelect = id => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
  }

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredProducts.map(p => p.id)
    if (visibleIds.every(id => selectedIds.includes(id))) {
      // Deselect visible
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)))
    } else {
      // Select missing visible
      setSelectedIds(prev => Array.from(new Set([...prev, ...visibleIds])))
    }
  }

  const clearSelection = () => setSelectedIds([])

  const canApply = useMemo(() => {
    const val = parseFloat(discountValue)
    if (!selectedIds.length) return false
    if (!discountValue || isNaN(val) || val <= 0) return false
    if (discountType === 'percentage' && val > 100) return false
    if (!startAt || !endAt) return false
    return new Date(endAt) > new Date(startAt)
  }, [selectedIds.length, discountType, discountValue, startAt, endAt])

  const statusOf = (start, end) => {
    const now = new Date()
    const s = new Date(start)
    const e = new Date(end)
    if (now < s) return 'Scheduled'
    if (now > e) return 'Expired'
    return 'Active'
  }

  const applyDiscount = () => {
    if (!canApply) return
    const id = Date.now()
    const label = campaignName?.trim() || `Bulk Discount #${activeDiscounts.length + 1}`
    const d = {
      id,
      name: label,
      type: discountType,
      value: parseFloat(discountValue),
      startAt,
      endAt,
      products: selectedIds.slice(0),
      count: selectedIds.length,
      status: statusOf(startAt, endAt)
    }
    setActiveDiscounts(prev => [d, ...prev])
    // Reset only values; keep selection in case user wants to apply another
    setCampaignName('')
    setDiscountValue('')
  }

  const removeDiscount = id => setActiveDiscounts(prev => prev.filter(d => d.id !== id))

  return (
    <div className='p-8 space-y-6'>
      <h1 className='text-2xl font-semibold'>Discounts</h1>

      {/* Bulk Discount Form */}
      <div className='bg-white border rounded shadow p-4 space-y-4'>
        <h2 className='font-medium'>Bulk discount</h2>
        <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
          <div className='md:col-span-2'>
            <label className='block text-xs text-gray-500 mb-1'>Campaign name</label>
            <input value={campaignName} onChange={e=>setCampaignName(e.target.value)} className='border rounded p-2 w-full' placeholder='Optional e.g. Black Friday' />
          </div>
          <div>
            <label className='block text-xs text-gray-500 mb-1'>Type</label>
            <select value={discountType} onChange={e=>setDiscountType(e.target.value)} className='border rounded p-2 w-full'>
              <option value='percentage'>Percentage %</option>
              <option value='fixed'>Fixed amount (KES)</option>
            </select>
          </div>
          <div>
            <label className='block text-xs text-gray-500 mb-1'>Value</label>
            <input value={discountValue} onChange={e=>setDiscountValue(e.target.value)} className='border rounded p-2 w-full' placeholder={discountType==='percentage' ? 'e.g. 10 for 10%' : 'e.g. 200 for KSh 200'} />
          </div>
          <div>
            <label className='block text-xs text-gray-500 mb-1'>Start</label>
            <input type='datetime-local' value={startAt} onChange={e=>setStartAt(e.target.value)} className='border rounded p-2 w-full' />
          </div>
          <div>
            <label className='block text-xs text-gray-500 mb-1'>End</label>
            <input type='datetime-local' value={endAt} onChange={e=>setEndAt(e.target.value)} className='border rounded p-2 w-full' />
          </div>
        </div>

        {/* Product Selector */}
        <div className='space-y-2'>
          <div className='flex flex-wrap items-center gap-2'>
            <input value={productSearch} onChange={e=>setProductSearch(e.target.value)} className='border rounded p-2 text-sm' placeholder='Search products by name or SKU' />
            <button onClick={toggleSelectAllVisible} className='border rounded px-3 py-2 text-sm'>
              {allVisibleSelected ? 'Deselect visible' : 'Select visible'}
            </button>
            <button onClick={clearSelection} className='border rounded px-3 py-2 text-sm'>Clear selection</button>
            <div className='ml-auto text-sm text-gray-600'>Selected: <span className='font-medium'>{selectedIds.length}</span></div>
          </div>
          <div className='overflow-auto border rounded'>
            <table className='min-w-full text-sm'>
              <thead>
                <tr className='bg-gray-50 text-gray-600'>
                  <th className='px-3 py-2 border-b'><input type='checkbox' checked={allVisibleSelected} onChange={toggleSelectAllVisible} /></th>
                  <th className='text-left font-medium px-3 py-2 border-b'>SKU</th>
                  <th className='text-left font-medium px-3 py-2 border-b'>Product</th>
                  <th className='text-right font-medium px-3 py-2 border-b'>Price</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => (
                  <tr key={p.id} className='border-b'>
                    <td className='px-3 py-2'><input type='checkbox' checked={selectedIds.includes(p.id)} onChange={()=>toggleSelect(p.id)} /></td>
                    <td className='px-3 py-2'>{p.sku}</td>
                    <td className='px-3 py-2'>{p.name}</td>
                    <td className='px-3 py-2 text-right'>KSh {p.price.toLocaleString('en-KE')}</td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr><td colSpan={4} className='text-center text-gray-500 py-6'>No products found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className='flex items-center justify-between pt-2'>
          <div className='text-xs text-gray-500'>Tip: Percentage is applied per selected product’s current price.</div>
          <button disabled={!canApply} onClick={applyDiscount} className={`rounded px-4 py-2 text-sm ${canApply ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>
            Apply discount to {selectedIds.length} product{selectedIds.length === 1 ? '' : 's'}
          </button>
        </div>
      </div>

      {/* Active Discounts */}
      <div className='bg-white border rounded shadow p-4'>
        <div className='flex items-center justify-between mb-3'>
          <h2 className='font-medium'>Active discounts</h2>
          <div className='text-sm text-gray-600'>{activeDiscounts.length} campaign{activeDiscounts.length === 1 ? '' : 's'}</div>
        </div>
        <div className='overflow-auto'>
          <table className='min-w-full text-sm'>
            <thead>
              <tr className='bg-gray-50 text-gray-600'>
                <th className='text-left font-medium px-3 py-2 border-b'>Campaign</th>
                <th className='text-left font-medium px-3 py-2 border-b'>Type</th>
                <th className='text-left font-medium px-3 py-2 border-b'>Value</th>
                <th className='text-left font-medium px-3 py-2 border-b'>Products</th>
                <th className='text-left font-medium px-3 py-2 border-b'>Period</th>
                <th className='text-left font-medium px-3 py-2 border-b'>Status</th>
                <th className='px-3 py-2 border-b'>Action</th>
              </tr>
            </thead>
            <tbody>
              {activeDiscounts.length === 0 ? (
                <tr><td colSpan={7} className='text-center text-gray-500 py-8'>No active discounts.</td></tr>
              ) : (
                activeDiscounts.map(d => (
                  <tr key={d.id} className='border-b'>
                    <td className='px-3 py-2'>{d.name}</td>
                    <td className='px-3 py-2 capitalize'>{d.type}</td>
                    <td className='px-3 py-2'>{d.type === 'percentage' ? `${d.value}%` : `KSh ${d.value.toLocaleString('en-KE')}`}</td>
                    <td className='px-3 py-2'>{d.count}</td>
                    <td className='px-3 py-2'>{new Date(d.startAt).toLocaleString()} — {new Date(d.endAt).toLocaleString()}</td>
                    <td className='px-3 py-2'>
                      <span className={`px-2 py-1 rounded text-xs ${d.status === 'Active' ? 'bg-green-100 text-green-700' : d.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{d.status}</span>
                    </td>
                    <td className='px-3 py-2'>
                      <button onClick={()=>removeDiscount(d.id)} className='border rounded px-3 py-1 text-sm'>Remove</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
