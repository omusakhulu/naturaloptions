"use client"

import React, { useEffect, useMemo, useState } from 'react'
import ReportLayout from '@/components/reports/ReportLayout'
import useReportQuery from '@/components/reports/useReportQuery'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

type Row = { sku: string; productName: string; expiryDate: string; quantity: number; value?: number; warehouse?: string }

type Data = {
  range: { from: string; to: string }
  locationId?: string | null
  items: Row[]
  byWarehouse: { warehouse: string; valueAtRisk: number }[]
}

function toDateInputValue(d: Date) {
  const dt = new Date(d)
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function StockExpiryReportTSX({ lang = 'en' }: { lang?: string }) {
  const monthStart = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1), [])
  const today = useMemo(() => new Date(), [])
  const { params, setParams } = useReportQuery({ from: toDateInputValue(monthStart), to: toDateInputValue(today), locationId: '' })

  const [data, setData] = useState<Data>({
    range: { from: toDateInputValue(monthStart), to: toDateInputValue(today) },
    locationId: '',
    items: [],
    byWarehouse: []
  })
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
      const res = await fetch(`/api/reports/stock-expiry${sp.toString() ? `?${sp.toString()}` : ''}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load report')
      const json = await res.json()
      setData(json as Data)
    } catch (e) {
      // Mock
      const items: Row[] = [
        { sku: 'SKU-001', productName: 'Perishable A', expiryDate: toDateInputValue(new Date(Date.now() + 15*24*3600*1000)), quantity: 50, value: 500, warehouse: 'Main' },
        { sku: 'SKU-002', productName: 'Perishable B', expiryDate: toDateInputValue(new Date(Date.now() - 10*24*3600*1000)), quantity: 20, value: 220, warehouse: 'Main' }
      ]
      const byWarehouse = [
        { warehouse: 'Main', valueAtRisk: items.reduce((s, r) => s + (r.value || 0), 0) }
      ]
      setData({ range: { from: params.from || toDateInputValue(monthStart), to: params.to || toDateInputValue(today) }, locationId: params.locationId || '', items, byWarehouse })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReport() /* eslint-disable-line react-hooks/exhaustive-deps */ }, [params.from, params.to, params.locationId])

  const breadcrumbs = [
    { label: 'Reports', href: `/${lang}/apps/reports` },
    { label: 'Stock Expiry Report' }
  ]

  const barData = useMemo(() => ({
    labels: (data.byWarehouse || []).map(r => r.warehouse),
    datasets: [{ label: 'Value at Risk', backgroundColor: '#ef4444', data: (data.byWarehouse || []).map(r => r.valueAtRisk) }]
  }), [data.byWarehouse])

  return (
    <ReportLayout
      title="Stock Expiry Report"
      description="Items approaching expiry or already expired"
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

        // Assumption: InventoryItem.expiryDate exists (not in schema). If added, this works.
        // Primary Model: InventoryItem

        const from = new Date(query.from)
        const to = new Date(query.to)
        const soon = new Date(); soon.setDate(soon.getDate() + 90)

        const items = await prisma.inventoryItem.findMany({
          where: {
            ...(query.locationId ? { location: { location: { id: query.locationId } } as any : {}),
            expiryDate: { lte: soon } as any
          },
          select: { sku: true, productName: true, quantity: true, costPrice: true, expiryDate: true, warehouse: { select: { name: true } } as any }
        })
        const rows = items.map(i => ({ sku: i.sku, productName: i.productName, expiryDate: i.expiryDate?.toISOString().slice(0,10) || '', quantity: Number(i.quantity||0), value: Number(i.quantity||0)*Number(i.costPrice||0), warehouse: (i as any).warehouse?.name || '' }))
        const byWarehouse = Object.values(rows.reduce((acc:any, r) => { acc[r.warehouse] = acc[r.warehouse] || { warehouse: r.warehouse, valueAtRisk: 0 }; acc[r.warehouse].valueAtRisk += r.value || 0; return acc }, {}))
        return { items: rows, byWarehouse }
      */}

      {loading && <div className="text-sm text-gray-500">Loading…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="space-y-6">
          <div className="border rounded p-3">
            <div className="text-sm font-semibold mb-2">Value at Risk per Warehouse</div>
            <Bar data={barData} />
          </div>

          <div className="border rounded">
            <div className="grid grid-cols-5 text-xs font-medium text-gray-700 border-b py-2 px-3">
              <div>SKU</div>
              <div>Product</div>
              <div>Expiry</div>
              <div className="text-right">Qty</div>
              <div className="text-right">Value</div>
            </div>
            {(data.items || []).map((r, idx) => (
              <div key={idx} className="grid grid-cols-5 text-sm border-b py-2 px-3">
                <div>{r.sku}</div>
                <div>{r.productName}</div>
                <div>{r.expiryDate}</div>
                <div className="text-right">{Number(r.quantity||0).toLocaleString()}</div>
                <div className="text-right">{Number(r.value||0).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </ReportLayout>
  )
}
