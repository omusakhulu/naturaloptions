"use client"

import { useEffect, useState, useMemo } from 'react'

function fmt(n) {
  const num = Number(n || 0)
  return `KSh ${num.toLocaleString('en-KE')}`
}

function fmtDate(d) {
  if (!d) return ''
  const dt = new Date(d)
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  const yyyy = dt.getFullYear()
  return `${mm}/${dd}/${yyyy}`
}

export default function TrialBalanceReportPage() {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [data, setData] = useState({ items: [], totals: { debit: 0, credit: 0 }, difference: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchData = async (after, before) => {
    setLoading(true)
    setError('')
    try {
      const qp = new URLSearchParams()
      if (after) qp.set('after', after)
      if (before) qp.set('before', before)
      const url = `/api/accounting/trial-balance${qp.toString() ? `?${qp.toString()}` : ''}`
      const res = await fetch(url)
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError('Failed to load trial balance')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const rangeText = useMemo(() => {
    if (!fromDate && !toDate) return ''
    return `${fmtDate(fromDate)} - ${fmtDate(toDate)}`
  }, [fromDate, toDate])

  const apply = () => fetchData(fromDate, toDate)

  return (
    <div className="p-6 space-y-4">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-3">
          <div className="text-sm text-gray-600 mb-1">Date Range:</div>
          <input className="border rounded px-3 py-2 w-full bg-gray-50" readOnly value={rangeText} placeholder="Select range then Apply" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input type="date" className="border rounded px-3 py-2" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          <input type="date" className="border rounded px-3 py-2" value={toDate} onChange={e => setToDate(e.target.value)} />
          <button className="col-span-2 px-3 py-2 rounded bg-blue-600 text-white" onClick={apply}>Apply</button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto bg-white border rounded shadow">
        <div className="border-t-4 border-orange-400" />
        <div className="text-center py-4">
          <div className="font-semibold">Trial Balance</div>
          <div className="text-xs text-gray-600">{rangeText || 'All Dates'}</div>
        </div>

        <div className="px-4 pb-4">
          <div className="grid grid-cols-12 text-xs font-medium text-gray-700 border-b py-2">
            <div className="col-span-8"></div>
            <div className="col-span-2 text-right">Debit</div>
            <div className="col-span-2 text-right">Credit</div>
          </div>

          {loading && <div className="p-4 text-sm text-gray-500">Loading…</div>}
          {error && <div className="p-4 text-sm text-red-600">{error}</div>}

          {!loading && data.items.map(row => (
            <div key={row.accountId} className="grid grid-cols-12 text-sm border-b py-2">
              <div className="col-span-8">{row.accountName}</div>
              <div className="col-span-2 text-right tabular-nums">{fmt(row.debit)}</div>
              <div className="col-span-2 text-right tabular-nums">{fmt(row.credit)}</div>
            </div>
          ))}

          <div className="grid grid-cols-12 text-sm font-semibold py-3">
            <div className="col-span-8">Total</div>
            <div className="col-span-2 text-right">{fmt(data.totals.debit)}</div>
            <div className="col-span-2 text-right">{fmt(data.totals.credit)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
