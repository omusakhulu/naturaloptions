'use client'

import { useState, useEffect } from 'react'
import { Line, Bar, Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  LineElement,
  BarElement,
  PointElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'
ChartJS.register(LineElement, BarElement, PointElement, CategoryScale, LinearScale, ArcElement, Tooltip, Legend)

const kpis = [
  { label: 'Sales', value: 'KSh 153,204', color: 'bg-gradient-to-br from-purple-500 to-pink-500' },
  { label: 'Gross Profit %', value: '42.95%', color: 'bg-gradient-to-br from-pink-500 to-red-500' },
  { label: 'COGS', value: 'KSh 0', color: 'bg-gradient-to-br from-blue-500 to-cyan-500' },
  { label: 'Net Profit', value: 'KSh 111,635', color: 'bg-gradient-to-br from-green-500 to-lime-500' },
  { label: 'Tax', value: 'KSh 4,688', color: 'bg-gradient-to-br from-indigo-500 to-sky-500' },
  { label: 'Returns', value: 'KSh 110', color: 'bg-gradient-to-br from-yellow-500 to-orange-500' },
  { label: 'Expenses', value: 'KSh 820', color: 'bg-gradient-to-br from-teal-500 to-emerald-500' },
  { label: 'Discounts', value: 'KSh 375', color: 'bg-gradient-to-br from-fuchsia-500 to-rose-500' },
]

export default function BIDashboardPage() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState('month')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/bi/metrics')
        const json = await res.json()
        setMetrics(json)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className='p-8 space-y-6'>
      <div className='flex justify-between items-center'>
        <h1 className='text-2xl font-semibold'>Business Intelligence Dashboard</h1>
        <select value={range} onChange={e=>setRange(e.target.value)} className='border p-2 rounded text-sm'>
          <option value='week'>Last 7 days</option>
          <option value='month'>Last 30 days</option>
          <option value='quarter'>Quarter</option>
          <option value='year'>Year</option>
        </select>
      </div>

      {/* KPI cards */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
        {kpis.map(k => (
          <div key={k.label} className={`text-white rounded p-4 shadow ${k.color}`}>
            <div className='text-sm'>{k.label}</div>
            <div className='text-xl font-semibold'>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      {loading || !metrics ? (
        <p>Loading charts…</p>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* Line chart sales trend */}
          <div className='bg-white border rounded shadow p-4'>
            <Line
              data={{
                labels: metrics.dailySales.map(d=>d.date),
                datasets:[{label:'Daily Sales',data:metrics.dailySales.map(d=>d.total),fill:false,borderColor:'#6366f1'}]
              }}
              options={{ plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true}} }}
            />
          </div>

          {/* Bar chart orders vs sales */}
          <div className='bg-white border rounded shadow p-4'>
            <Bar
              data={{
                labels:['Sales','Orders'],
                datasets:[{label:'Totals',data:[metrics.totalSales,metrics.totalOrders],backgroundColor:['#10b981','#3b82f6']}]}}
              options={{ plugins:{legend:{display:false}}, indexAxis:'y' }}
            />
          </div>

          {/* Pie sample payment status placeholder */}
          <div className='bg-white border rounded shadow p-4'>
            <Pie
              data={{
                labels:['Paid','Due','Partial'],
                datasets:[{data:[50,30,20],backgroundColor:['#22c55e','#f97316','#eab308']}]}}
            />
          </div>
        </div>
      )}

      {/* Alerts / insights */}
      <div className='bg-gradient-to-br from-purple-600 to-indigo-600 text-white p-6 rounded shadow'>
        <h2 className='font-semibold mb-2'>AI Personal Insights</h2>
        <ul className='list-disc pl-6 text-sm space-y-1'>
          <li>Sales up 12% week-over-week.</li>
          <li>Low stock alert on 8 fast-moving items.</li>
          <li>High return rate detected on SKU #1234.</li>
          <li>Consider re-ordering from supplier X to maintain inventory levels.</li>
        </ul>
      </div>
    </div>
  )
}
