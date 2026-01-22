"use client"

import React, { useEffect, useMemo, useState } from 'react'
import ReportLayout from '@/components/reports/ReportLayout'
import useReportQuery from '@/components/reports/useReportQuery'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

type CustomerRow = {
  id: string
  name: string
  email?: string
  loyaltyPoints: number
  salesCount: number
  totalSpent: number
}

type CustomerData = {
  range: { from: string; to: string }
  locationId?: string | null
  items: CustomerRow[]
  series: { date: string; amount: number }[]
  totals: { customers: number; sales: number; amount: number }
}

function toDateInputValue(d: Date) {
  const dt = new Date(d)
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function CustomerReportTSX({ lang = 'en' }: { lang?: string }) {
  const monthStart = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1), [])
  const today = useMemo(() => new Date(), [])
  const { params, setParams } = useReportQuery({ from: toDateInputValue(monthStart), to: toDateInputValue(today), locationId: '' })

  const [data, setData] = useState<CustomerData>({
    range: { from: toDateInputValue(monthStart), to: toDateInputValue(today) },
    locationId: '',
    items: [],
    series: [],
    totals: { customers: 0, sales: 0, amount: 0 }
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
      const res = await fetch(`/api/reports/customers${sp.toString() ? `?${sp.toString()}` : ''}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load report')
      const json = await res.json()
      setData(json as CustomerData)
    } catch (e: any) {
      console.error('Failed to load customer report:', e)
      setError(e.message || 'Failed to load report. Please try again.')
      // Reset to empty data on error
      setData({
        range: { from: params.from || toDateInputValue(monthStart), to: params.to || toDateInputValue(today) },
        locationId: params.locationId || '',
        items: [],
        series: [],
        totals: { customers: 0, sales: 0, amount: 0 }
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReport() /* eslint-disable-line react-hooks/exhaustive-deps */ }, [params.from, params.to, params.locationId])

  const breadcrumbs = [
    { label: 'Reports', href: `/${lang}/apps/reports` },
    { label: 'Customer Report' }
  ]

  const lineData = useMemo(() => ({
    labels: (data.series || []).map(s => s.date),
    datasets: [
      { label: 'Customer Spending', data: (data.series || []).map(s => s.amount), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.2)' }
    ]
  }), [data.series])

  return (
    <ReportLayout
      title="Customer Report"
      description="Sales totals, counts, and loyalty points per customer with spending trend"
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
        // Primary Models: POSCustomer, POSSale

        const from = new Date(query.from)
        const to = new Date(query.to)

        // Aggregate per customer
        const sales = await prisma.pOSSale.groupBy({
          by: ['customerId'],
          where: {
            saleDate: { gte: from, lte: to },
            customerId: { not: null },
            ...(query.locationId ? { terminal: { locationId: query.locationId } } : {})
          },
          _sum: { totalAmount: true },
          _count: { _all: true }
        })

        const customers = await prisma.pOSCustomer.findMany({ select: { id: true, firstName: true, lastName: true, email: true, loyaltyPoints: true } })

        const rows = sales.map(s => {
          const c = customers.find(x => x.id === s.customerId)
          return {
            id: s.customerId as string,
            name: `${c?.firstName || ''} ${c?.lastName || ''}`.trim() || 'Customer',
            email: c?.email || '',
            loyaltyPoints: Number(c?.loyaltyPoints || 0),
            salesCount: Number(s._count._all || 0),
            totalSpent: Number(s._sum.totalAmount || 0)
          }
        })

        // Spending series by date (all customers)
        const byDay = await prisma.pOSSale.groupBy({
          by: ['saleDate'],
          where: { saleDate: { gte: from, lte: to }, ...(query.locationId ? { terminal: { locationId: query.locationId } } : {}) },
          _sum: { totalAmount: true }
        })
        const series = byDay.map(d => ({ date: d.saleDate.toISOString().slice(0,10), amount: Number(d._sum.totalAmount || 0) }))

        const totals = rows.reduce((s, r) => ({ customers: s.customers + 1, sales: s.sales + r.salesCount, amount: s.amount + r.totalSpent }), { customers: 0, sales: 0, amount: 0 })

        return { range: { from: query.from, to: query.to }, locationId: query.locationId || null, items: rows, series, totals }
      */}

      {loading && <div className="text-sm text-gray-500">Loading…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="border rounded p-3">
              <div className="text-sm">Customers</div>
              <div className="text-lg font-semibold">{Number(data.totals.customers || 0).toLocaleString()}</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-sm">Sales</div>
              <div className="text-lg font-semibold">{Number(data.totals.sales || 0).toLocaleString()}</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-sm">Amount</div>
              <div className="text-lg font-semibold">{Number(data.totals.amount || 0).toLocaleString()}</div>
            </div>
          </div>

          <div className="border rounded p-3">
            <div className="text-sm font-semibold mb-2">Customer Spending Over Time</div>
            <Line data={lineData} />
          </div>

          <div className="border rounded">
            <div className="grid grid-cols-5 text-xs font-medium text-gray-700 border-b py-2 px-3">
              <div className="col-span-2">Customer</div>
              <div className="text-right">Loyalty Points</div>
              <div className="text-right">Sales</div>
              <div className="text-right">Total Spent</div>
            </div>
            {(data.items || []).map(r => (
              <div key={r.id} className="grid grid-cols-5 text-sm border-b py-2 px-3">
                <div className="col-span-2">{r.name}<div className="text-xs text-gray-500">{r.email}</div></div>
                <div className="text-right">{Number(r.loyaltyPoints || 0).toLocaleString()}</div>
                <div className="text-right">{Number(r.salesCount || 0).toLocaleString()}</div>
                <div className="text-right">{Number(r.totalSpent || 0).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </ReportLayout>
  )
}
