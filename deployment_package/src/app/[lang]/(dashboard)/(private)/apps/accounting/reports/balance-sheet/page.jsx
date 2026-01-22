"use client"

import { useEffect, useMemo, useState } from 'react'

function fmt(n) {
  const num = Number(n || 0)
  return `KSh ${num.toLocaleString('en-KE')}`
}

export default function BalanceSheetReportPage() {
  const [asOf, setAsOf] = useState('')
  const [data, setData] = useState({ assets: { cashBank: 0, accountsReceivable: 0, inventory: 0, total: 0 }, liabilities: { accountsPayable: 0, total: 0 }, equity: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/accounting/balance-sheet')
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError('Failed to load balance sheet')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const rangeText = useMemo(() => {
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
          <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={fetchData}>View Report</button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto bg-white border rounded shadow">
        <div className="border-t-4 border-orange-400" />
        <div className="text-center py-4">
          <div className="font-semibold">Balance Sheet</div>
          <div className="text-xs text-gray-600">{rangeText}</div>
        </div>

        <div className="px-4 pb-4">
          {loading && <div className="p-4 text-sm text-gray-500">Loading…</div>}
          {error && <div className="p-4 text-sm text-red-600">{error}</div>}

          <div className="grid grid-cols-12 text-xs font-medium text-gray-700 border-b py-2">
            <div className="col-span-8"></div>
            <div className="col-span-4 text-right">Amount</div>
          </div>

          <div className="grid grid-cols-12 text-sm border-b py-2 bg-gray-50 font-semibold"><div className="col-span-12">Assets</div></div>
          <div className="grid grid-cols-12 text-sm border-b py-2"><div className="col-span-8">Cash & Bank</div><div className="col-span-4 text-right">{fmt(data.assets.cashBank)}</div></div>
          <div className="grid grid-cols-12 text-sm border-b py-2"><div className="col-span-8">Accounts Receivable</div><div className="col-span-4 text-right">{fmt(data.assets.accountsReceivable)}</div></div>
          <div className="grid grid-cols-12 text-sm border-b py-2"><div className="col-span-8">Inventory</div><div className="col-span-4 text-right">{fmt(data.assets.inventory)}</div></div>
          <div className="grid grid-cols-12 text-sm font-semibold py-2"><div className="col-span-8">Total Assets</div><div className="col-span-4 text-right">{fmt(data.assets.total)}</div></div>

          <div className="grid grid-cols-12 text-sm border-b py-2 bg-gray-50 font-semibold mt-4"><div className="col-span-12">Liabilities</div></div>
          <div className="grid grid-cols-12 text-sm border-b py-2"><div className="col-span-8">Accounts Payable</div><div className="col-span-4 text-right">{fmt(data.liabilities.accountsPayable)}</div></div>
          <div className="grid grid-cols-12 text-sm font-semibold py-2"><div className="col-span-8">Total Liabilities</div><div className="col-span-4 text-right">{fmt(data.liabilities.total)}</div></div>

          <div className="grid grid-cols-12 text-sm border-b py-2 bg-gray-50 font-semibold mt-4"><div className="col-span-12">Equity</div></div>
          <div className="grid grid-cols-12 text-sm font-semibold py-2"><div className="col-span-8">Total Equity</div><div className="col-span-4 text-right">{fmt(data.equity)}</div></div>
        </div>
      </div>
    </div>
  )
}
