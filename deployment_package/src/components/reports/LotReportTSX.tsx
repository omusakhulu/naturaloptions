"use client"

import React, { useEffect, useMemo, useState } from 'react'
import ReportLayout from '@/components/reports/ReportLayout'
import useReportQuery from '@/components/reports/useReportQuery'

type Row = { lotNumber: string; sku: string; productName: string; quantity: number; location?: string }

type Data = {
  range: { from: string; to: string }
  locationId?: string | null
  items: Row[]
}

function toDateInputValue(d: Date) {
  const dt = new Date(d)
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function LotReportTSX({ lang = 'en' }: { lang?: string }) {
  const monthStart = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1), [])
  const today = useMemo(() => new Date(), [])
  const { params, setParams } = useReportQuery({ from: toDateInputValue(monthStart), to: toDateInputValue(today), locationId: '' })

  const [data, setData] = useState<Data>({ range: { from: toDateInputValue(monthStart), to: toDateInputValue(today) }, locationId: '', items: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/locations?isActive=true', { cache: 'no-store' })
        const json = await res.json()
        if (Array.isArray(json.items)) setLocations(json.items)
      } catch {
        setLocations([{ id: 'main', name: 'Main Location' }])
      }
    })()
  }, [])

  const fetchReport = async () => {
    setLoading(true)
    setError('')
    try {
      const sp = new URLSearchParams()
      if (params.from) sp.set('from', params.from)
      if (params.to) sp.set('to', params.to)
      if (params.locationId) sp.set('locationId', String(params.locationId))
      const res = await fetch(`/api/reports/lot${sp.toString() ? `?${sp.toString()}` : ''}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load report')
      const json = await res.json()
      setData(json as Data)
    } catch (e) {
      // Mock
      const items: Row[] = [
        { lotNumber: 'LOT-2025-0001', sku: 'SKU-001', productName: 'Product A', quantity: 30, location: 'A-1' },
        { lotNumber: 'LOT-2025-0001', sku: 'SKU-002', productName: 'Product B', quantity: 10, location: 'A-2' },
        { lotNumber: 'LOT-2025-0002', sku: 'SKU-001', productName: 'Product A', quantity: 15, location: 'B-1' }
      ]
      setData({ range: { from: params.from || toDateInputValue(monthStart), to: params.to || toDateInputValue(today) }, locationId: params.locationId || '', items })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReport() /* eslint-disable-line react-hooks/exhaustive-deps */ }, [params.from, params.to, params.locationId])

  const breadcrumbs = [ { label: 'Reports', href: `/${lang}/apps/reports` }, { label: 'Lot Report' } ]

  return (
    <ReportLayout
      title="Lot Report"
      description="Inventory grouped by lot number"
      breadcrumbs={breadcrumbs}
      filters={
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
      }
    >
      {/*
        Prisma Logic:

        // Assumption: InventoryItem.lotNumber exists (not in schema). If added, use below.
        // Primary Model: InventoryItem

        const from = new Date(query.from)
        const to = new Date(query.to)

        const items = await prisma.inventoryItem.findMany({
          where: { ...(query.locationId ? { location: { location: { id: query.locationId } } as any : {}) } },
          select: { sku: true, productName: true, quantity: true, lotNumber: true as any, location: { select: { locationCode: true } } }
        })
        const rows = items.map(i => ({ lotNumber: (i as any).lotNumber || 'N/A', sku: i.sku, productName: i.productName, quantity: Number(i.quantity||0), location: (i.location as any)?.locationCode || '' }))
        return { items: rows }
      */}

      {loading && <div className="text-sm text-gray-500">Loading…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="border rounded">
          <div className="grid grid-cols-5 text-xs font-medium text-gray-700 border-b py-2 px-3">
            <div>Lot</div>
            <div>SKU</div>
            <div>Product</div>
            <div className="text-right">Qty</div>
            <div>Location</div>
          </div>
          {(data.items || []).map((r, idx) => (
            <div key={idx} className="grid grid-cols-5 text-sm border-b py-2 px-3">
              <div>{r.lotNumber}</div>
              <div>{r.sku}</div>
              <div>{r.productName}</div>
              <div className="text-right">{Number(r.quantity||0).toLocaleString()}</div>
              <div>{r.location}</div>
            </div>
          ))}
        </div>
      )}
    </ReportLayout>
  )
}
