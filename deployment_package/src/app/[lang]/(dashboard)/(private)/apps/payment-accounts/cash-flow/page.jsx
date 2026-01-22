'use client'

import { useEffect, useMemo, useState } from 'react'
import { Line, Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend)

export default function CashFlowPage() {
  const [data, setData] = useState({ range: { after: '', before: '' }, totals: { inflow: 0, outflow: 0, net: 0 }, cashOnHand: 0, series: [], cumulative: [] })
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const fetchData = async (after, before) => {
    const qp = new URLSearchParams()
    if (after) qp.set('after', after)
    if (before) qp.set('before', before)
    const url = `/api/accounting/cash-flow${qp.toString() ? `?${qp.toString()}` : ''}`
    const res = await fetch(url)
    const json = await res.json()
    setData(json)
  }

  useEffect(() => { fetchData() }, [])

  const lineData = useMemo(() => ({
    labels: data.series.map(s => s.date),
    datasets: [
      { label: 'Inflow', data: data.series.map(s => s.inflow), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.15)', tension: 0.3 },
      { label: 'Outflow', data: data.series.map(s => s.outflow), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', tension: 0.3 }
    ]
  }), [data])

  const barData = useMemo(() => ({
    labels: data.series.map(s => s.date),
    datasets: [{ label: 'Net', data: data.series.map(s => s.net), backgroundColor: data.series.map(s => s.net >= 0 ? '#6366f1' : '#ef4444') }]
  }), [data])

  return (
    <div className='p-8 space-y-6'>
      <h1 className='text-2xl font-semibold'>Cash Flow</h1>

      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <div className='bg-white border rounded shadow p-4'>
          <div className='text-xs text-gray-500'>Cash on Hand</div>
          <div className='text-2xl font-semibold'>KSh {Number(data.cashOnHand).toLocaleString('en-KE')}</div>
        </div>
        <div className='bg-white border rounded shadow p-4'>
          <div className='text-xs text-gray-500'>Total Inflow</div>
          <div className='text-2xl font-semibold'>KSh {Number(data.totals.inflow).toLocaleString('en-KE')}</div>
        </div>
        <div className='bg-white border rounded shadow p-4'>
          <div className='text-xs text-gray-500'>Total Outflow</div>
          <div className='text-2xl font-semibold'>KSh {Number(data.totals.outflow).toLocaleString('en-KE')}</div>
        </div>
        <div className='bg-white border rounded shadow p-4'>
          <div className='text-xs text-gray-500'>Net</div>
          <div className='text-2xl font-semibold'>KSh {Number(data.totals.net).toLocaleString('en-KE')}</div>
        </div>
      </div>

      <div className='bg-white border rounded shadow p-4'>
        <div className='flex items-center justify-between mb-3'>
          <div className='flex items-center gap-2'>
            <label className='text-sm text-gray-600'>From</label>
            <input type='date' value={fromDate} onChange={e=>setFromDate(e.target.value)} className='border rounded p-2 text-sm' />
            <label className='text-sm text-gray-600'>To</label>
            <input type='date' value={toDate} onChange={e=>setToDate(e.target.value)} className='border rounded p-2 text-sm' />
            <button className='border rounded px-3 py-2 text-sm' onClick={() => fetchData(fromDate || undefined, toDate || undefined)}>Apply</button>
          </div>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <div className='text-sm text-gray-600 mb-2'>Daily Inflow vs Outflow</div>
            <Line data={lineData} height={120} />
          </div>
          <div>
            <div className='text-sm text-gray-600 mb-2'>Daily Net</div>
            <Bar data={barData} height={120} />
          </div>
        </div>
      </div>

      <div className='bg-white border rounded shadow p-4'>
        <div className='text-sm text-gray-600 mb-3'>Details</div>
        <div className='overflow-auto'>
          <table className='min-w-full text-sm'>
            <thead>
              <tr className='bg-gray-50 text-gray-600'>
                <th className='text-left font-medium px-3 py-2 border-b'>Date</th>
                <th className='text-right font-medium px-3 py-2 border-b'>Inflow</th>
                <th className='text-right font-medium px-3 py-2 border-b'>Outflow</th>
                <th className='text-right font-medium px-3 py-2 border-b'>Net</th>
              </tr>
            </thead>
            <tbody>
              {data.series.length === 0 ? (
                <tr><td className='text-center text-gray-500 py-10' colSpan={4}>No data</td></tr>
              ) : data.series.map((r, i) => (
                <tr key={i} className='border-b'>
                  <td className='px-3 py-2'>{r.date}</td>
                  <td className='px-3 py-2 text-right'>KSh {Number(r.inflow).toLocaleString('en-KE')}</td>
                  <td className='px-3 py-2 text-right'>KSh {Number(r.outflow).toLocaleString('en-KE')}</td>
                  <td className='px-3 py-2 text-right'>KSh {Number(r.net).toLocaleString('en-KE')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
