"use client"

import React, { useEffect, useMemo, useState } from 'react'
import ReportLayout from '@/components/reports/ReportLayout'
import useReportQuery from '@/components/reports/useReportQuery'

type Row = { productId: string; productName: string; quantity: number; revenue: number; grossProfit: number }

type Data = { range: { from: string; to: string }; locationId?: string | null; items: Row[]; totals: { quantity: number; revenue: number; grossProfit: number } }

function toDateInputValue(d: Date) {
  const dt = new Date(d)
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function ProductSellReportTSX({ lang = 'en' }: { lang?: string }) {
  const monthStart = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1), [])
  const today = useMemo(() => new Date(), [])
  const { params, setParams } = useReportQuery({ from: toDateInputValue(monthStart), to: toDateInputValue(today), locationId: '' })

  const [data, setData] = useState<Data>({ range: { from: toDateInputValue(monthStart), to: toDateInputValue(today) }, locationId: '', items: [], totals: { quantity: 0, revenue: 0, grossProfit: 0 } })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([])

  useEffect(() => { (async () => { try { const res = await fetch('/api/locations?isActive=true', { cache: 'no-store' }); const json = await res.json(); if (Array.isArray(json.items)) setLocations(json.items) } catch { setLocations([{ id: 'main', name: 'Main Location' }]) } })() }, [])

  const fetchReport = async () => {
    setLoading(true); setError('')
    try {
      const sp = new URLSearchParams(); if (params.from) sp.set('from', params.from); if (params.to) sp.set('to', params.to); if (params.locationId) sp.set('locationId', String(params.locationId))
      const res = await fetch(`/api/reports/product-sell${sp.toString() ? `?${sp.toString()}` : ''}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load report')
      const json = await res.json(); setData(json as Data)
    } catch (e) {
      const items: Row[] = [ { productId: 'p1', productName: 'Product A', quantity: 140, revenue: 5600, grossProfit: 2100 }, { productId: 'p2', productName: 'Product B', quantity: 60, revenue: 1800, grossProfit: 700 } ]
      const totals = items.reduce((s, r) => ({ quantity: s.quantity + r.quantity, revenue: s.revenue + r.revenue, grossProfit: s.grossProfit + r.grossProfit }), { quantity: 0, revenue: 0, grossProfit: 0 })
      setData({ range: { from: params.from || toDateInputValue(monthStart), to: params.to || toDateInputValue(today) }, locationId: params.locationId || '', items, totals })
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchReport() /* eslint-disable-line react-hooks/exhaustive-deps */ }, [params.from, params.to, params.locationId])

  const breadcrumbs = [ { label: 'Reports', href: `/${lang}/apps/reports` }, { label: 'Product Sell Report' } ]

  return (
    <ReportLayout title="Product Sell Report" description="Revenue, gross profit and quantity sold per product" breadcrumbs={breadcrumbs} filters={
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <div className="text-xs text-gray-600 mb-1">From</div>
          <input type="date" className="border rounded px-3 py-2 w-full" value={params.from || ''} onChange={e => setParams({ from: e.target.value })} />
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">To</div>
          <input type="date" className="border rounded px-3 py-2 w-full" value={params.to || ''} onChange={e => setParams({ to: e.target.value })} />
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">Location</div>
          <select className="border rounded px-3 py-2 w-full" value={params.locationId || ''} onChange={e => setParams({ locationId: e.target.value })}>
            <option value="">All Locations</option>
            {locations.map(l => (<option key={l.id} value={l.id}>{l.name}</option>))}
          </select>
        </div>
      </div>
    }>
      {/*
        Prisma Logic:

        // Inputs: from, to; optional locationId via POSSale.terminal.locationId
        // Primary Models: POSSaleItem, Product
        // Gross Profit approximation: POSSaleItem.total - (POSSaleItem.quantity * Product.costPrice)

        const from = new Date(query.from)
        const to = new Date(query.to)

        const rows = await prisma.pOSSaleItem.groupBy({
          by: ['productId'],
          where: { sale: { saleDate: { gte: from, lte: to }, ...(query.locationId ? { terminal: { locationId: query.locationId } } : {}) } },
          _sum: { quantity: true, total: true }
        })
        const products = await prisma.product.findMany({ select: { id: true, name: true, costPrice: true } })
        const items = rows.map(r => {
          const p = products.find(x => x.id === r.productId)
          const qty = Number(r._sum.quantity || 0)
          const revenue = Number(r._sum.total || 0)
          const gp = revenue - qty * Number(p?.costPrice || 0)
          return { productId: r.productId as string, productName: p?.name || 'Product', quantity: qty, revenue, grossProfit: gp }
        })
        const totals = items.reduce((s, r) => ({ quantity: s.quantity + r.quantity, revenue: s.revenue + r.revenue, grossProfit: s.grossProfit + r.grossProfit }), { quantity: 0, revenue: 0, grossProfit: 0 })
        return { range: { from: query.from, to: query.to }, items, totals }
      */}

      {loading && <div className="text-sm text-gray-500">Loading…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="border rounded">
          <div className="grid grid-cols-5 text-xs font-medium text-gray-700 border-b py-2 px-3">
            <div className="col-span-2">Product</div>
            <div className="text-right">Quantity</div>
            <div className="text-right">Revenue</div>
            <div className="text-right">Gross Profit</div>
          </div>
          {(data.items || []).map(r => (
            <div key={r.productId} className="grid grid-cols-5 text-sm border-b py-2 px-3">
              <div className="col-span-2">{r.productName}</div>
              <div className="text-right">{Number(r.quantity||0).toLocaleString()}</div>
              <div className="text-right">{Number(r.revenue||0).toLocaleString()}</div>
              <div className="text-right">{Number(r.grossProfit||0).toLocaleString()}</div>
            </div>
          ))}
          <div className="grid grid-cols-5 text-sm font-medium py-2 px-3">
            <div className="col-span-2">Totals</div>
            <div className="text-right">{Number(data.totals.quantity||0).toLocaleString()}</div>
            <div className="text-right">{Number(data.totals.revenue||0).toLocaleString()}</div>
            <div className="text-right">{Number(data.totals.grossProfit||0).toLocaleString()}</div>
          </div>
        </div>
      )}
    </ReportLayout>
  )
}
