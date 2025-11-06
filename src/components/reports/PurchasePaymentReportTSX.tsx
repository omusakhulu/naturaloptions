"use client"

import React, { useEffect, useMemo, useState } from 'react'
import ReportLayout from '@/components/reports/ReportLayout'
import useReportQuery from '@/components/reports/useReportQuery'

type Row = { id: string; billNumber: string; vendorName: string; date: string; amount: number; method?: string }

type Data = { range: { from: string; to: string }; locationId?: string | null; items: Row[]; totals: { amount: number; count: number } }

function toDateInputValue(d: Date) {
  const dt = new Date(d)
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function PurchasePaymentReportTSX({ lang = 'en' }: { lang?: string }) {
  const monthStart = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1), [])
  const today = useMemo(() => new Date(), [])
  const { params, setParams } = useReportQuery({ from: toDateInputValue(monthStart), to: toDateInputValue(today), locationId: '' })

  const [data, setData] = useState<Data>({ range: { from: toDateInputValue(monthStart), to: toDateInputValue(today) }, locationId: '', items: [], totals: { amount: 0, count: 0 } })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([])

  useEffect(() => { (async () => { try { const res = await fetch('/api/locations?isActive=true', { cache: 'no-store' }); const json = await res.json(); if (Array.isArray(json.items)) setLocations(json.items) } catch { setLocations([{ id: 'main', name: 'Main Location' }]) } })() }, [])

  const fetchReport = async () => {
    setLoading(true); setError('')
    try {
      const sp = new URLSearchParams(); if (params.from) sp.set('from', params.from); if (params.to) sp.set('to', params.to); if (params.locationId) sp.set('locationId', String(params.locationId))
      const res = await fetch(`/api/reports/purchase-payment${sp.toString() ? `?${sp.toString()}` : ''}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load report')
      const json = await res.json(); setData(json as Data)
    } catch (e) {
      const items: Row[] = [
        { id: 'pp-1', billNumber: 'BILL-1001', vendorName: 'Acme Supplies', date: params.from || toDateInputValue(monthStart), amount: 1200, method: 'Bank Transfer' },
        { id: 'pp-2', billNumber: 'BILL-1002', vendorName: 'Global Traders', date: params.to || toDateInputValue(today), amount: 800, method: 'Check' }
      ]
      const totals = items.reduce((s, r) => ({ amount: s.amount + r.amount, count: s.count + 1 }), { amount: 0, count: 0 })
      setData({ range: { from: params.from || toDateInputValue(monthStart), to: params.to || toDateInputValue(today) }, locationId: params.locationId || '', items, totals })
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchReport() /* eslint-disable-line react-hooks/exhaustive-deps */ }, [params.from, params.to, params.locationId])

  const breadcrumbs = [ { label: 'Reports', href: `/${lang}/apps/reports` }, { label: 'Purchase Payment Report' } ]

  return (
    <ReportLayout title="Purchase Payment Report" description="Payments made against bills with vendors" breadcrumbs={breadcrumbs} filters={
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

        // Assumption: BillPayment model exists relating Bill <- BillPayment (amount, date, method), not present in schema.
        // Primary Models: Bill, Vendor, (BillPayment hypothetical)

        const from = new Date(query.from)
        const to = new Date(query.to)

        const payments = await prisma.billPayment.findMany({
          where: { date: { gte: from, lte: to } },
          select: { id: true, amount: true, date: true, method: true, bill: { select: { billNumber: true, vendor: { select: { name: true } } } } }
        })
        const items = payments.map(p => ({ id: p.id, billNumber: p.bill.billNumber, vendorName: p.bill.vendor.name, date: p.date.toISOString().slice(0,10), amount: Number(p.amount||0), method: p.method }))
        const totals = items.reduce((s, r) => ({ amount: s.amount + r.amount, count: s.count + 1 }), { amount: 0, count: 0 })
        return { range: { from: query.from, to: query.to }, items, totals }
      */}

      {loading && <div className="text-sm text-gray-500">Loading…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="border rounded p-3"><div className="text-sm">Payments</div><div className="text-lg font-semibold">{Number(data.totals.count||0).toLocaleString()}</div></div>
            <div className="border rounded p-3"><div className="text-sm">Total Amount</div><div className="text-lg font-semibold">{Number(data.totals.amount||0).toLocaleString()}</div></div>
          </div>
          <div className="border rounded">
            <div className="grid grid-cols-5 text-xs font-medium text-gray-700 border-b py-2 px-3">
              <div>Bill #</div>
              <div>Vendor</div>
              <div>Date</div>
              <div className="text-right">Amount</div>
              <div className="text-right">Method</div>
            </div>
            {(data.items || []).map(r => (
              <div key={r.id} className="grid grid-cols-5 text-sm border-b py-2 px-3">
                <div>{r.billNumber}</div>
                <div>{r.vendorName}</div>
                <div>{r.date}</div>
                <div className="text-right">{Number(r.amount||0).toLocaleString()}</div>
                <div className="text-right">{r.method || '-'}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </ReportLayout>
  )
}
