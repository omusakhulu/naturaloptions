'use client'

import { useEffect, useMemo, useState } from 'react'

import { useSettings } from '@core/hooks/useSettings'

export default function BIInsightsPage() {
  const { updatePageSettings } = useSettings()
  const [days, setDays] = useState(30)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const reset = updatePageSettings({ contentWidth: 'wide' })
    return reset
  }, [updatePageSettings])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch(`/api/bi/insights?days=${days}`, { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))

        if (!res.ok) {
          setData(null)
          setError(json?.error || 'Failed to load BI insights')
          return
        }

        setData(json)
      } catch (e) {
        console.error(e)
        setData(null)
        setError('Failed to load BI insights')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [days])

  const fmtKes = useMemo(
    () => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }),
    []
  )

  const kpis = useMemo(() => {
    const k = data?.kpis
    return [
      { label: 'Revenue', value: k ? fmtKes.format(k.revenue || 0) : '—', color: 'bg-gradient-to-br from-purple-500 to-pink-500' },
      { label: 'Woo Orders', value: k ? k.orders ?? '—' : '—', color: 'bg-gradient-to-br from-blue-500 to-cyan-500' },
      { label: 'POS Revenue', value: k ? fmtKes.format(k.posRevenue || 0) : '—', color: 'bg-gradient-to-br from-emerald-500 to-teal-500' },
      { label: 'POS Transactions', value: k ? k.posTransactions ?? '—' : '—', color: 'bg-gradient-to-br from-indigo-500 to-sky-500' },
      { label: 'Expenses', value: k ? fmtKes.format(k.expenses || 0) : '—', color: 'bg-gradient-to-br from-fuchsia-500 to-rose-500' },
      {
        label: 'Net Revenue',
        value: k ? fmtKes.format(k.netRevenue || 0) : '—',
        color:
          k && typeof k.netRevenue === 'number' && k.netRevenue < 0
            ? 'bg-gradient-to-br from-rose-500 to-pink-500'
            : 'bg-gradient-to-br from-green-500 to-lime-500'
      }
    ]
  }, [data, fmtKes])

  const insights = Array.isArray(data?.insights) ? data.insights : []
  const lowStock = Array.isArray(data?.lowStock) ? data.lowStock : []
  const topCustomers = Array.isArray(data?.topCustomers) ? data.topCustomers : []

  return (
    <div className='p-8 space-y-6'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-semibold'>AI Insights</h1>
          <div className='text-sm text-gray-500'>
            {data?.updatedAt ? `Updated: ${new Date(data.updatedAt).toLocaleString()}` : ''}
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <label className='text-sm text-gray-600'>Range</label>
          <select
            className='border p-2 rounded text-sm'
            value={days}
            onChange={e => setDays(parseInt(e.target.value || '30'))}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last 365 days</option>
          </select>
        </div>
      </div>

      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4'>
        {kpis.map(k => (
          <div key={k.label} className={`text-white rounded p-4 shadow ${k.color}`}>
            <div className='text-sm'>{k.label}</div>
            <div className='text-xl font-semibold'>{k.value}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className='bg-white border rounded p-6'>Loading…</div>
      ) : error ? (
        <div className='bg-white border rounded p-6 text-red-600'>{error}</div>
      ) : (
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <div className='bg-white border rounded shadow p-4'>
            <div className='flex items-center justify-between mb-2'>
              <h2 className='font-medium'>Insights</h2>
              <div className='text-xs text-gray-500'>{insights.length} items</div>
            </div>
            {insights.length === 0 ? (
              <div className='text-sm text-gray-500'>No insights available.</div>
            ) : (
              <div className='space-y-3'>
                {insights.map((i, idx) => (
                  <div key={`${i.title}-${idx}`} className='border rounded p-3'>
                    <div className='flex items-center justify-between'>
                      <div className='font-medium'>{i.title}</div>
                      <div
                        className={`text-xs px-2 py-0.5 rounded ${
                          i.severity === 'warning'
                            ? 'bg-amber-100 text-amber-800'
                            : i.severity === 'success'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {i.severity}
                      </div>
                    </div>
                    <div className='text-sm text-gray-700 mt-1'>{i.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className='bg-white border rounded shadow p-4'>
            <div className='flex items-center justify-between mb-2'>
              <h2 className='font-medium'>Low Stock</h2>
              <div className='text-xs text-gray-500'>{lowStock.length} items</div>
            </div>
            {lowStock.length === 0 ? (
              <div className='text-sm text-gray-500'>No low stock items.</div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='min-w-full text-sm border'>
                  <thead className='bg-gray-100'>
                    <tr>
                      <th className='border px-2 py-1 text-left'>Product</th>
                      <th className='border px-2 py-1 text-left'>SKU</th>
                      <th className='border px-2 py-1 text-right'>Stock</th>
                      <th className='border px-2 py-1 text-right'>Alert</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStock.map(p => (
                      <tr key={p.id} className='odd:bg-gray-50'>
                        <td className='border px-2 py-1'>{p.name}</td>
                        <td className='border px-2 py-1'>{p.sku || ''}</td>
                        <td className='border px-2 py-1 text-right'>{p.actualStock ?? ''}</td>
                        <td className='border px-2 py-1 text-right'>{p.lowStockAlert ?? ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className='bg-white border rounded shadow p-4 lg:col-span-2'>
            <div className='flex items-center justify-between mb-2'>
              <h2 className='font-medium'>Top Customers (POS)</h2>
              <div className='text-xs text-gray-500'>{topCustomers.length} customers</div>
            </div>
            {topCustomers.length === 0 ? (
              <div className='text-sm text-gray-500'>No customers available.</div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='min-w-full text-sm border'>
                  <thead className='bg-gray-100'>
                    <tr>
                      <th className='border px-2 py-1 text-left'>Customer</th>
                      <th className='border px-2 py-1 text-right'>Total Spent</th>
                      <th className='border px-2 py-1 text-right'>Loyalty Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCustomers.map(c => (
                      <tr key={c.id} className='odd:bg-gray-50'>
                        <td className='border px-2 py-1'>{`${c.firstName || ''} ${c.lastName || ''}`.trim() || c.id}</td>
                        <td className='border px-2 py-1 text-right'>
                          {typeof c.totalSpent === 'number' ? c.totalSpent.toFixed(0) : c.totalSpent ?? ''}
                        </td>
                        <td className='border px-2 py-1 text-right'>{c.loyaltyPoints ?? ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
