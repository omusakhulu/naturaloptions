'use client'
import { useEffect, useMemo, useState } from 'react'
import { useSettings } from '@core/hooks/useSettings'
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

export default function BIAnalyticsPage() {
  const { updatePageSettings } = useSettings()
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState('month')

  useEffect(() => {
    const reset = updatePageSettings({ contentWidth: 'wide' })
    return reset
  }, [])

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

  const fmtKes = useMemo(() => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }), [])

  const summary = useMemo(() => {
    if (!metrics) return { avgSale: 0, last7: 0, prev7: 0, growth: 0 }
    const ds = Array.isArray(metrics.dailySales) ? metrics.dailySales : []
    const last7Arr = ds.slice(-7)
    const prev7Arr = ds.slice(-14, -7)
    const last7 = last7Arr.reduce((s, d) => s + (d.total || 0), 0)
    const prev7 = prev7Arr.reduce((s, d) => s + (d.total || 0), 0)
    const growth = prev7 > 0 ? ((last7 - prev7) / prev7) * 100 : 0
    const avgSale = metrics.totalOrders > 0 ? metrics.totalSales / metrics.totalOrders : 0
    return { avgSale, last7, prev7, growth }
  }, [metrics])

  const kpis = useMemo(() => [
    { label: 'Total Revenue', value: metrics ? fmtKes.format(metrics.totalSales) : '—', color: 'bg-gradient-to-br from-purple-500 to-pink-500' },
    { label: 'Total Transactions', value: metrics ? metrics.totalOrders : '—', color: 'bg-gradient-to-br from-blue-500 to-cyan-500' },
    { label: 'Average Sale', value: fmtKes.format(summary.avgSale || 0), color: 'bg-gradient-to-br from-green-500 to-lime-500' },
    { label: 'Growth Rate', value: `${(summary.growth || 0).toFixed(1)}%`, color: (summary.growth || 0) >= 0 ? 'bg-gradient-to-br from-emerald-500 to-teal-500' : 'bg-gradient-to-br from-rose-500 to-pink-500' }
  ], [metrics, fmtKes, summary])

  return (
    <div className='p-8 space-y-6'>
      <div className='flex justify-between items-center'>
        <h1 className='text-2xl font-semibold'>Sales Analytics Dashboard</h1>
        <select value={range} onChange={e=>setRange(e.target.value)} className='border p-2 rounded text-sm'>
          <option value='week'>Last 7 days</option>
          <option value='month'>Last 30 days</option>
          <option value='quarter'>Quarter</option>
          <option value='year'>Year</option>
        </select>
      </div>

      <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
        {kpis.map(k => (
          <div key={k.label} className={`text-white rounded p-4 shadow ${k.color}`}>
            <div className='text-sm'>{k.label}</div>
            <div className='text-xl font-semibold'>{k.value}</div>
          </div>
        ))}
      </div>

      {loading || !metrics ? (
        <p>Loading…</p>
      ) : (
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <div className='bg-white border rounded shadow p-4'>
            <div className='flex items-center justify-between mb-2'>
              <h3 className='font-medium'>Sales Trend (last 30 days)</h3>
              <div className='text-xs text-gray-500'>Total: {fmtKes.format(metrics.totalSales)}</div>
            </div>
            <div className='h-72'>
              <Line
                data={{
                  labels: metrics.dailySales.map(d=>d.date),
                  datasets:[{ label:'Daily Sales', data: metrics.dailySales.map(d=>d.total), fill:false, borderColor:'#6366f1' }]
                }}
                options={{ maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ y:{ beginAtZero:true } } }}
              />
            </div>
          </div>

          <div className='bg-white border rounded shadow p-4'>
            <div className='flex items-center justify-between mb-2'>
              <h3 className='font-medium'>Totals</h3>
              <div className='text-xs text-gray-500'>Orders: {metrics.totalOrders} • Avg Sale: {fmtKes.format(summary.avgSale)}</div>
            </div>
            <div className='h-72'>
              <Bar
                data={{ labels:['Sales','Orders'], datasets:[{ label:'Totals', data:[metrics.totalSales, metrics.totalOrders], backgroundColor:['#10b981','#3b82f6'] }] }}
                options={{ maintainAspectRatio:false, plugins:{legend:{display:false}}, indexAxis:'y' }}
              />
            </div>
          </div>

          <div className='bg-white border rounded shadow p-4 lg:col-span-2'>
            <div className='flex items-center justify-between mb-2'>
              <h3 className='font-medium'>Payment Methods (demo)</h3>
              <div className='text-xs text-gray-500'>Card 45% • Cash 35% • MPesa 20%</div>
            </div>
            <div className='h-80'>
              <Pie
                data={{ labels:['Card','Cash','MPesa'], datasets:[{ data:[45,35,20], backgroundColor:['#3b82f6','#10b981','#f59e0b'] }] }}
                options={{ maintainAspectRatio:false }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
