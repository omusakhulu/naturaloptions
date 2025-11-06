"use client"

import { useEffect, useMemo, useState } from 'react'

function fmt(n) {
  const num = Number(n || 0)
  return `KSh ${num.toLocaleString('en-KE')}`
}

export default function ARAgingSummaryPage() {
  const [asOf, setAsOf] = useState('')
  const [data, setData] = useState({ totals: { current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 }, grandTotal: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchData = async (date) => {
    setLoading(true)
    setError('')
    try {
      const qp = new URLSearchParams()
      if (date) qp.set('asOf', date)
      const res = await fetch(`/api/accounting/reports/ar-aging/summary${qp.toString() ? `?${qp.toString()}` : ''}`)
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError('Failed to load AR aging summary')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const titleDate = useMemo(() => {
    if (!asOf) return 'As of today'
    const dt = new Date(asOf)
    const mm = String(dt.getMonth() + 1).padStart(2, '0')
    const dd = String(dt.getDate()).padStart(2, '0')
    const yyyy = dt.getFullYear()
    return `${mm}/${dd}/${yyyy}`
  }, [asOf])

  return (
    <div className="p-6 space-y-4">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-3">
          <div className="text-sm text-gray-600 mb-1">As of:</div>
          <input type="date" className="border rounded px-3 py-2 w-full bg-gray-50" value={asOf} onChange={e => setAsOf(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 gap-2">
          <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={() => fetchData(asOf)}>View Report</button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto bg-white border rounded shadow">
        <div className="border-t-4 border-orange-400" />
        <div className="text-center py-4">
          <div className="font-semibold">Account Receivable Ageing Report (Summary)</div>
          <div className="text-xs text-gray-600">{titleDate}</div>
        </div>

        <div className="px-4 pb-4">
          {loading && <div className="p-4 text-sm text-gray-500">Loading…</div>}
          {error && <div className="p-4 text-sm text-red-600">{error}</div>}

          <div className="grid grid-cols-12 text-xs font-medium text-gray-700 border-b py-2">
            <div className="col-span-4"></div>
            <div className="col-span-8 grid grid-cols-5">
              <div className="text-right">Current</div>
              <div className="text-right">1-30</div>
              <div className="text-right">31-60</div>
              <div className="text-right">61-90</div>
              <div className="text-right">90+</div>
            </div>
          </div>

          <div className="grid grid-cols-12 text-sm border-b py-2">
            <div className="col-span-4">Totals</div>
            <div className="col-span-8 grid grid-cols-5">
              <div className="text-right">{fmt(data.totals.current)}</div>
              <div className="text-right">{fmt(data.totals['1-30'])}</div>
              <div className="text-right">{fmt(data.totals['31-60'])}</div>
              <div className="text-right">{fmt(data.totals['61-90'])}</div>
              <div className="text-right">{fmt(data.totals['90+'])}</div>
            </div>
          </div>

          <div className="grid grid-cols-12 text-sm font-semibold py-3">
            <div className="col-span-4">Grand Total</div>
            <div className="col-span-8 text-right">{fmt(data.grandTotal)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
