"use client"

import { useEffect, useMemo, useState } from 'react'
import ReportLayout from '@/components/reports/ReportLayout'
import useReportQuery from '@/components/reports/useReportQuery'

function toDateInputValue(d) {
  const dt = new Date(d)
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

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

export default function ItemsReport({ lang = 'en' }) {
  const monthStart = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1), [])
  const today = useMemo(() => new Date(), [])
  const { params, setParams } = useReportQuery({ from: toDateInputValue(monthStart), to: toDateInputValue(today), q: '' })

  const [data, setData] = useState({ range: { from: monthStart, to: today }, items: [], totals: { quantity: 0, amount: 0 } })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState('quantity')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)
  const pageSize = 50

  const fetchReport = async () => {
    setLoading(true)
    setError('')
    try {
      const sp = new URLSearchParams()
      if (params.from) sp.set('from', params.from)
      if (params.to) sp.set('to', params.to)
      if (params.q) sp.set('q', params.q)
      const res = await fetch(`/api/reports/items${sp.toString() ? `?${sp.toString()}` : ''}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load report')
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError('Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReport() /* eslint-disable-line react-hooks/exhaustive-deps */ }, [params.from, params.to, params.q])

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
    { label: 'Items Report' }
  ]

  const exportCsv = () => {
    const rows = []
    rows.push(['SKU', 'Item', 'Quantity', 'Amount'])
    for (const it of data.items || []) rows.push([it.sku || '', it.name || '', String(it.quantity || 0), String(it.amount || 0)])
    rows.push([])
    rows.push(['Totals', '', String(data.totals.quantity || 0), String(data.totals.amount || 0)])
    const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    downloadCsv(`items-${params.from || ''}-${params.to || ''}.csv`, csv)
  }

  const actions = (
    <>
      <button className="px-3 py-2 border rounded hover:bg-gray-50" onClick={() => window.print()}>Print</button>
      <button className="px-3 py-2 border rounded hover:bg-gray-50" onClick={exportCsv}>Export CSV</button>
    </>
  )

  const filters = (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
      <div>
        <div className="text-xs text-gray-600 mb-1">From</div>
        <input type="date" className="border rounded px-3 py-2 w-full" value={params.from || ''} onChange={e => setParams({ from: e.target.value })} />
      </div>
      <div>
        <div className="text-xs text-gray-600 mb-1">To</div>
        <input type="date" className="border rounded px-3 py-2 w-full" value={params.to || ''} onChange={e => setParams({ to: e.target.value })} />
      </div>
      <div className="md:col-span-3">
        <div className="text-xs text-gray-600 mb-1">Search</div>
        <input type="text" className="border rounded px-3 py-2 w-full" value={params.q || ''} onChange={e => setParams({ q: e.target.value })} placeholder="Search item name or SKU…" />
      </div>
    </div>
  )

  return (
    <ReportLayout title="Items Report" description="Item sales quantity and amount within the selected period" breadcrumbs={breadcrumbs} actions={actions} filters={filters}>
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
              <div className="text-sm font-medium mb-2">Total Amount</div>
              <div className="text-lg font-semibold">{Number(data.totals.amount || 0).toLocaleString()}</div>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold mb-2">Top Items</div>
            <div className="border rounded">
              <div className="grid grid-cols-12 text-xs font-medium text-gray-700 border-b py-2 px-3">
                <button className="col-span-4 text-left" onClick={() => setSort('name')}>Item {sortBy==='name' ? (sortDir==='asc'?'↑':'↓') : ''}</button>
                <button className="col-span-3 text-left" onClick={() => setSort('sku')}>SKU {sortBy==='sku' ? (sortDir==='asc'?'↑':'↓') : ''}</button>
                <button className="col-span-2 text-right" onClick={() => setSort('quantity')}>Quantity {sortBy==='quantity' ? (sortDir==='asc'?'↑':'↓') : ''}</button>
                <button className="col-span-3 text-right" onClick={() => setSort('amount')}>Amount {sortBy==='amount' ? (sortDir==='asc'?'↑':'↓') : ''}</button>
              </div>
              {(pagedItems || []).map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 text-sm border-b py-2 px-3">
                  <div className="col-span-4 flex items-center gap-2">
                    <div className="h-2 bg-indigo-600" style={{ width: `${Math.min(100, (Number(it.quantity || 0) / Math.max(1, Number(sortedItems[0]?.quantity || 0))) * 100)}%` }} />
                    <span className="truncate">{it.name}</span>
                  </div>
                  <div className="col-span-3">{it.sku}</div>
                  <div className="col-span-2 text-right">{Number(it.quantity || 0).toLocaleString()}</div>
                  <div className="col-span-3 text-right">{Number(it.amount || 0).toLocaleString()}</div>
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
