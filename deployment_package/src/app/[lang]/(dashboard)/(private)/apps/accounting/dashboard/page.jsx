"use client"

import { useEffect, useMemo, useState } from 'react'
import { Doughnut, Line, Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend)

export default function AccountingDashboardPage() {
  const [bs, setBs] = useState({ assets: { cashBank: 0, accountsReceivable: 0, inventory: 0, total: 0 }, liabilities: { accountsPayable: 0, total: 0 }, equity: 0 })
  const [cf, setCf] = useState({ range: { after: '', before: '' }, totals: { inflow: 0, outflow: 0, net: 0 }, cashOnHand: 0, series: [], cumulative: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchAll = async () => {
    setLoading(true)
    setError('')
    try {
      const end = new Date()
      const start = new Date(); start.setDate(end.getDate() - 29)
      const after = start.toISOString().slice(0,10)
      const before = end.toISOString().slice(0,10)

      const [bsRes, cfRes] = await Promise.all([
        fetch('/api/accounting/balance-sheet'),
        fetch(`/api/accounting/cash-flow?after=${after}&before=${before}`)
      ])
      const bsJson = await bsRes.json()
      const cfJson = await cfRes.json()
      setBs(bsJson)
      setCf(cfJson)
    } catch (e) {
      setError('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const structurePie = useMemo(() => ({
    labels: ['Assets', 'Liabilities', 'Equity'],
    datasets: [{ data: [bs.assets.total, bs.liabilities.total, bs.equity], backgroundColor: ['#10b981', '#ef4444', '#6366f1'] }]
  }), [bs])

  const cashFlowLine = useMemo(() => ({
    labels: cf.series.map(s => s.date),
    datasets: [
      { label: 'Inflow', data: cf.series.map(s => s.inflow), borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.15)', tension: 0.3 },
      { label: 'Outflow', data: cf.series.map(s => s.outflow), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', tension: 0.3 }
    ]
  }), [cf])

  const arApBar = useMemo(() => ({
    labels: ['AR', 'AP'],
    datasets: [{ label: 'KSh', data: [bs.assets.accountsReceivable, bs.liabilities.accountsPayable], backgroundColor: ['#0ea5e9', '#f59e0b'] }]
  }), [bs])

  return (
    <div className='p-8 space-y-6'>
      <h1 className='text-2xl font-semibold'>Accounting Dashboard</h1>

      <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
        <div className='bg-white border rounded shadow p-4'>
          <div className='text-xs text-gray-500'>Cash & Bank</div>
          <div className='text-2xl font-semibold'>KSh {Number(bs.assets.cashBank).toLocaleString('en-KE')}</div>
        </div>
        <div className='bg-white border rounded shadow p-4'>
          <div className='text-xs text-gray-500'>Accounts Receivable</div>
          <div className='text-2xl font-semibold'>KSh {Number(bs.assets.accountsReceivable).toLocaleString('en-KE')}</div>
        </div>
        <div className='bg-white border rounded shadow p-4'>
          <div className='text-xs text-gray-500'>Accounts Payable</div>
          <div className='text-2xl font-semibold'>KSh {Number(bs.liabilities.accountsPayable).toLocaleString('en-KE')}</div>
        </div>
        <div className='bg-white border rounded shadow p-4'>
          <div className='text-xs text-gray-500'>Equity</div>
          <div className='text-2xl font-semibold'>KSh {Number(bs.equity).toLocaleString('en-KE')}</div>
        </div>
        <div className='bg-white border rounded shadow p-4'>
          <div className='text-xs text-gray-500'>Net Cash (30d)</div>
          <div className='text-2xl font-semibold'>KSh {Number(cf.totals.net).toLocaleString('en-KE')}</div>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <div className='bg-white border rounded shadow p-4'>
          <div className='text-sm text-gray-600 mb-2'>Financial Structure</div>
          <Doughnut data={structurePie} />
        </div>
        <div className='md:col-span-2 bg-white border rounded shadow p-4'>
          <div className='text-sm text-gray-600 mb-2'>Cash Flow (Last 30 days)</div>
          <Line data={cashFlowLine} height={110} />
        </div>
      </div>

      <div className='bg-white border rounded shadow p-4'>
        <div className='text-sm text-gray-600 mb-2'>Receivables vs Payables</div>
        <Bar data={arApBar} height={80} />
      </div>

      {loading && <div className='text-sm text-gray-500'>Loading…</div>}
      {error && <div className='text-sm text-red-600'>{error}</div>}
    </div>
  )
}
