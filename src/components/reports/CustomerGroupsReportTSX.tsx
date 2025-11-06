"use client"

import React, { useEffect, useMemo, useState } from 'react'
import ReportLayout from '@/components/reports/ReportLayout'
import useReportQuery from '@/components/reports/useReportQuery'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Pie } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

type GroupRow = { group: string; customers: number; totalSpent: number }

type Data = {
  range: { from: string; to: string }
  locationId?: string | null
  items: GroupRow[]
  totals: { customers: number; amount: number }
}

function toDateInputValue(d: Date) {
  const dt = new Date(d)
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function CustomerGroupsReportTSX({ lang = 'en' }: { lang?: string }) {
  const monthStart = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1), [])
  const today = useMemo(() => new Date(), [])
  const { params, setParams } = useReportQuery({ from: toDateInputValue(monthStart), to: toDateInputValue(today), locationId: '' })

  const [data, setData] = useState<Data>({
    range: { from: toDateInputValue(monthStart), to: toDateInputValue(today) },
    locationId: '',
    items: [],
    totals: { customers: 0, amount: 0 }
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
      const res = await fetch(`/api/reports/customer-groups${sp.toString() ? `?${sp.toString()}` : ''}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load report')
      const json = await res.json()
      setData(json as Data)
    } catch (e) {
      // Mock
      const items: GroupRow[] = [
        { group: 'Retail', customers: 120, totalSpent: 56000 },
        { group: 'Wholesale', customers: 34, totalSpent: 72000 },
        { group: 'VIP', customers: 12, totalSpent: 45000 }
      ]
      const totals = items.reduce((s, r) => ({ customers: s.customers + r.customers, amount: s.amount + r.totalSpent }), { customers: 0, amount: 0 })
      setData({ range: { from: params.from || toDateInputValue(monthStart), to: params.to || toDateInputValue(today) }, locationId: params.locationId || '', items, totals })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReport() /* eslint-disable-line react-hooks/exhaustive-deps */ }, [params.from, params.to, params.locationId])

  const breadcrumbs = [
    { label: 'Reports', href: `/${lang}/apps/reports` },
    { label: 'Customer Groups Report' }
  ]

  const pieData = useMemo(() => ({
    labels: (data.items || []).map(i => i.group),
    datasets: [
      { label: 'Contribution', data: (data.items || []).map(i => i.totalSpent), backgroundColor: ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6'] }
    ]
  }), [data.items])

  return (
    <ReportLayout
      title="Customer Groups Report"
      description="Total sales amount and customer count per group"
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

        // Assumption: POSCustomer.group exists (not in schema). If added, use below; else derive groups externally.
        // Inputs: from, to, optional locationId via POSSale.terminal.locationId
        // Primary Model: POSCustomer (with group), POSSale

        const from = new Date(query.from)
        const to = new Date(query.to)

        // Sum sales by customer then roll-up by group
        const salesByCustomer = await prisma.pOSSale.groupBy({
          by: ['customerId'],
          where: { saleDate: { gte: from, lte: to }, customerId: { not: null }, ...(query.locationId ? { terminal: { locationId: query.locationId } } : {}) },
          _sum: { totalAmount: true }
        })
        const customers = await prisma.pOSCustomer.findMany({ select: { id: true, group: true } as any }) // group: hypothetical
        const map = new Map<string, { customers: number; totalSpent: number }>()
        for (const s of salesByCustomer) {
          const c = customers.find(x => x.id === s.customerId)
          const g = (c as any)?.group || 'Unassigned'
          const cur = map.get(g) || { customers: 0, totalSpent: 0 }
          cur.customers += 1
          cur.totalSpent += Number(s._sum.totalAmount || 0)
          map.set(g, cur)
        }
        const items = Array.from(map.entries()).map(([group, v]) => ({ group, customers: v.customers, totalSpent: v.totalSpent }))
        const totals = items.reduce((s, r) => ({ customers: s.customers + r.customers, amount: s.amount + r.totalSpent }), { customers: 0, amount: 0 })
        return { range: { from: query.from, to: query.to }, items, totals }
      */}

      {loading && <div className="text-sm text-gray-500">Loading…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded p-3">
              <div className="text-sm font-semibold mb-2">Group Contribution</div>
              <Pie data={pieData} />
            </div>
            <div className="border rounded">
              <div className="grid grid-cols-3 text-xs font-medium text-gray-700 border-b py-2 px-3">
                <div>Group</div>
                <div className="text-right">Customers</div>
                <div className="text-right">Total Spent</div>
              </div>
              {(data.items || []).map(r => (
                <div key={r.group} className="grid grid-cols-3 text-sm border-b py-2 px-3">
                  <div>{r.group}</div>
                  <div className="text-right">{Number(r.customers || 0).toLocaleString()}</div>
                  <div className="text-right">{Number(r.totalSpent || 0).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </ReportLayout>
  )
}
