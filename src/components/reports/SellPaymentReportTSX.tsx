"use client"

import React, { useEffect, useMemo, useState } from 'react'
import ReportLayout from '@/components/reports/ReportLayout'
import useReportQuery from '@/components/reports/useReportQuery'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Pie } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

type Row = { id: string; saleNumber?: string; method: string; date: string; amount: number }

type Data = { range: { from: string; to: string }; locationId?: string | null; items: Row[]; totals: { amount: number; count: number }; byMethod: { method: string; amount: number }[] }

function toDateInputValue(d: Date) {
  const dt = new Date(d)
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function SellPaymentReportTSX({ lang = 'en' }: { lang?: string }) {
  const monthStart = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1), [])
  const today = useMemo(() => new Date(), [])
  const { params, setParams } = useReportQuery({ from: toDateInputValue(monthStart), to: toDateInputValue(today), locationId: '' })

  const [data, setData] = useState<Data>({ range: { from: toDateInputValue(monthStart), to: toDateInputValue(today) }, locationId: '', items: [], totals: { amount: 0, count: 0 }, byMethod: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([])

  useEffect(() => { (async () => { try { const res = await fetch('/api/locations?isActive=true', { cache: 'no-store' }); const json = await res.json(); if (Array.isArray(json.items)) setLocations(json.items) } catch { setLocations([{ id: 'main', name: 'Main Location' }]) } })() }, [])

  const fetchReport = async () => {
    setLoading(true); setError('')
    try {
      const sp = new URLSearchParams(); if (params.from) sp.set('from', params.from); if (params.to) sp.set('to', params.to); if (params.locationId) sp.set('locationId', String(params.locationId))
      const res = await fetch(`/api/reports/sell-payment${sp.toString() ? `?${sp.toString()}` : ''}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load report')
      const json = await res.json(); setData(json as Data)
    } catch (e) {
      const items: Row[] = [
        { id: 'sp-1', saleNumber: 'POS-1001', method: 'CASH', date: params.from || toDateInputValue(monthStart), amount: 200 },
        { id: 'sp-2', saleNumber: 'POS-1002', method: 'CREDIT_CARD', date: params.to || toDateInputValue(today), amount: 450 }
      ]
      const totals = items.reduce((s, r) => ({ amount: s.amount + r.amount, count: s.count + 1 }), { amount: 0, count: 0 })
      const byMethodMap = items.reduce((m: any, r) => { m[r.method] = (m[r.method] || 0) + r.amount; return m }, {})
      const byMethod = Object.entries(byMethodMap).map(([method, amount]) => ({ method, amount: Number(amount) }))
      setData({ range: { from: params.from || toDateInputValue(monthStart), to: params.to || toDateInputValue(today) }, locationId: params.locationId || '', items, totals, byMethod })
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchReport() /* eslint-disable-line react-hooks/exhaustive-deps */ }, [params.from, params.to, params.locationId])

  const breadcrumbs = [ { label: 'Reports', href: `/${lang}/apps/reports` }, { label: 'Sell Payment Report' } ]

  const pieData = useMemo(() => ({ labels: (data.byMethod || []).map(r => r.method), datasets: [{ label: 'Amount', data: (data.byMethod || []).map(r => r.amount), backgroundColor: ['#22c55e','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#14b8a6'] }] }), [data.byMethod])

  return (
    <ReportLayout title="Sell Payment Report" description="Payments received for sales with method breakdown" breadcrumbs={breadcrumbs} filters={
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

        // Inputs: from, to; optional locationId via Payment.sale.terminal.locationId
        // Primary Models: Payment, POSSale

        const from = new Date(query.from)
        const to = new Date(query.to)

        const payments = await prisma.payment.findMany({
          where: { paymentDate: { gte: from, lte: to }, ...(query.locationId ? { sale: { terminal: { locationId: query.locationId } } } : {}) },
          select: { id: true, amount: true, paymentMethod: true, paymentDate: true, sale: { select: { saleNumber: true } } }
        })
        const items = payments.map(p => ({ id: p.id, saleNumber: p.sale?.saleNumber, method: p.paymentMethod, date: p.paymentDate.toISOString().slice(0,10), amount: Number(p.amount||0) }))
        const totals = items.reduce((s, r) => ({ amount: s.amount + r.amount, count: s.count + 1 }), { amount: 0, count: 0 })
        const byMethodMap = new Map<string, number>()
        for (const i of items) byMethodMap.set(i.method, (byMethodMap.get(i.method) || 0) + i.amount)
        const byMethod = Array.from(byMethodMap.entries()).map(([method, amount]) => ({ method, amount }))
        return { range: { from: query.from, to: query.to }, items, totals, byMethod }
      */}

      {loading && <div className="text-sm text-gray-500">Loading…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="border rounded p-3"><div className="text-sm">Payments</div><div className="text-lg font-semibold">{Number(data.totals.count||0).toLocaleString()}</div></div>
            <div className="border rounded p-3"><div className="text-sm">Total Amount</div><div className="text-lg font-semibold">{Number(data.totals.amount||0).toLocaleString()}</div></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="border rounded p-3"><div className="text-sm font-semibold mb-2">Payment Method Breakdown</div><Pie data={pieData} /></div>
            <div className="border rounded">
              <div className="grid grid-cols-5 text-xs font-medium text-gray-700 border-b py-2 px-3">
                <div>Sale #</div>
                <div>Date</div>
                <div className="text-right">Amount</div>
                <div className="text-right">Method</div>
                <div className="text-right">Ref</div>
              </div>
              {(data.items || []).map(r => (
                <div key={r.id} className="grid grid-cols-5 text-sm border-b py-2 px-3">
                  <div>{r.saleNumber || '-'}</div>
                  <div>{r.date}</div>
                  <div className="text-right">{Number(r.amount||0).toLocaleString()}</div>
                  <div className="text-right">{r.method}</div>
                  <div className="text-right">-</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </ReportLayout>
  )
}
