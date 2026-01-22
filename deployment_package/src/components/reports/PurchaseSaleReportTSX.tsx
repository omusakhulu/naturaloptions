"use client"

import React, { useEffect, useMemo, useState } from 'react'
import ReportLayout from '@/components/reports/ReportLayout'
import useReportQuery from '@/components/reports/useReportQuery'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

type PeriodPoint = { date: string; total: number }

type ReportData = {
  range: { from: string; to: string }
  locationId?: string | null
  sales: { total: number; byPeriod: PeriodPoint[] }
  purchases: { total: number; byPeriod: PeriodPoint[] }
  adjustments: { salesReturns: number; purchaseReturns: number }
  net: { sales: number; purchases: number }
}

function toDateInputValue(d: Date) {
  const dt = new Date(d)
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function PurchaseSaleReportTSX({ lang = 'en' }: { lang?: string }) {
  const monthStart = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1), [])
  const today = useMemo(() => new Date(), [])
  const { params, setParams } = useReportQuery({ from: toDateInputValue(monthStart), to: toDateInputValue(today), locationId: '' })

  const [data, setData] = useState<ReportData>({
    range: { from: toDateInputValue(monthStart), to: toDateInputValue(today) },
    locationId: '',
    sales: { total: 0, byPeriod: [] },
    purchases: { total: 0, byPeriod: [] },
    adjustments: { salesReturns: 0, purchaseReturns: 0 },
    net: { sales: 0, purchases: 0 }
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
      const res = await fetch(`/api/reports/purchase-sale${sp.toString() ? `?${sp.toString()}` : ''}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load report')
      const json = await res.json()
      setData(json as ReportData)
    } catch (e: any) {
      console.error('Failed to load purchase/sale report:', e)
      setError(e.message || 'Failed to load report. Please try again.')
      // Reset to empty data on error
      setData({
        range: { from: params.from || toDateInputValue(monthStart), to: params.to || toDateInputValue(today) },
        locationId: params.locationId || '',
        sales: { total: 0, byPeriod: [] },
        purchases: { total: 0, byPeriod: [] },
        adjustments: { salesReturns: 0, purchaseReturns: 0 },
        net: { sales: 0, purchases: 0 }
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReport() /* eslint-disable-line react-hooks/exhaustive-deps */ }, [params.from, params.to, params.locationId])

  const breadcrumbs = [
    { label: 'Reports', href: `/${lang}/apps/reports` },
    { label: 'Purchase & Sale' }
  ]

  const chartLabels = useMemo(() => {
    const keys = Array.from(new Set([...(data.sales.byPeriod || []).map(r => r.date), ...(data.purchases.byPeriod || []).map(r => r.date)])).sort()
    return keys
  }, [data.sales.byPeriod, data.purchases.byPeriod])

  const barData = useMemo(() => ({
    labels: chartLabels,
    datasets: [
      {
        label: 'Sales',
        backgroundColor: '#16a34a',
        data: chartLabels.map(d => (data.sales.byPeriod.find(r => r.date === d)?.total || 0))
      },
      {
        label: 'Purchases',
        backgroundColor: '#ef4444',
        data: chartLabels.map(d => (data.purchases.byPeriod.find(r => r.date === d)?.total || 0))
      }
    ]
  }), [chartLabels, data.sales.byPeriod, data.purchases.byPeriod])

  return (
    <ReportLayout
      title="Purchase & Sale"
      description="Compare gross purchases vs gross sales with daily trends"
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

        // Inputs: from, to (date range), optional locationId via POSSale.terminal.locationId
        // Primary Models: POSSale, SalesReturn, Bill, PurchaseReturn, Vendor (for joins), POSTerminal -> Location

        const from = new Date(query.from)
        const to = new Date(query.to)

        // Sales totals by date
        const sales = await prisma.pOSSale.groupBy({
          by: ['saleDate'],
          where: {
            saleDate: { gte: from, lte: to },
            ...(query.locationId ? { terminal: { locationId: query.locationId } } : {})
          },
          _sum: { totalAmount: true }
        })

        // Sales returns total (negative adjustment)
        const salesReturns = await prisma.refund.aggregate({
          where: { createdAt: { gte: from, lte: to } },
          _sum: { amount: true }
        })

        // Purchases by date
        const purchases = await prisma.bill.groupBy({
          by: ['billDate'],
          where: {
            billDate: { gte: from, lte: to }
            // No location relation on Bill in schema; if needed, extend schema or infer via Vendor -> Location link
          },
          _sum: { amount: true }
        })

        // Purchase returns total
        const purchaseReturns = await prisma.purchaseReturn.aggregate({
          where: { date: { gte: from, lte: to } },
          _sum: { amount: true }
        })

        const salesByPeriod = sales.map(s => ({ date: s.saleDate.toISOString().slice(0,10), total: Number(s._sum.totalAmount || 0) }))
        const purchasesByPeriod = purchases.map(p => ({ date: p.billDate.toISOString().slice(0,10), total: Number(p._sum.amount || 0) }))

        const salesTotal = salesByPeriod.reduce((s, r) => s + r.total, 0)
        const purchasesTotal = purchasesByPeriod.reduce((s, r) => s + r.total, 0)

        const adjustments = {
          salesReturns: Number(salesReturns._sum.amount || 0),
          purchaseReturns: Number(purchaseReturns._sum.amount || 0)
        }

        return {
          range: { from: query.from, to: query.to },
          locationId: query.locationId || null,
          sales: { total: salesTotal, byPeriod: salesByPeriod },
          purchases: { total: purchasesTotal, byPeriod: purchasesByPeriod },
          adjustments,
          net: {
            sales: salesTotal - adjustments.salesReturns,
            purchases: purchasesTotal - adjustments.purchaseReturns
          }
        }
      */}

      {loading && <div className="text-sm text-gray-500">Loading…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="border rounded p-3">
              <div className="text-sm font-medium mb-2">Sales</div>
              <div className="text-sm text-gray-600">Total: <span className="font-semibold">{Number(data.sales.total || 0).toLocaleString()}</span></div>
              <div className="text-sm text-gray-600">Returns: <span className="font-semibold">{Number(data.adjustments.salesReturns || 0).toLocaleString()}</span></div>
              <div className="text-sm">Net Sales: <span className="font-semibold">{Number(data.net.sales || 0).toLocaleString()}</span></div>
            </div>
            <div className="border rounded p-3">
              <div className="text-sm font-medium mb-2">Purchases</div>
              <div className="text-sm text-gray-600">Total: <span className="font-semibold">{Number(data.purchases.total || 0).toLocaleString()}</span></div>
              <div className="text-sm text-gray-600">Returns: <span className="font-semibold">{Number(data.adjustments.purchaseReturns || 0).toLocaleString()}</span></div>
              <div className="text-sm">Net Purchases: <span className="font-semibold">{Number(data.net.purchases || 0).toLocaleString()}</span></div>
            </div>
            <div className="border rounded p-3">
              <div className="text-sm font-medium mb-2">Balance</div>
              <div className="text-sm">Gross Margin (Sales - Purchases): <span className="font-semibold">{Number((data.net.sales || 0) - (data.net.purchases || 0)).toLocaleString()}</span></div>
            </div>
          </div>

          <div className="border rounded p-3">
            <div className="text-sm font-semibold mb-2">Monthly Trends</div>
            <Bar data={barData} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded">
              <div className="grid grid-cols-2 text-xs font-medium text-gray-700 border-b py-2 px-3">
                <div>Date</div>
                <div className="text-right">Sales Amount</div>
              </div>
              {(data.sales.byPeriod || []).map(r => (
                <div key={r.date} className="grid grid-cols-2 text-sm border-b py-2 px-3">
                  <div>{r.date}</div>
                  <div className="text-right">{Number(r.total || 0).toLocaleString()}</div>
                </div>
              ))}
            </div>
            <div className="border rounded">
              <div className="grid grid-cols-2 text-xs font-medium text-gray-700 border-b py-2 px-3">
                <div>Date</div>
                <div className="text-right">Purchases Amount</div>
              </div>
              {(data.purchases.byPeriod || []).map(r => (
                <div key={r.date} className="grid grid-cols-2 text-sm border-b py-2 px-3">
                  <div>{r.date}</div>
                  <div className="text-right">{Number(r.total || 0).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </ReportLayout>
  )
}
