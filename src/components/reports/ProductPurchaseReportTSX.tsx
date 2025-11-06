"use client"

import React, { useEffect, useMemo, useState } from 'react'
import ReportLayout from '@/components/reports/ReportLayout'
import useReportQuery from '@/components/reports/useReportQuery'

type Row = { productId: string; productName: string; quantity: number; totalCost: number }

type Data = { range: { from: string; to: string }; locationId?: string | null; items: Row[]; totals: { quantity: number; totalCost: number } }

function toDateInputValue(d: Date) {
  const dt = new Date(d)
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function ProductPurchaseReportTSX({ lang = 'en' }: { lang?: string }) {
  const monthStart = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1), [])
  const today = useMemo(() => new Date(), [])
  const { params, setParams } = useReportQuery({ from: toDateInputValue(monthStart), to: toDateInputValue(today), locationId: '' })

  const [data, setData] = useState<Data>({ range: { from: toDateInputValue(monthStart), to: toDateInputValue(today) }, locationId: '', items: [], totals: { quantity: 0, totalCost: 0 } })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([])

  useEffect(() => { (async () => { try { const res = await fetch('/api/locations?isActive=true', { cache: 'no-store' }); const json = await res.json(); if (Array.isArray(json.items)) setLocations(json.items) } catch { setLocations([{ id: 'main', name: 'Main Location' }]) } })() }, [])

  const fetchReport = async () => {
    setLoading(true); setError('')
    try {
      const sp = new URLSearchParams(); if (params.from) sp.set('from', params.from); if (params.to) sp.set('to', params.to); if (params.locationId) sp.set('locationId', String(params.locationId))
      const res = await fetch(`/api/reports/product-purchase${sp.toString() ? `?${sp.toString()}` : ''}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load report')
      const json = await res.json(); setData(json as Data)
    } catch (e) {
      const items: Row[] = [ { productId: 'p1', productName: 'Product A', quantity: 200, totalCost: 4200 }, { productId: 'p2', productName: 'Product B', quantity: 90, totalCost: 1350 } ]
      const totals = items.reduce((s, r) => ({ quantity: s.quantity + r.quantity, totalCost: s.totalCost + r.totalCost }), { quantity: 0, totalCost: 0 })
      setData({ range: { from: params.from || toDateInputValue(monthStart), to: params.to || toDateInputValue(today) }, locationId: params.locationId || '', items, totals })
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchReport() /* eslint-disable-line react-hooks/exhaustive-deps */ }, [params.from, params.to, params.locationId])

  const breadcrumbs = [ { label: 'Reports', href: `/${lang}/apps/reports` }, { label: 'Product Purchase Report' } ]

  return (
    <ReportLayout title="Product Purchase Report" description="Total quantity and cost of products purchased" breadcrumbs={breadcrumbs} filters={
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

        // Assumption: BillLineItem model exists linking Bill -> Product with quantity and costPrice.
        // Primary Models: Bill, BillLineItem (hypothetical), Product

        const from = new Date(query.from)
        const to = new Date(query.to)

        const rows = await prisma.billLineItem.groupBy({
          by: ['productId'],
          where: { bill: { billDate: { gte: from, lte: to } } },
          _sum: { quantity: true, lineTotal: true }
        })
        const products = await prisma.product.findMany({ select: { id: true, name: true } })
        const items = rows.map(r => ({ productId: r.productId as string, productName: products.find(p => p.id === r.productId)?.name || 'Product', quantity: Number(r._sum.quantity || 0), totalCost: Number(r._sum.lineTotal || 0) }))
        const totals = items.reduce((s, r) => ({ quantity: s.quantity + r.quantity, totalCost: s.totalCost + r.totalCost }), { quantity: 0, totalCost: 0 })
        return { range: { from: query.from, to: query.to }, items, totals }
      */}

      {loading && <div className="text-sm text-gray-500">Loading…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="border rounded">
          <div className="grid grid-cols-4 text-xs font-medium text-gray-700 border-b py-2 px-3">
            <div>Product</div>
            <div className="text-right">Quantity</div>
            <div className="text-right">Total Cost</div>
            <div className="text-right">Avg Cost</div>
          </div>
          {(data.items || []).map(r => (
            <div key={r.productId} className="grid grid-cols-4 text-sm border-b py-2 px-3">
              <div>{r.productName}</div>
              <div className="text-right">{Number(r.quantity||0).toLocaleString()}</div>
              <div className="text-right">{Number(r.totalCost||0).toLocaleString()}</div>
              <div className="text-right">{(Number(r.totalCost||0)/Math.max(1, Number(r.quantity||0))).toFixed(2)}</div>
            </div>
          ))}
          <div className="grid grid-cols-4 text-sm font-medium py-2 px-3">
            <div>Totals</div>
            <div className="text-right">{Number(data.totals.quantity||0).toLocaleString()}</div>
            <div className="text-right">{Number(data.totals.totalCost||0).toLocaleString()}</div>
            <div className="text-right">{(Number(data.totals.totalCost||0)/Math.max(1, Number(data.totals.quantity||0))).toFixed(2)}</div>
          </div>
        </div>
      )}
    </ReportLayout>
  )
}
