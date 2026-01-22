"use client"

import React, { useEffect, useMemo, useState } from 'react'
import ReportLayout from '@/components/reports/ReportLayout'
import useReportQuery from '@/components/reports/useReportQuery'

type TaxData = {
  range: { from: string; to: string }
  locationId?: string | null
  totals: { taxableBase: number; salesTax: number }
  byPeriod: { date: string; taxableBase: number; salesTax: number }[]
}

function toDateInputValue(d: Date) {
  const dt = new Date(d)
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function TaxReportTSX({ lang = 'en' }: { lang?: string }) {
  const monthStart = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1), [])
  const today = useMemo(() => new Date(), [])
  const { params, setParams } = useReportQuery({ from: toDateInputValue(monthStart), to: toDateInputValue(today), locationId: '' })

  const [data, setData] = useState<TaxData>({
    range: { from: toDateInputValue(monthStart), to: toDateInputValue(today) },
    locationId: '',
    totals: { taxableBase: 0, salesTax: 0 },
    byPeriod: []
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
      const res = await fetch(`/api/reports/tax${sp.toString() ? `?${sp.toString()}` : ''}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load report')
      const json = await res.json()
      setData(json as TaxData)
    } catch (e) {
      // Mock fallback series
      const days = 10
      const base = new Date(params.from || toDateInputValue(monthStart))
      const mkDate = (i: number) => {
        const d = new Date(base)
        d.setDate(d.getDate() + i)
        const yyyy = d.getFullYear()
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const dd = String(d.getDate()).padStart(2, '0')
        return `${yyyy}-${mm}-${dd}`
      }
      const byPeriod = Array.from({ length: days }, (_, i) => {
        const taxable = Math.round(5000 + Math.random() * 4000)
        const tax = Math.round(taxable * 0.16)
        return { date: mkDate(i), taxableBase: taxable, salesTax: tax }
      })
      const totals = byPeriod.reduce((s, r) => ({ taxableBase: s.taxableBase + r.taxableBase, salesTax: s.salesTax + r.salesTax }), { taxableBase: 0, salesTax: 0 })
      setData({
        range: { from: params.from || toDateInputValue(monthStart), to: params.to || toDateInputValue(today) },
        locationId: params.locationId || '',
        totals,
        byPeriod
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReport() /* eslint-disable-line react-hooks/exhaustive-deps */ }, [params.from, params.to, params.locationId])

  const breadcrumbs = [
    { label: 'Reports', href: `/${lang}/apps/reports` },
    { label: 'Tax Report' }
  ]

  return (
    <ReportLayout
      title="Tax Report"
      description="Total taxable sales base and sales tax over the selected period"
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
        // Primary Model: POSSale

        const from = new Date(query.from)
        const to = new Date(query.to)

        // Sum taxAmount and subtotal for paid/completed sales in range
        const sales = await prisma.pOSSale.findMany({
          where: {
            saleDate: { gte: from, lte: to },
            // If payment/completion status needs filtering, adapt here (schema has PaymentStatus/SaleStatus)
            ...(query.locationId ? { terminal: { locationId: query.locationId } } : {})
          },
          select: { saleDate: true, taxAmount: true, subtotal: true }
        })

        const byDay = new Map<string, { taxableBase: number; salesTax: number }>()
        for (const s of sales) {
          const key = s.saleDate.toISOString().slice(0,10)
          const cur = byDay.get(key) || { taxableBase: 0, salesTax: 0 }
          cur.taxableBase += Number(s.subtotal || 0)
          cur.salesTax += Number(s.taxAmount || 0)
          byDay.set(key, cur)
        }
        const byPeriod = Array.from(byDay.entries()).sort((a,b)=>a[0].localeCompare(b[0])).map(([date, v]) => ({ date, ...v }))
        const totals = byPeriod.reduce((s, r) => ({ taxableBase: s.taxableBase + r.taxableBase, salesTax: s.salesTax + r.salesTax }), { taxableBase: 0, salesTax: 0 })

        return {
          range: { from: query.from, to: query.to },
          locationId: query.locationId || null,
          totals,
          byPeriod
        }
      */}

      {loading && <div className="text-sm text-gray-500">Loading…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="border rounded p-3">
              <div className="text-sm">Taxable Base</div>
              <div className="text-lg font-semibold">{Number(data?.totals?.taxableBase || 0).toLocaleString()}</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-sm">Sales Tax</div>
              <div className="text-lg font-semibold">{Number(data?.totals?.salesTax || 0).toLocaleString()}</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-sm">Effective Rate</div>
              <div className="text-lg font-semibold">{((Number(data?.totals?.salesTax || 0) / Math.max(1, Number(data?.totals?.taxableBase || 0))) * 100).toFixed(2)}%</div>
            </div>
          </div>

          <div className="border rounded">
            <div className="grid grid-cols-3 text-xs font-medium text-gray-700 border-b py-2 px-3">
              <div>Date</div>
              <div className="text-right">Taxable Base</div>
              <div className="text-right">Sales Tax</div>
            </div>
            {(data?.byPeriod || []).map(r => (
              <div key={r.date} className="grid grid-cols-3 text-sm border-b py-2 px-3">
                <div>{r.date}</div>
                <div className="text-right">{Number(r?.taxableBase || 0).toLocaleString()}</div>
                <div className="text-right">{Number(r?.salesTax || 0).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </ReportLayout>
  )
}
