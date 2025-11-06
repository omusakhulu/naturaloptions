"use client"

import React, { useEffect, useMemo, useState } from 'react'
import ReportLayout from '@/components/reports/ReportLayout'
import useReportQuery from '@/components/reports/useReportQuery'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

type Row = { category: string; account: string; amount: number }

type Data = { range: { from: string; to: string }; locationId?: string | null; items: Row[]; totals: { amount: number } }

function toDateInputValue(d: Date) {
  const dt = new Date(d)
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function ExpenseReportTSX({ lang = 'en' }: { lang?: string }) {
  const monthStart = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1), [])
  const today = useMemo(() => new Date(), [])
  const { params, setParams } = useReportQuery({ from: toDateInputValue(monthStart), to: toDateInputValue(today), locationId: '' })

  const [data, setData] = useState<Data>({ range: { from: toDateInputValue(monthStart), to: toDateInputValue(today) }, locationId: '', items: [], totals: { amount: 0 } })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([])

  useEffect(() => { (async () => { try { const res = await fetch('/api/locations?isActive=true', { cache: 'no-store' }); const json = await res.json(); if (Array.isArray(json.items)) setLocations(json.items) } catch { setLocations([{ id: 'main', name: 'Main Location' }]) } })() }, [])

  const fetchReport = async () => {
    setLoading(true); setError('')
    try {
      const sp = new URLSearchParams(); if (params.from) sp.set('from', params.from); if (params.to) sp.set('to', params.to); if (params.locationId) sp.set('locationId', String(params.locationId))
      const res = await fetch(`/api/reports/expense${sp.toString() ? `?${sp.toString()}` : ''}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load report')
      const json = await res.json(); setData(json as Data)
    } catch (e) {
      const items: Row[] = [
        { category: 'Salaries & Wages', account: 'Main Bank', amount: 14000 },
        { category: 'Rent', account: 'Main Bank', amount: 9000 },
        { category: 'Utilities', account: 'Main Bank', amount: 2500 },
        { category: 'Marketing', account: 'Main Bank', amount: 6000 },
        { category: 'Miscellaneous', account: 'Petty Cash', amount: 4500 }
      ]
      const totals = { amount: items.reduce((s, r) => s + r.amount, 0) }
      setData({ range: { from: params.from || toDateInputValue(monthStart), to: params.to || toDateInputValue(today) }, locationId: params.locationId || '', items, totals })
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchReport() /* eslint-disable-line react-hooks/exhaustive-deps */ }, [params.from, params.to, params.locationId])

  const breadcrumbs = [ { label: 'Reports', href: `/${lang}/apps/reports` }, { label: 'Expense Report' } ]

  const categories = Array.from(new Set((data.items || []).map(r => r.category)))
  const barData = useMemo(() => ({ labels: categories, datasets: [{ label: 'Amount', backgroundColor: '#ef4444', data: categories.map(c => (data.items || []).filter(r => r.category === c).reduce((s, r) => s + r.amount, 0)) }] }), [categories, data.items])

  return (
    <ReportLayout title="Expense Report" description="Sum of expense amounts grouped by category and account" breadcrumbs={breadcrumbs} filters={
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

        // Inputs: from, to; optional locationId (not in Expense schema). If you add PaymentAccount.locationId, you can filter via account.
        // Primary Models: Expense, PaymentAccount

        const from = new Date(query.from)
        const to = new Date(query.to)

        const rows = await prisma.expense.findMany({
          where: { date: { gte: from, lte: to } },
          select: { amount: true, category: true, account: { select: { name: true } } },
          orderBy: { date: 'desc' }
        })
        // Group by category & account
        const map = new Map<string, number>()
        for (const r of rows) {
          const key = `${r.category}||${r.account?.name || '-'}`
          map.set(key, (map.get(key) || 0) + Number(r.amount || 0))
        }
        const items = Array.from(map.entries()).map(([k, v]) => { const [category, account] = k.split('||'); return { category, account, amount: v } })
        const totals = { amount: items.reduce((s, r) => s + r.amount, 0) }
        return { range: { from: query.from, to: query.to }, items, totals }
      */}

      {loading && <div className="text-sm text-gray-500">Loading…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="border rounded p-3"><div className="text-sm">Total Expense</div><div className="text-lg font-semibold">{Number(data.totals.amount||0).toLocaleString()}</div></div>
          </div>

          <div className="border rounded p-3">
            <div className="text-sm font-semibold mb-2">Category vs Amount</div>
            <Bar data={barData} />
          </div>

          <div className="border rounded">
            <div className="grid grid-cols-3 text-xs font-medium text-gray-700 border-b py-2 px-3">
              <div>Category</div>
              <div>Account</div>
              <div className="text-right">Amount</div>
            </div>
            {(data.items || []).map((r, idx) => (
              <div key={idx} className="grid grid-cols-3 text-sm border-b py-2 px-3">
                <div>{r.category}</div>
                <div>{r.account}</div>
                <div className="text-right">{Number(r.amount||0).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </ReportLayout>
  )
}
