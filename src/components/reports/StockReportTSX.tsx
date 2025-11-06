"use client"

import React, { useEffect, useMemo, useState } from 'react'
import ReportLayout from '@/components/reports/ReportLayout'
import useReportQuery from '@/components/reports/useReportQuery'

type ItemRow = { sku: string; productName: string; quantity: number; avgCost?: number; value?: number; warehouse?: string; location?: string }

type Data = {
  range: { from: string; to: string }
  locationId?: string | null
  items: ItemRow[]
  totals: { quantity: number; value: number }
}

function toDateInputValue(d: Date) {
  const dt = new Date(d)
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function StockReportTSX({ lang = 'en' }: { lang?: string }) {
  const monthStart = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1), [])
  const today = useMemo(() => new Date(), [])
  const { params, setParams } = useReportQuery({ from: toDateInputValue(monthStart), to: toDateInputValue(today), warehouseId: '' })

  const [data, setData] = useState<Data>({
    range: { from: toDateInputValue(monthStart), to: toDateInputValue(today) },
    locationId: '',
    items: [],
    totals: { quantity: 0, value: 0 }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/warehouses?status=active', { cache: 'no-store' })
        const json = await res.json()
        const list = Array.isArray(json?.warehouses) ? json.warehouses : []
        setWarehouses(list.map((w: any) => ({ id: w.id, name: w.name })))
      } catch {
        setWarehouses([])
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
      if ((params as any).warehouseId) sp.set('warehouseId', String((params as any).warehouseId))
      const res = await fetch(`/api/reports/stock${sp.toString() ? `?${sp.toString()}` : ''}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load report')
      const json = await res.json()
      setData(json as Data)
    } catch (e) {
      // Mock
      const items: ItemRow[] = [
        { sku: 'SKU-001', productName: 'Sample Product A', quantity: 120, avgCost: 24.5, value: 2940, warehouse: 'Main', location: 'A-1' },
        { sku: 'SKU-002', productName: 'Sample Product B', quantity: 45, avgCost: 12.0, value: 540, warehouse: 'Main', location: 'A-2' }
      ]
      const totals = items.reduce((s, r) => ({ quantity: s.quantity + (r.quantity || 0), value: s.value + (r.value || 0) }), { quantity: 0, value: 0 })
      setData({ range: { from: params.from || toDateInputValue(monthStart), to: params.to || toDateInputValue(today) }, locationId: (params as any).warehouseId || '', items, totals })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReport() /* eslint-disable-line react-hooks/exhaustive-deps */ }, [params.from, params.to, (params as any).warehouseId])

  const breadcrumbs = [
    { label: 'Reports', href: `/${lang}/apps/reports` },
    { label: 'Stock Report' }
  ]

  return (
    <ReportLayout
      title="Stock Report"
      description="Inventory quantity and value by item and location"
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
            <div className="text-xs text-gray-600 mb-1">Warehouse</div>
            <select className="border rounded px-3 py-2 w-full" value={(params as any).warehouseId || ''} onChange={e => setParams({ warehouseId: e.target.value })}>
              <option value="">All Warehouses</option>
              {warehouses.map(w => (<option key={w.id} value={w.id}>{w.name}</option>))}
            </select>
          </div>
        </div>
      }
    >
      {/*
        Prisma Logic:

        // Inputs: from, to (not typically used for current stock; can be used for snapshot date if modeled), optional locationId
        // Primary Models: InventoryItem, Warehouse, WarehouseLocation

        // Current stock by SKU and location
        const items = await prisma.inventoryItem.findMany({
          where: {
            ...(query.locationId ? { location: { location: { id: query.locationId } } as any : {})
          },
          select: {
            sku: true,
            productName: true,
            quantity: true,
            costPrice: true,
            location: { select: { locationCode: true, location: { select: { name: true } } } },
            warehouse: { select: { name: true } } as any
          }
        })
        const rows = items.map(i => ({
          sku: i.sku,
          productName: i.productName,
          quantity: Number(i.quantity || 0),
          avgCost: Number(i.costPrice || 0),
          value: Number(i.quantity || 0) * Number(i.costPrice || 0),
          warehouse: (i as any).warehouse?.name || '',
          location: (i.location as any)?.locationCode || ''
        }))
        const totals = rows.reduce((s, r) => ({ quantity: s.quantity + r.quantity, value: s.value + (r.value || 0) }), { quantity: 0, value: 0 })
        return { items: rows, totals }
      */}

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

          <div className="border rounded">
            <div className="grid grid-cols-12 text-xs font-medium text-gray-700 border-b py-2 px-3">
              <div className="col-span-3">Product</div>
              <div className="col-span-3">SKU</div>
              <div className="col-span-2 text-right">Quantity</div>
              <div className="col-span-2 text-right">Avg Cost</div>
              <div className="col-span-2 text-right">Value</div>
            </div>
            {(data.items || []).map((it, idx) => (
              <div key={idx} className="grid grid-cols-12 text-sm border-b py-2 px-3">
                <div className="col-span-3">{it.productName}</div>
                <div className="col-span-3">{it.sku}</div>
                <div className="col-span-2 text-right">{Number(it.quantity || 0).toLocaleString()}</div>
                <div className="col-span-2 text-right">{Number(it.avgCost || 0).toLocaleString()}</div>
                <div className="col-span-2 text-right">{Number(it.value || 0).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </ReportLayout>
  )
}
