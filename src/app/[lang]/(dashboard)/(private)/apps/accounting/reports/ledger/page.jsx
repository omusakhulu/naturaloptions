"use client"

import { useEffect, useMemo, useState } from 'react'

function formatKSh(n) {
  const num = Number(n || 0)
  return `KSh ${num.toLocaleString('en-KE')}`
}

export default function LedgerReportPage() {
  const [accounts, setAccounts] = useState([])
  const [accountId, setAccountId] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [data, setData] = useState({ account: null, openingBalance: 0, items: [], totals: { debit: 0, credit: 0 }, closingBalance: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/accounting/accounts')
      const json = await res.json()
      const list = (json.items || []).filter(a => a.isActive !== false)
      list.sort((a, b) => (a.accountCode || '').localeCompare(b.accountCode || ''))
      setAccounts(list)
      if (list.length && !accountId) setAccountId(list[0].id)
    } catch {}
  }

  const fetchLedger = async (accId, after, before) => {
    if (!accId) return
    setLoading(true)
    setError('')
    try {
      const qp = new URLSearchParams()
      if (accId) qp.set('accountId', accId)
      if (after) qp.set('after', after)
      if (before) qp.set('before', before)
      const url = `/api/accounting/ledger${qp.toString() ? `?${qp.toString()}` : ''}`
      const res = await fetch(url)
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError('Failed to load ledger')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAccounts() }, [])
  useEffect(() => { if (accountId) fetchLedger(accountId) }, [accountId])

  const apply = () => fetchLedger(accountId, fromDate, toDate)

  const rangeText = useMemo(() => {
    const fmt = d => {
      if (!d) return ''
      const dt = new Date(d)
      const mm = String(dt.getMonth() + 1).padStart(2, '0')
      const dd = String(dt.getDate()).padStart(2, '0')
      const yyyy = dt.getFullYear()
      return `${mm}/${dd}/${yyyy}`
    }
    if (!fromDate && !toDate) return 'All Dates'
    return `${fmt(fromDate)} - ${fmt(toDate)}`
  }, [fromDate, toDate])

  return (
    <div className="p-6 space-y-4">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-3">
          <div className="text-sm text-gray-600 mb-1">Date Range:</div>
          <input className="border rounded px-3 py-2 w-full bg-gray-50" readOnly value={rangeText} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input type="date" className="border rounded px-3 py-2" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          <input type="date" className="border rounded px-3 py-2" value={toDate} onChange={e => setToDate(e.target.value)} />
          <select className="col-span-2 border rounded px-3 py-2" value={accountId} onChange={e => setAccountId(e.target.value)}>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.accountCode} - {a.accountName}</option>
            ))}
          </select>
          <button className="col-span-2 px-3 py-2 rounded bg-blue-600 text-white" onClick={apply}>View Report</button>
        </div>
      </div>

      {loading && <div className="text-sm text-gray-500 text-center">Loading…</div>}
      {error && <div className="text-sm text-red-600 text-center">{error}</div>}

      <div className="max-w-5xl mx-auto bg-white border rounded shadow">
        <div className="border-t-4 border-orange-400" />
        <div className="text-center py-4">
          <div className="font-semibold">Ledger Report</div>
          <div className="text-xs text-gray-600">{rangeText}</div>
          {data.account && (
            <div className="text-xs text-gray-600">{data.account.accountCode} - {data.account.accountName}</div>
          )}
        </div>

        <div className="px-4 pb-4">
          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-700 border-b py-2">
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Entry #</div>
            <div className="col-span-4">Description</div>
            <div className="col-span-1 text-right">Debit</div>
            <div className="col-span-1 text-right">Credit</div>
            <div className="col-span-2 text-right">Running</div>
          </div>

          <div className="grid grid-cols-12 gap-2 px-2 py-2 text-sm border-b bg-gray-50">
            <div className="col-span-8">Opening Balance</div>
            <div className="col-span-4 text-right font-medium">{formatKSh(data.openingBalance)}</div>
          </div>

          {data.items.map(row => (
            <div key={row.id} className="grid grid-cols-12 gap-2 px-2 py-2 border-b text-sm">
              <div className="col-span-2">{new Date(row.date).toLocaleDateString()}</div>
              <div className="col-span-2 font-mono text-xs">{row.entryNumber}</div>
              <div className="col-span-4 truncate" title={row.memo}>{row.memo}</div>
              <div className="col-span-1 text-right tabular-nums">{formatKSh(row.debit)}</div>
              <div className="col-span-1 text-right tabular-nums">{formatKSh(row.credit)}</div>
              <div className="col-span-2 text-right tabular-nums font-medium">{formatKSh(row.running)}</div>
            </div>
          ))}

          <div className="grid grid-cols-12 gap-2 px-2 py-2 bg-gray-50 text-sm font-semibold">
            <div className="col-span-8">Totals</div>
            <div className="col-span-1 text-right">{formatKSh(data.totals.debit)}</div>
            <div className="col-span-1 text-right">{formatKSh(data.totals.credit)}</div>
            <div className="col-span-2 text-right">{formatKSh(data.closingBalance)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
