'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

export default function TrialBalancePage() {
  const [rows, setRows] = useState([])
  const [totals, setTotals] = useState({ debit: 0, credit: 0 })
  const [difference, setDifference] = useState(0)
  const [search, setSearch] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const fetchAll = async (params = {}) => {
    const qp = new URLSearchParams()
    if (params.after) qp.set('after', params.after)
    if (params.before) qp.set('before', params.before)
    const url = `/api/accounting/trial-balance${qp.toString() ? `?${qp.toString()}` : ''}`
    const res = await fetch(url)
    const json = await res.json()
    setRows(json.items || [])
    setTotals(json.totals || { debit: 0, credit: 0 })
    setDifference(json.difference || 0)
  }

  useEffect(() => { fetchAll() }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(r => [r.accountName, r.accountCode, r.accountType].some(x => String(x || '').toLowerCase().includes(q)))
  }, [rows, search])

  // Group by account type with subtotals
  const grouped = useMemo(() => {
    const m = new Map()
    for (const r of filtered) {
      const key = r.accountType || 'Other'
      if (!m.has(key)) m.set(key, [])
      m.get(key).push(r)
    }
    const groups = Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]))
    const withTotals = groups.map(([type, items]) => {
      const subtotal = items.reduce((s, it) => ({ debit: s.debit + it.debit, credit: s.credit + it.credit, balance: s.balance + it.balance }), { debit: 0, credit: 0, balance: 0 })
      return { type, items, subtotal }
    })
    return withTotals
  }, [filtered])

  const chartData = useMemo(() => ({
    labels: filtered.map(r => r.accountName),
    datasets: [
      { label: 'Debit', data: filtered.map(r => r.debit), backgroundColor: '#22c55e' },
      { label: 'Credit', data: filtered.map(r => r.credit), backgroundColor: '#ef4444' }
    ]
  }), [filtered])

  const exportCsv = () => {
    const rowsFlat = grouped.flatMap(g => g.items.map(r => ({ group: g.type, ...r })))
    const header = ['Group','Code','Account','Type','Debit','Credit','Balance']
    const lines = rowsFlat.map(r => [r.group, r.accountCode || '', r.accountName, r.accountType || '', r.debit, r.credit, r.balance]
      .map(v => JSON.stringify(v ?? '')).join(','))
    const csv = [header.join(','), ...lines, '', `Totals,,,,${totals.debit},${totals.credit},${difference}`].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'trial-balance.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportPdf = () => {
    // Use browser print to PDF
    window.print()
  }

  return (
    <div className='p-8 space-y-6'>
      <h1 className='text-2xl font-semibold'>Trial Balance</h1>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <div className='bg-white border rounded shadow p-4'>
          <div className='text-xs text-gray-500'>Total Debit</div>
          <div className='text-2xl font-semibold'>KSh {Number(totals.debit).toLocaleString('en-KE')}</div>
        </div>
        <div className='bg-white border rounded shadow p-4'>
          <div className='text-xs text-gray-500'>Total Credit</div>
          <div className='text-2xl font-semibold'>KSh {Number(totals.credit).toLocaleString('en-KE')}</div>
        </div>
        <div className={`bg-white border rounded shadow p-4 ${difference === 0 ? '' : 'ring-2 ring-red-400'}`}>
          <div className='text-xs text-gray-500'>Difference (Debit - Credit)</div>
          <div className='text-2xl font-semibold'>KSh {Number(difference).toLocaleString('en-KE')}</div>
        </div>
      </div>

      <div className='bg-white border rounded shadow p-4'>
        <div className='flex items-center justify-between mb-3'>
          <div className='flex items-center gap-2'>
            <button className='text-sm' onClick={() => setFiltersOpen(o => !o)}><i className='tabler-filter' /> Filters</button>
            <button onClick={exportCsv} className='border rounded px-3 py-1 text-sm'>Export CSV</button>
            <button onClick={exportPdf} className='border rounded px-3 py-1 text-sm'>Export PDF</button>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder='Search accounts…' className='border rounded p-2 text-sm' />
        </div>
        {filtersOpen && (
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-4'>
            <div>
              <label className='block text-xs text-gray-500 mb-1'>From</label>
              <input type='date' value={fromDate} onChange={e=>setFromDate(e.target.value)} className='border rounded p-2 w-full' />
            </div>
            <div>
              <label className='block text-xs text-gray-500 mb-1'>To</label>
              <input type='date' value={toDate} onChange={e=>setToDate(e.target.value)} className='border rounded p-2 w-full' />
            </div>
            <div>
              <label className='block text-xs text-gray-500 mb-1'>Account Type</label>
              <input className='border rounded p-2 w-full' placeholder='All' />
            </div>
            <div className='flex items-end'>
              <button className='border rounded px-3 py-2 text-sm' onClick={() => fetchAll({ after: fromDate || undefined, before: toDate || undefined })}>Apply</button>
            </div>
          </div>
        )}
        <div className='overflow-auto'>
          <table className='min-w-full text-sm'>
            <thead>
              <tr className='bg-gray-50 text-gray-600'>
                <th className='text-left font-medium px-3 py-2 border-b'>Code</th>
                <th className='text-left font-medium px-3 py-2 border-b'>Account</th>
                <th className='text-left font-medium px-3 py-2 border-b'>Type</th>
                <th className='text-right font-medium px-3 py-2 border-b'>Debit</th>
                <th className='text-right font-medium px-3 py-2 border-b'>Credit</th>
                <th className='text-right font-medium px-3 py-2 border-b'>Balance</th>
              </tr>
            </thead>
            <tbody>
              {grouped.length === 0 ? (
                <tr>
                  <td colSpan={6} className='text-center text-gray-500 py-10'>No data available</td>
                </tr>
              ) : (
                grouped.map(group => (
                  <>
                    <tr key={`h-${group.type}`} className='bg-gray-100'>
                      <td colSpan={6} className='px-3 py-2 font-medium'>{group.type}</td>
                    </tr>
                    {group.items.map((r, i) => (
                      <tr key={`${group.type}-${i}`} className='border-b'>
                        <td className='px-3 py-2'>{r.accountCode || '-'}</td>
                        <td className='px-3 py-2'>
                          <a className='text-indigo-600 hover:underline' href={`/en/apps/accounting/journal-entries?accountId=${encodeURIComponent(r.accountId)}`}>{r.accountName}</a>
                        </td>
                        <td className='px-3 py-2'>{r.accountType}</td>
                        <td className='px-3 py-2 text-right'>KSh {Number(r.debit).toLocaleString('en-KE')}</td>
                        <td className='px-3 py-2 text-right'>KSh {Number(r.credit).toLocaleString('en-KE')}</td>
                        <td className='px-3 py-2 text-right'>KSh {Number(r.balance).toLocaleString('en-KE')}</td>
                      </tr>
                    ))}
                    <tr key={`t-${group.type}`} className='bg-gray-50'>
                      <td className='px-3 py-2 font-medium' colSpan={3}>Subtotal — {group.type}</td>
                      <td className='px-3 py-2 text-right font-medium'>KSh {Number(group.subtotal.debit).toLocaleString('en-KE')}</td>
                      <td className='px-3 py-2 text-right font-medium'>KSh {Number(group.subtotal.credit).toLocaleString('en-KE')}</td>
                      <td className='px-3 py-2 text-right font-medium'>KSh {Number(group.subtotal.balance).toLocaleString('en-KE')}</td>
                    </tr>
                  </>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className='bg-gray-50 text-gray-700'>
                <td className='px-3 py-2 font-medium' colSpan={3}>Totals:</td>
                <td className='px-3 py-2 text-right font-medium'>KSh {Number(totals.debit).toLocaleString('en-KE')}</td>
                <td className='px-3 py-2 text-right font-medium'>KSh {Number(totals.credit).toLocaleString('en-KE')}</td>
                <td className='px-3 py-2 text-right font-medium'>KSh {Number(difference).toLocaleString('en-KE')}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className='bg-white border rounded shadow p-4'>
        <div className='text-sm text-gray-600 mb-2'>Debits vs Credits</div>
        <Bar data={chartData} height={120} />
      </div>
    </div>
  )
}
