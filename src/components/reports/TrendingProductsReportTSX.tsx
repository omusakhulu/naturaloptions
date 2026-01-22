"use client"

import React, { useEffect, useMemo, useState } from 'react'
import ReportLayout from '@/components/reports/ReportLayout'
import useReportQuery from '@/components/reports/useReportQuery'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

type Row = { productId: string; productName: string; quantity: number }

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

export default function TrendingProductsReportTSX({ lang = 'en' }: { lang?: string }) {
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
      const res = await fetch(`/api/reports/trending-products${sp.toString() ? `?${sp.toString()}` : ''}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load report')
      const json = await res.json()
      setData(json as Data)
    } catch (e) {
      // Mock top 10
      const items: Row[] = Array.from({ length: 10 }, (_, i) => ({ productId: `p${i+1}`, productName: `Product ${i+1}`, quantity: Math.round(20 + Math.random()*80) }))
      setData({ range: { from: params.from || toDateInputValue(monthStart), to: params.to || toDateInputValue(today) }, locationId: params.locationId || '', items })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReport() /* eslint-disable-line react-hooks/exhaustive-deps */ }, [params.from, params.to, params.locationId])

  const breadcrumbs = [ { label: 'Reports', href: `/${lang}/apps/reports` }, { label: 'Trending Products' } ]

  const labels = (data.items || []).map(r => r.productName)
  const barData = useMemo(() => ({ labels, datasets: [{ label: 'Qty Sold', backgroundColor: '#3b82f6', data: (data.items || []).map(r => r.quantity) }] }), [labels, data.items])

  return (
    <ReportLayout title="Trending Products" description="Top 10 products by quantity sold" breadcrumbs={breadcrumbs} filters={
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

        const from = new Date(query.from)
        const to = new Date(query.to)

        const rows = await prisma.pOSSaleItem.groupBy({
          by: ['productId'],
          where: {
            sale: { saleDate: { gte: from, lte: to }, ...(query.locationId ? { terminal: { locationId: query.locationId } } : {}) }
          },
          _sum: { quantity: true },
          orderBy: { _sum: { quantity: 'desc' } },
          take: 10
        })
        const products = await prisma.product.findMany({ select: { id: true, name: true } })
        return rows.map(r => ({ productId: r.productId as string, productName: products.find(p => p.id === r.productId)?.name || 'Product', quantity: Number(r._sum.quantity || 0) }))
      */}

      {loading && <div className="text-sm text-gray-500">Loading…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="space-y-6">
          <div className="border rounded p-3">
            <Bar data={barData} />
          </div>
          <div className="border rounded">
            <div className="grid grid-cols-3 text-xs font-medium text-gray-700 border-b py-2 px-3">
              <div>Product</div>
              <div className="text-right">Quantity</div>
              <div className="text-right">Rank</div>
            </div>
            {(data.items || []).map((r, idx) => (
              <div key={r.productId || `item-${idx}`} className="grid grid-cols-3 text-sm border-b py-2 px-3">
                <div>{r.productName}</div>
                <div className="text-right">{Number(r.quantity||0).toLocaleString()}</div>
                <div className="text-right">#{idx+1}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </ReportLayout>
  )
}
