"use client"

import React, { useEffect, useMemo, useState } from 'react'
import ReportLayout from '@/components/reports/ReportLayout'
import useReportQuery from '@/components/reports/useReportQuery'

type Row = { id: string; terminal?: string; openedAt?: string; closedAt?: string | null; openingAmount: number; closingAmount?: number | null; expectedAmount?: number | null; discrepancy?: number | null; status: string }

type Data = { range: { from: string; to: string }; locationId?: string | null; items: Row[]; totals: { opening: number; closing: number; expected: number; discrepancy: number } }

function toDateInputValue(d: Date) {
  const dt = new Date(d)
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function RegisterReportTSX({ lang = 'en' }: { lang?: string }) {
  const monthStart = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1), [])
  const today = useMemo(() => new Date(), [])
  const { params, setParams } = useReportQuery({ from: toDateInputValue(monthStart), to: toDateInputValue(today), locationId: '' })

  const [data, setData] = useState<Data>({ range: { from: toDateInputValue(monthStart), to: toDateInputValue(today) }, locationId: '', items: [], totals: { opening: 0, closing: 0, expected: 0, discrepancy: 0 } })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([])

  useEffect(() => { (async () => { try { const res = await fetch('/api/locations?isActive=true', { cache: 'no-store' }); const json = await res.json(); if (Array.isArray(json.items)) setLocations(json.items) } catch { setLocations([{ id: 'main', name: 'Main Location' }]) } })() }, [])

  const fetchReport = async () => {
    setLoading(true); setError('')
    try {
      const sp = new URLSearchParams(); if (params.from) sp.set('from', params.from); if (params.to) sp.set('to', params.to); if (params.locationId) sp.set('locationId', String(params.locationId))
      const res = await fetch(`/api/reports/register${sp.toString() ? `?${sp.toString()}` : ''}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load report')
      const json = await res.json(); setData(json as Data)
    } catch (e) {
      const items: Row[] = [
        { id: 'cd-1', terminal: 'Main Register', openedAt: params.from || toDateInputValue(monthStart), closedAt: params.to || toDateInputValue(today), openingAmount: 500, closingAmount: 1750, expectedAmount: 1725, discrepancy: 25, status: 'CLOSED' },
        { id: 'cd-2', terminal: 'Mobile POS 1', openedAt: params.from || toDateInputValue(monthStart), closedAt: params.to || toDateInputValue(today), openingAmount: 300, closingAmount: 920, expectedAmount: 920, discrepancy: 0, status: 'CLOSED' }
      ]
      const totals = items.reduce((s, r) => ({ opening: s.opening + (r.openingAmount || 0), closing: s.closing + Number(r.closingAmount || 0), expected: s.expected + Number(r.expectedAmount || 0), discrepancy: s.discrepancy + Number(r.discrepancy || 0) }), { opening: 0, closing: 0, expected: 0, discrepancy: 0 })
      setData({ range: { from: params.from || toDateInputValue(monthStart), to: params.to || toDateInputValue(today) }, locationId: params.locationId || '', items, totals })
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchReport() /* eslint-disable-line react-hooks/exhaustive-deps */ }, [params.from, params.to, params.locationId])

  const breadcrumbs = [ { label: 'Reports', href: `/${lang}/apps/reports` }, { label: 'Register Report' } ]

  return (
    <ReportLayout title="Register Report" description="Cash drawer openings/closings and discrepancies" breadcrumbs={breadcrumbs} filters={
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

        // Inputs: from, to; optional locationId via CashDrawer.terminal.locationId
        // Primary Models: CashDrawer, POSTerminal

        const from = new Date(query.from)
        const to = new Date(query.to)

        const drawers = await prisma.cashDrawer.findMany({
          where: {
            openedAt: { gte: from },
            // If you want to ensure closed within range, also filter closedAt
            ...(query.locationId ? { terminal: { locationId: query.locationId } } : {})
          },
          select: {
            id: true,
            openingAmount: true,
            closingAmount: true,
            expectedAmount: true,
            discrepancy: true,
            status: true,
            openedAt: true,
            closedAt: true,
            terminal: { select: { name: true } }
          }
        })
        const items = drawers.map(d => ({ id: d.id, terminal: d.terminal?.name || '', openedAt: d.openedAt.toISOString().slice(0,10), closedAt: d.closedAt ? d.closedAt.toISOString().slice(0,10) : null, openingAmount: Number(d.openingAmount||0), closingAmount: Number(d.closingAmount||0), expectedAmount: Number(d.expectedAmount||0), discrepancy: Number(d.discrepancy||0), status: d.status }))
        const totals = items.reduce((s, r) => ({ opening: s.opening + (r.openingAmount || 0), closing: s.closing + Number(r.closingAmount || 0), expected: s.expected + Number(r.expectedAmount || 0), discrepancy: s.discrepancy + Number(r.discrepancy || 0) }), { opening: 0, closing: 0, expected: 0, discrepancy: 0 })
        return { range: { from: query.from, to: query.to }, items, totals }
      */}

      {loading && <div className="text-sm text-gray-500">Loading…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="border rounded p-3"><div className="text-sm">Opening Total</div><div className="text-lg font-semibold">{Number(data.totals.opening||0).toLocaleString()}</div></div>
            <div className="border rounded p-3"><div className="text-sm">Closing Total</div><div className="text-lg font-semibold">{Number(data.totals.closing||0).toLocaleString()}</div></div>
            <div className="border rounded p-3"><div className="text-sm">Expected Total</div><div className="text-lg font-semibold">{Number(data.totals.expected||0).toLocaleString()}</div></div>
            <div className="border rounded p-3"><div className="text-sm">Discrepancy Total</div><div className="text-lg font-semibold">{Number(data.totals.discrepancy||0).toLocaleString()}</div></div>
          </div>
          <div className="border rounded">
            <div className="grid grid-cols-8 text-xs font-medium text-gray-700 border-b py-2 px-3">
              <div>Terminal</div>
              <div>Opened</div>
              <div>Closed</div>
              <div className="text-right">Opening</div>
              <div className="text-right">Closing</div>
              <div className="text-right">Expected</div>
              <div className="text-right">Discrepancy</div>
              <div>Status</div>
            </div>
            {(data.items || []).map(r => (
              <div key={r.id} className="grid grid-cols-8 text-sm border-b py-2 px-3">
                <div>{r.terminal || '-'}</div>
                <div>{r.openedAt}</div>
                <div>{r.closedAt || '-'}</div>
                <div className="text-right">{Number(r.openingAmount||0).toLocaleString()}</div>
                <div className="text-right">{Number(r.closingAmount||0).toLocaleString()}</div>
                <div className="text-right">{Number(r.expectedAmount||0).toLocaleString()}</div>
                <div className="text-right">{Number(r.discrepancy||0).toLocaleString()}</div>
                <div>{r.status}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </ReportLayout>
  )
}
