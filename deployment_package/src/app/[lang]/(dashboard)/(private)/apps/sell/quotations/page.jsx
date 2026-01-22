'use client'
import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'

export default function QuotationsListPage() {
  const { lang } = useParams()

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [entries, setEntries] = useState('All')
  const [showColMenu, setShowColMenu] = useState(false)

  const [columns, setColumns] = useState([
    { key: 'date', label: 'Date', visible: true },
    { key: 'referenceNo', label: 'Reference No', visible: true },
    { key: 'customer', label: 'Customer name', visible: true },
    { key: 'contact', label: 'Contact Number', visible: true },
    { key: 'location', label: 'Location', visible: true },
    { key: 'totalItems', label: 'Total Items', visible: true },
    { key: 'addedBy', label: 'Added By', visible: true },
    { key: 'action', label: 'Action', visible: true }
  ])

  const [rows] = useState([])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = rows
    if (q) {
      list = rows.filter(r =>
        ['date','referenceNo','customer','contact','location','addedBy']
          .some(k => String(r[k] || '').toLowerCase().includes(q))
      )
    }
    if (entries !== 'All') {
      const n = parseInt(entries, 10) || 10
      list = list.slice(0, n)
    }
    return list
  }, [rows, search, entries])

  const visibleCols = columns.filter(c => c.visible)

  const toggleColumn = key => {
    setColumns(prev => prev.map(c => (c.key === key ? { ...c, visible: !c.visible } : c)))
  }

  const downloadCsv = () => {
    const header = visibleCols.map(c => c.label).join(',')
    const lines = filtered.map(r => visibleCols.map(c => JSON.stringify(r[c.key] ?? '')).join(','))
    const csv = [header, ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'quotations.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className='p-8 space-y-4'>
      <h1 className='text-2xl font-semibold'>List quotations</h1>

      <div className='bg-white border rounded shadow'>
        <button
          className='w-full text-left p-3 flex items-center gap-2 text-gray-700'
          onClick={() => setFiltersOpen(o => !o)}
        >
          <i className='tabler-filter' /> Filters
          <span className='ml-auto text-xs text-gray-500'>{filtersOpen ? 'Hide' : 'Show'}</span>
        </button>
        {filtersOpen && (
          <div className='px-4 pb-4 grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <label className='block text-xs text-gray-500 mb-1'>From</label>
              <input type='date' className='border rounded p-2 w-full' />
            </div>
            <div>
              <label className='block text-xs text-gray-500 mb-1'>To</label>
              <input type='date' className='border rounded p-2 w-full' />
            </div>
            <div>
              <label className='block text-xs text-gray-500 mb-1'>Status</label>
              <select className='border rounded p-2 w-full'>
                <option value=''>All</option>
                <option>Draft</option>
                <option>Pending</option>
                <option>Sent</option>
                <option>Accepted</option>
                <option>Declined</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className='bg-white border rounded shadow p-4 relative'>
        <div className='flex items-center justify-between mb-3'>
          <div className='flex items-center gap-2'>
            <span className='text-sm text-gray-600'>Show</span>
            <select
              className='border rounded p-1 text-sm'
              value={entries}
              onChange={e => setEntries(e.target.value)}
            >
              {['All','10','25','50','100'].map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
            <span className='text-sm text-gray-600'>entries</span>
          </div>
          <div className='flex items-center gap-2'>
            <button onClick={downloadCsv} className='border rounded px-3 py-1 text-sm'>Export CSV</button>
            <button onClick={downloadCsv} className='border rounded px-3 py-1 text-sm'>Export Excel</button>
            <button onClick={() => window.print()} className='border rounded px-3 py-1 text-sm'>Print</button>
            <div className='relative'>
              <button onClick={() => setShowColMenu(s => !s)} className='border rounded px-3 py-1 text-sm'>Column visibility</button>
              {showColMenu && (
                <div className='absolute z-10 mt-2 bg-white border rounded shadow p-3 w-56'>
                  <div className='text-xs font-medium mb-2'>Toggle columns</div>
                  <div className='space-y-2 max-h-56 overflow-auto'>
                    {columns.map(c => (
                      <label key={c.key} className='flex items-center gap-2 text-sm'>
                        <input type='checkbox' checked={c.visible} onChange={() => toggleColumn(c.key)} />
                        {c.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => window.print()} className='border rounded px-3 py-1 text-sm'>Export PDF</button>
            <div className='ml-2 flex items-center gap-2'>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder='Search ...'
                className='border rounded p-2 text-sm'
              />
              <a href={`/${lang}/apps/sell/quotations/add`} className='bg-indigo-600 hover:bg-indigo-700 text-white rounded px-4 py-2 text-sm'>+ Add Quotation</a>
            </div>
          </div>
        </div>

        <div className='overflow-auto'>
          <table className='min-w-full text-sm'>
            <thead>
              <tr className='bg-gray-50 text-gray-600'>
                {visibleCols.map(c => (
                  <th key={c.key} className='text-left font-medium px-3 py-2 border-b'>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={visibleCols.length} className='text-center text-gray-500 py-10'>No data available in table</td>
                </tr>
              ) : (
                filtered.map((r, idx) => (
                  <tr key={idx} className='border-b'>
                    {visibleCols.map(c => (
                      <td key={c.key} className='px-3 py-2'>{String(r[c.key] ?? '')}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className='flex items-center justify-end gap-2 mt-3'>
          <button className='border rounded px-3 py-1 text-sm text-gray-600' disabled>Previous</button>
          <button className='border rounded px-3 py-1 text-sm text-gray-600' disabled>Next</button>
        </div>
      </div>
    </div>
  )
}
