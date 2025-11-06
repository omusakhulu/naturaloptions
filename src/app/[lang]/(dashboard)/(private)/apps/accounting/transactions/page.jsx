"use client"

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

function formatKSh(n) {
  const num = Number(n || 0)
  return `KSh ${num.toLocaleString('en-KE')}`
}

const CATS = [
  { key: 'sales-payments', label: 'Sales Payments' },
  { key: 'woo-sales', label: 'Woo Sales' },
  { key: 'purchases', label: 'Purchases' },
  { key: 'purchase-payments', label: 'Purchase Payments' },
  { key: 'expenses', label: 'Expenses' }
]

export default function TransactionsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const initialCat = searchParams.get('cat') || 'sales-payments'
  const [category, setCategory] = useState(initialCat)
  const [items, setItems] = useState([])
  const [totals, setTotals] = useState({ count: 0, amount: 0 })
  const [series, setSeries] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [q, setQ] = useState('')

  const fetchData = async (cat, after, before, query) => {
    setLoading(true)
    setError('')
    try {
      const qp = new URLSearchParams()
      if (cat) qp.set('category', cat)
      if (after) qp.set('after', after)
      if (before) qp.set('before', before)
      if (query) qp.set('q', query)
      const url = `/api/accounting/transactions${qp.toString() ? `?${qp.toString()}` : ''}`
      const res = await fetch(url)
      const json = await res.json()
      setItems(json.items || [])
      setTotals(json.totals || { count: 0, amount: 0 })
      setSeries(json.series || [])
    } catch (e) {
      setError('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData(category) }, [category])

  const apply = () => fetchData(category, fromDate, toDate, q)

  const chartData = useMemo(() => ({
    labels: series.map(s => s.date),
    datasets: [{
      label: 'Amount',
      data: series.map(s => s.amount),
      backgroundColor: 'rgba(99,102,241,0.25)',
      borderColor: '#6366f1'
    }]
  }), [series])

  const selectCat = (key) => {
    setCategory(key)
    // Reflect active tab in URL without full navigation
    const url = `${pathname}?cat=${encodeURIComponent(key)}`
    router.replace(url, { scroll: false })
    fetchData(key, fromDate, toDate, q)
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Transactions</h1>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-3">
          <div className="bg-white border rounded shadow divide-y">
            {CATS.map(c => (
              <button key={c.key} onClick={() => selectCat(c.key)}
                className={`w-full text-left px-4 py-3 ${category === c.key ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600 font-medium' : 'hover:bg-gray-50'}`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <div className="col-span-12 md:col-span-9 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border rounded shadow p-4">
              <div className="text-xs text-gray-500">Total Records</div>
              <div className="text-2xl font-semibold">{totals.count}</div>
            </div>
            <div className="bg-white border rounded shadow p-4">
              <div className="text-xs text-gray-500">Total Amount</div>
              <div className="text-2xl font-semibold">{formatKSh(totals.amount)}</div>
            </div>
            <div className="bg-white border rounded shadow p-4">
              <div className="text-xs text-gray-500">Avg Amount</div>
              <div className="text-2xl font-semibold">{formatKSh(totals.count ? (totals.amount / totals.count) : 0)}</div>
            </div>
          </div>

          <div className="bg-white border rounded shadow p-4">
            <div className="text-sm text-gray-600 mb-2">Daily totals</div>
            <Bar data={chartData} height={110} />
          </div>

          <div className="flex items-center gap-2">
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="border rounded px-2 py-1 text-sm" />
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="border rounded px-2 py-1 text-sm" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search..." className="border rounded px-2 py-1 text-sm" />
            <button className="px-3 py-1 rounded bg-blue-600 text-white text-sm" onClick={apply}>Apply</button>
          </div>

          <div className="bg-white border rounded shadow overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-2 py-2 bg-gray-50 text-xs font-medium border-b">
              <div className="col-span-2">Date</div>
              <div className="col-span-3">Payment Ref No / Invoice</div>
              <div className="col-span-2 text-right">Amount</div>
              <div className="col-span-2">Payment Type</div>
              <div className="col-span-1">{category === 'woo-sales' ? 'Status' : ''}</div>
              <div className="col-span-1">Description</div>
              <div className="col-span-1">Party</div>
            </div>
            {loading && <div className="p-4 text-sm text-gray-500">Loading…</div>}
            {error && <div className="p-4 text-sm text-red-600">{error}</div>}
            {!loading && items.map(row => (
              <div key={row.id} className="grid grid-cols-12 gap-2 px-2 py-2 border-b text-sm">
                <div className="col-span-2">{new Date(row.date).toLocaleString()}</div>
                <div className="col-span-3 font-mono text-xs">{row.ref}</div>
                <div className="col-span-2 text-right tabular-nums">{formatKSh(row.amount)}</div>
                <div className="col-span-2">{row.paymentType}</div>
                <div className="col-span-1"><span className={`text-xs ${row.status === 'completed' ? 'text-green-600' : 'text-gray-600'}`}>{row.status || ''}</span></div>
                <div className="col-span-1 truncate" title={row.description}>{row.description}</div>
                <div className="col-span-1">{row.counterpart || '-'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
