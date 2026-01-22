'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bar, Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

export default function BalanceSheetPage() {
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
      setError('Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const assetsBar = useMemo(() => ({
    labels: ['Cash & Bank', 'Accounts Receivable', 'Inventory'],
    datasets: [{ label: 'Assets (KSh)', data: [data.assets.cashBank, data.assets.accountsReceivable, data.assets.inventory], backgroundColor: ['#22c55e', '#0ea5e9', '#f59e0b'] }]
  }), [data])

  const structurePie = useMemo(() => ({
    labels: ['Assets', 'Liabilities', 'Equity'],
    datasets: [{ data: [data.assets.total, data.liabilities.total, data.equity], backgroundColor: ['#10b981', '#ef4444', '#6366f1'] }]
  }), [data])

  return (
    <div className='p-8 space-y-6'>
      <h1 className='text-2xl font-semibold'>Balance Sheet</h1>

      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <div className='bg-white border rounded shadow p-4'>
          <div className='text-xs text-gray-500'>Total Assets</div>
          <div className='text-2xl font-semibold'>KSh {Number(data.assets.total).toLocaleString('en-KE')}</div>
        </div>
        <div className='bg-white border rounded shadow p-4'>
          <div className='text-xs text-gray-500'>Total Liabilities</div>
          <div className='text-2xl font-semibold'>KSh {Number(data.liabilities.total).toLocaleString('en-KE')}</div>
        </div>
        <div className='bg-white border rounded shadow p-4'>
          <div className='text-xs text-gray-500'>Equity</div>
          <div className='text-2xl font-semibold'>KSh {Number(data.equity).toLocaleString('en-KE')}</div>
        </div>
        <div className='bg-white border rounded shadow p-4'>
          <div className='text-xs text-gray-500'>Working Capital (Assets - Liabilities)</div>
          <div className='text-2xl font-semibold'>KSh {(Number(data.assets.total) - Number(data.liabilities.total)).toLocaleString('en-KE')}</div>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='bg-white border rounded shadow p-4'>
          <div className='text-sm text-gray-600 mb-2'>Asset Breakdown</div>
          <Bar data={assetsBar} options={{ plugins: { legend: { display: false } } }} height={120} />
        </div>
        <div className='bg-white border rounded shadow p-4'>
          <div className='text-sm text-gray-600 mb-2'>Structure</div>
          <Doughnut data={structurePie} />
        </div>
      </div>

      <div className='bg-white border rounded shadow p-4'>
        <div className='text-sm text-gray-600 mb-3'>Summary</div>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
          <div>
            <div className='text-gray-500 mb-1'>Assets</div>
            <div>Cash & Bank: KSh {Number(data.assets.cashBank).toLocaleString('en-KE')}</div>
            <div>Accounts Receivable: KSh {Number(data.assets.accountsReceivable).toLocaleString('en-KE')}</div>
            <div>Inventory: KSh {Number(data.assets.inventory).toLocaleString('en-KE')}</div>
            <div className='font-medium mt-1'>Total: KSh {Number(data.assets.total).toLocaleString('en-KE')}</div>
          </div>
          <div>
            <div className='text-gray-500 mb-1'>Liabilities</div>
            <div>Accounts Payable: KSh {Number(data.liabilities.accountsPayable).toLocaleString('en-KE')}</div>
            <div className='font-medium mt-1'>Total: KSh {Number(data.liabilities.total).toLocaleString('en-KE')}</div>
          </div>
          <div>
            <div className='text-gray-500 mb-1'>Equity</div>
            <div className='font-medium'>KSh {Number(data.equity).toLocaleString('en-KE')}</div>
          </div>
        </div>
      </div>

      {loading && <div className='text-sm text-gray-500'>Loading…</div>}
      {error && <div className='text-sm text-red-600'>{error}</div>}
    </div>
  )
}
