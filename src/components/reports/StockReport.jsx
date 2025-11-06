"use client"

import { useEffect, useMemo, useState } from 'react'
import ReportLayout from '@/components/reports/ReportLayout'
import useReportQuery from '@/components/reports/useReportQuery'

function downloadCsv(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export default function StockReport({ lang = 'en' }) {
  const { params, setParams } = useReportQuery({ warehouseId: '', sku: '', q: '' })

  const [data, setData] = useState({ items: [], totals: { quantity: 0, value: 0 } })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState('productName')
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(1)
  const pageSize = 50

  const [warehouses, setWarehouses] = useState([])

  // Load warehouses
  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/warehouses?status=active', { cache: 'no-store' })
        const json = await res.json()
        setWarehouses(Array.isArray(json.warehouses) ? json.warehouses : [])
      } catch {}
    })()
  }, [])

  const fetchReport = async () => {
    setLoading(true)
    setError('')
    try {
      const sp = new URLSearchParams()
      if (params.warehouseId) sp.set('warehouseId', params.warehouseId)
      if (params.sku) sp.set('sku', params.sku)
      if (params.q) sp.set('q', params.q)
      const res = await fetch(`/api/reports/stock${sp.toString() ? `?${sp.toString()}` : ''}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load report')
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError('Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReport() /* eslint-disable-line react-hooks/exhaustive-deps */ }, [params.warehouseId, params.sku, params.q])

  const sortedItems = useMemo(() => {
    const items = [...(data.items || [])]
    const mult = sortDir === 'asc' ? 1 : -1
    items.sort((a, b) => {
      const av = a[sortBy]
      const bv = b[sortBy]
      if (typeof av === 'number' || typeof bv === 'number') return (Number(av) - Number(bv)) * mult
      return String(av || '').localeCompare(String(bv || '')) * mult
    })
    return items
  }, [data.items, sortBy, sortDir])

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedItems = useMemo(() => sortedItems.slice((currentPage - 1) * pageSize, currentPage * pageSize), [sortedItems, currentPage])

  const setSort = (field) => {
    if (sortBy === field) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortBy(field); setSortDir('asc') }
    setPage(1)
  }

  const breadcrumbs = [
    { label: 'Reports', href: `/${lang}/apps/reports` },
    { label: 'Stock Report' }
  ]

  const exportCsv = () => {
    const rows = []
    rows.push(['SKU', 'Product', 'Quantity', 'Avg Cost', 'Value'])
    for (const it of data.items || []) rows.push([it.sku || '', it.productName || '', String(it.quantity || 0), String(it.avgCost || 0), String(it.value || 0)])
    rows.push([])
    rows.push(['Totals', '', String(data.totals.quantity || 0), '', String(data.totals.value || 0)])
    const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    downloadCsv(`stock-${params.warehouseId || 'all'}.csv`, csv)
  }

  const actions = (
    <>
      <button className="px-3 py-2 border rounded hover:bg-gray-50" onClick={() => window.print()}>Print</button>
      <button className="px-3 py-2 border rounded hover:bg-gray-50" onClick={exportCsv}>Export CSV</button>
    </>
  )

  const filters = (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      <div>
        <div className="text-xs text-gray-600 mb-1">Warehouse</div>
        <select className="border rounded px-3 py-2 w-full" value={params.warehouseId || ''} onChange={e => setParams({ warehouseId: e.target.value })}>
          <option value="">All Warehouses</option>
          {warehouses.map(w => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      </div>
      <div>
        <div className="text-xs text-gray-600 mb-1">SKU</div>
        <input type="text" className="border rounded px-3 py-2 w-full" value={params.sku || ''} onChange={e => setParams({ sku: e.target.value })} placeholder="SKU contains…" />
      </div>
      <div>
        <div className="text-xs text-gray-600 mb-1">Search</div>
        <input type="text" className="border rounded px-3 py-2 w-full" value={params.q || ''} onChange={e => setParams({ q: e.target.value })} placeholder="Name or SKU…" />
      </div>
    </div>
  )

  return (
    <ReportLayout title="Stock Report" description="Inventory quantity and value by item" breadcrumbs={breadcrumbs} actions={actions} filters={filters}>
      {loading && <div className="text-sm text-gray-500">Loading…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="border rounded p-3">
              <div className="text-sm font-medium mb-2">Total Quantity</div>
              <div className="text-lg font-semibold">{Number(data.totals.quantity || 0).toLocaleString()}</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-sm font-medium mb-2">Total Value</div>
              <div className="text-lg font-semibold">{Number(data.totals.value || 0).toLocaleString()}</div>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold mb-2">Stock Items</div>
            <div className="border rounded">
              <div className="grid grid-cols-12 text-xs font-medium text-gray-700 border-b py-2 px-3">
                <button className="col-span-3 text-left" onClick={() => setSort('productName')}>Product {sortBy==='productName' ? (sortDir==='asc'?'↑':'↓') : ''}</button>
                <button className="col-span-3 text-left" onClick={() => setSort('sku')}>SKU {sortBy==='sku' ? (sortDir==='asc'?'↑':'↓') : ''}</button>
                <button className="col-span-2 text-right" onClick={() => setSort('quantity')}>Quantity {sortBy==='quantity' ? (sortDir==='asc'?'↑':'↓') : ''}</button>
                <button className="col-span-2 text-right" onClick={() => setSort('avgCost')}>Avg Cost {sortBy==='avgCost' ? (sortDir==='asc'?'↑':'↓') : ''}</button>
                <button className="col-span-2 text-right" onClick={() => setSort('value')}>Value {sortBy==='value' ? (sortDir==='asc'?'↑':'↓') : ''}</button>
              </div>
              {(pagedItems || []).map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 text-sm border-b py-2 px-3">
                  <div className="col-span-3">{it.productName}</div>
                  <div className="col-span-3">{it.sku}</div>
                  <div className="col-span-2 text-right">{Number(it.quantity || 0).toLocaleString()}</div>
                  <div className="col-span-2 text-right">{Number(it.avgCost || 0).toLocaleString()}</div>
                  <div className="col-span-2 text-right">{Number(it.value || 0).toLocaleString()}</div>
                </div>
              ))}
              <div className="flex items-center justify-between p-3 text-sm">
                <div>Page {currentPage} of {totalPages}</div>
                <div className="flex gap-2">
                  <button className="px-2 py-1 border rounded disabled:opacity-50" disabled={currentPage<=1} onClick={() => setPage(p => Math.max(1, p-1))}>Prev</button>
                  <button className="px-2 py-1 border rounded disabled:opacity-50" disabled={currentPage>=totalPages} onClick={() => setPage(p => Math.min(totalPages, p+1))}>Next</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ReportLayout>
  )
}
