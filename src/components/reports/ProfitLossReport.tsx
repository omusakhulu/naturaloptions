"use client"

import React, { useEffect, useMemo, useState } from 'react'
import ReportLayout from '@/components/reports/ReportLayout'
import useReportQuery from '@/components/reports/useReportQuery'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Pie } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

function toDateInputValue(d: Date) {
  const dt = new Date(d)
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

type ExpenseSlice = { account: string; amount: number }

type PLData = {
  range: { from: string; to: string }
  locationId?: string | null
  totals: {
    revenue: number
    cogs: number
    grossProfit: number
    expenses: number
    netProfit: number
  }
  expenseBreakdown: ExpenseSlice[]
}

export default function ProfitLossReport({ lang = 'en' }: { lang?: string }) {
  const monthStart = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1), [])
  const today = useMemo(() => new Date(), [])
  const { params, setParams } = useReportQuery({ from: toDateInputValue(monthStart), to: toDateInputValue(today), locationId: '' })

  const [data, setData] = useState<PLData>({
    range: { from: toDateInputValue(monthStart), to: toDateInputValue(today) },
    locationId: '',
    totals: { revenue: 0, cogs: 0, grossProfit: 0, expenses: 0, netProfit: 0 },
    expenseBreakdown: []
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([])

  // Load locations (mock-friendly, ignore errors)
  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/locations?isActive=true', { cache: 'no-store' })
        const json = await res.json()
        if (Array.isArray(json.items)) setLocations(json.items)
      } catch {
        // fallback mock locations
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
      const res = await fetch(`/api/reports/profit-loss${sp.toString() ? `?${sp.toString()}` : ''}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load report')
      const json = await res.json()
      // Expecting PLData-compatible response
      setData(json as PLData)
    } catch (e) {
      // Mock fallback data
      const mock: PLData = {
        range: { from: params.from || toDateInputValue(monthStart), to: params.to || toDateInputValue(today) },
        locationId: params.locationId || '',
        totals: {
          revenue: 125000,
          cogs: 54000,
          grossProfit: 125000 - 54000,
          expenses: 36000,
          netProfit: (125000 - 54000) - 36000
        },
        expenseBreakdown: [
          { account: 'Salaries & Wages', amount: 14000 },
          { account: 'Rent', amount: 9000 },
          { account: 'Utilities', amount: 2500 },
          { account: 'Marketing', amount: 6000 },
          { account: 'Miscellaneous', amount: 4500 }
        ]
      }
      setData(mock)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchReport()
  }, [params.from, params.to, params.locationId])

  const breadcrumbs = [
    { label: 'Reports', href: `/${lang}/apps/reports` },
    { label: 'Profit / Loss Report' }
  ]

  const exportCsv = () => {
    const rows: string[][] = []
    rows.push(['From', data.range.from, 'To', data.range.to, 'Location', data.locationId || 'All'])
    rows.push([])
    rows.push(['Metric', 'Amount'])
    rows.push(['Revenue', String(data.totals.revenue)])
    rows.push(['COGS', String(data.totals.cogs)])
    rows.push(['Gross Profit', String(data.totals.grossProfit)])
    rows.push(['Expenses', String(data.totals.expenses)])
    rows.push(['Net Profit', String(data.totals.netProfit)])
    rows.push([])
    rows.push(['Expense Account', 'Amount'])
    for (const s of data.expenseBreakdown) rows.push([s.account, String(s.amount)])
    const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    downloadCsv(`profit-loss-${data.range.from}-${data.range.to}.csv`, csv)
  }

  const actions = (
    <>
      <button className="px-3 py-2 border rounded hover:bg-gray-50" onClick={() => window.print()}>Print</button>
      <button className="px-3 py-2 border rounded hover:bg-gray-50" onClick={exportCsv}>Export CSV</button>
    </>
  )

  const filters = (
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
          {locations.map(l => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>
    </div>
  )

  const pieData = useMemo(() => ({
    labels: (data.expenseBreakdown || []).map(s => s.account),
    datasets: [
      {
        label: 'Expenses',
        data: (data.expenseBreakdown || []).map(s => Number(s.amount || 0)),
        backgroundColor: [
          '#ef4444','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899','#22c55e','#f97316','#06b6d4','#64748b'
        ],
        borderWidth: 1
      }
    ]
  }), [data.expenseBreakdown])

  return (
    <ReportLayout
      title="Profit / Loss Report"
      description="Aggregated revenue, COGS, and expenses with expense breakdown"
      breadcrumbs={breadcrumbs}
      actions={actions}
      filters={filters}
    >
      {/*
        Prisma Logic:

        // Inputs: from, to (date range), optional locationId (not present in schema; see note)
        // Primary Models: JournalEntry, JournalLineItem, ChartOfAccounts

        // NOTE: The provided schema does not include a location link on JournalEntry.
        // If location scoping is required, add a field `locationId` on JournalEntry (FK to Location)
        // and apply it in the `where` clauses below.

        const from = new Date(query.from)
        const to = new Date(query.to)

        // Revenue: sum(credit - debit) where accountType = REVENUE
        const revenueAgg = await prisma.journalLineItem.groupBy({
          by: ['accountId'],
          where: {
            journal: { entryDate: { gte: from, lte: to } },
            account: { accountType: 'REVENUE' }
            // If JournalEntry has locationId:
            // ...(query.locationId ? { journal: { locationId: query.locationId } } : {})
          },
          _sum: { creditAmount: true, debitAmount: true }
        })
        const revenue = revenueAgg.reduce((s, r) => s + Number(r._sum.creditAmount || 0) - Number(r._sum.debitAmount || 0), 0)

        // COGS: sum(debit - credit) where accountType = COGS
        const cogsAgg = await prisma.journalLineItem.groupBy({
          by: ['accountId'],
          where: {
            journal: { entryDate: { gte: from, lte: to } },
            account: { accountType: 'COGS' }
            // ...(query.locationId ? { journal: { locationId: query.locationId } } : {})
          },
          _sum: { creditAmount: true, debitAmount: true }
        })
        const cogs = cogsAgg.reduce((s, r) => s + Number(r._sum.debitAmount || 0) - Number(r._sum.creditAmount || 0), 0)

        // Expenses: sum(debit - credit) where accountType = EXPENSE
        const expenseAgg = await prisma.journalLineItem.groupBy({
          by: ['accountId'],
          where: {
            journal: { entryDate: { gte: from, lte: to } },
            account: { accountType: 'EXPENSE' }
            // ...(query.locationId ? { journal: { locationId: query.locationId } } : {})
          },
          _sum: { creditAmount: true, debitAmount: true }
        })
        const expenses = expenseAgg.reduce((s, r) => s + Number(r._sum.debitAmount || 0) - Number(r._sum.creditAmount || 0), 0)

        // Expense breakdown by account name
        const expenseAccounts = await prisma.chartOfAccounts.findMany({
          where: { accountType: 'EXPENSE' },
          select: { id: true, accountName: true }
        })
        const breakdown = expenseAgg.map(e => ({
          account: expenseAccounts.find(a => a.id === e.accountId)?.accountName || 'Expense',
          amount: Number(e._sum.debitAmount || 0) - Number(e._sum.creditAmount || 0)
        }))

        const grossProfit = revenue - cogs
        const netProfit = grossProfit - expenses

        return {
          range: { from: query.from, to: query.to },
          locationId: query.locationId || null,
          totals: { revenue, cogs, grossProfit, expenses, netProfit },
          expenseBreakdown: breakdown
        }
      */}

      {loading && <div className="text-sm text-gray-500">Loading…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="border rounded p-3">
              <div className="text-sm text-gray-600">Revenue</div>
              <div className="text-lg font-semibold">{Number(data.totals.revenue || 0).toLocaleString()}</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-sm text-gray-600">COGS</div>
              <div className="text-lg font-semibold">{Number(data.totals.cogs || 0).toLocaleString()}</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-sm text-gray-600">Gross Profit</div>
              <div className="text-lg font-semibold">{Number(data.totals.grossProfit || 0).toLocaleString()}</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-sm text-gray-600">Expenses</div>
              <div className="text-lg font-semibold">{Number(data.totals.expenses || 0).toLocaleString()}</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-sm text-gray-600">Net Profit</div>
              <div className="text-lg font-semibold">{Number(data.totals.netProfit || 0).toLocaleString()}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="border rounded p-3">
              <div className="text-sm font-semibold mb-2">Expense Breakdown</div>
              <Pie data={pieData} />
            </div>
            <div className="border rounded">
              <div className="grid grid-cols-2 text-xs font-medium text-gray-700 border-b py-2 px-3">
                <div>Expense Account</div>
                <div className="text-right">Amount</div>
              </div>
              {(data.expenseBreakdown || []).map((s, idx) => (
                <div key={idx} className="grid grid-cols-2 text-sm border-b py-2 px-3">
                  <div>{s.account}</div>
                  <div className="text-right">{Number(s.amount || 0).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="border rounded">
            <div className="grid grid-cols-2 text-xs font-medium text-gray-700 border-b py-2 px-3">
              <div>Summary</div>
              <div className="text-right">Amount</div>
            </div>
            {[{ label: 'Revenue', amount: data.totals.revenue }, { label: 'COGS', amount: data.totals.cogs }, { label: 'Gross Profit', amount: data.totals.grossProfit }, { label: 'Expenses', amount: data.totals.expenses }, { label: 'Net Profit', amount: data.totals.netProfit }].map((r) => (
              <div key={r.label} className="grid grid-cols-2 text-sm border-b py-2 px-3">
                <div>{r.label}</div>
                <div className="text-right">{Number(r.amount || 0).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </ReportLayout>
  )
}
