"use client"

import { useEffect, useMemo, useState } from 'react'

function fmt(n) {
  const num = Number(n || 0)
  return `KSh ${num.toLocaleString('en-KE')}`
}

export default function APAgingDetailsPage() {
  const [asOf, setAsOf] = useState('')
  const [data, setData] = useState({ items: [], grandTotal: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchData = async (date) => {
    setLoading(true)
    setError('')
    try {
      const qp = new URLSearchParams()
      if (date) qp.set('asOf', date)
      const res = await fetch(`/api/accounting/reports/ap-aging/details${qp.toString() ? `?${qp.toString()}` : ''}`)
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError('Failed to load AP aging details')
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
          <div className="font-semibold">Account Payable Ageing Details (Details)</div>
          <div className="text-xs text-gray-600">{titleDate}</div>
        </div>

        <div className="px-4 pb-4">
          {loading && <div className="p-4 text-sm text-gray-500">Loading…</div>}
          {error && <div className="p-4 text-sm text-red-600">{error}</div>}

          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-700 border-b py-2">
            <div className="col-span-3">Vendor</div>
            <div className="col-span-2">Bill #</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Due Date</div>
            <div className="col-span-1 text-right">Days</div>
            <div className="col-span-1">Bucket</div>
            <div className="col-span-1 text-right">Outstanding</div>
          </div>

          {data.items.map(row => (
            <div key={row.id} className="grid grid-cols-12 gap-2 px-2 py-2 border-b text-sm">
              <div className="col-span-3 truncate" title={row.vendor}>{row.vendor}</div>
              <div className="col-span-2 font-mono text-xs">{row.number}</div>
              <div className="col-span-2">{new Date(row.date).toLocaleDateString()}</div>
              <div className="col-span-2">{new Date(row.dueDate).toLocaleDateString()}</div>
              <div className="col-span-1 text-right">{row.daysPastDue}</div>
              <div className="col-span-1">{row.bucket}</div>
              <div className="col-span-1 text-right tabular-nums">{fmt(row.outstanding)}</div>
            </div>
          ))}

          <div className="grid grid-cols-12 gap-2 px-2 py-2 bg-gray-50 text-sm font-semibold">
            <div className="col-span-11 text-right">Grand Total</div>
            <div className="col-span-1 text-right">{fmt(data.grandTotal)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
