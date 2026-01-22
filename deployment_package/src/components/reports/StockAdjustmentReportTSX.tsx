"use client"

import React, { useEffect, useMemo, useState } from 'react'
import ReportLayout from '@/components/reports/ReportLayout'
import useReportQuery from '@/components/reports/useReportQuery'

type Row = { id: string; date: string; reason?: string; itemsJson?: string }

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

export default function StockAdjustmentReportTSX({ lang = 'en' }: { lang?: string }) {
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
      const res = await fetch(`/api/reports/stock-adjustment${sp.toString() ? `?${sp.toString()}` : ''}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load report')
      const json = await res.json()
      setData(json as Data)
    } catch (e) {
      // Mock
      const items: Row[] = [
        { id: 'adj-1', date: toDateInputValue(new Date()), reason: 'Inventory shrinkage', itemsJson: JSON.stringify([{ sku: 'SKU-001', delta: -2 }]) },
        { id: 'adj-2', date: toDateInputValue(new Date()), reason: 'Cycle count correction', itemsJson: JSON.stringify([{ sku: 'SKU-002', delta: 3 }]) }
      ]
      setData({ range: { from: params.from || toDateInputValue(monthStart), to: params.to || toDateInputValue(today) }, locationId: params.locationId || '', items })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReport() /* eslint-disable-line react-hooks/exhaustive-deps */ }, [params.from, params.to, params.locationId])

  const breadcrumbs = [ { label: 'Reports', href: `/${lang}/apps/reports` }, { label: 'Stock Adjustment Report' } ]

  return (
    <ReportLayout
      title="Stock Adjustment Report"
      description="All adjustments where movement type is 'adjustment'"
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

        // Primary Models: StockAdjustmentRecord, StockMovement (filter MovementType='adjustment')
        // Inputs: from, to

        const from = new Date(query.from)
        const to = new Date(query.to)

        const adjustments = await prisma.stockAdjustmentRecord.findMany({
          where: { date: { gte: from, lte: to } },
          select: { id: true, date: true, reason: true, items: true }
        })
        const movements = await prisma.stockMovement.findMany({
          where: { type: 'adjustment', createdAt: { gte: from, lte: to } },
          select: { inventory: { select: { sku: true, productName: true } }, quantity: true, notes: true, createdAt: true }
        })
        // Combine or present separately as needed
        return { items: adjustments }
      */}

      {loading && <div className="text-sm text-gray-500">Loading…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="border rounded">
          <div className="grid grid-cols-4 text-xs font-medium text-gray-700 border-b py-2 px-3">
            <div>ID</div>
            <div>Date</div>
            <div>Reason</div>
            <div className="text-right">Items</div>
          </div>
          {(data.items || []).map(r => (
            <div key={r.id} className="grid grid-cols-4 text-sm border-b py-2 px-3">
              <div>{r.id}</div>
              <div>{r.date}</div>
              <div>{r.reason || '-'}</div>
              <div className="text-right">{r.itemsJson ? JSON.parse(r.itemsJson).length : '-'}</div>
            </div>
          ))}
        </div>
      )}
    </ReportLayout>
  )
}
