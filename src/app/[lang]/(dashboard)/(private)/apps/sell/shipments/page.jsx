'use client'
import { useMemo, useState } from 'react'

export default function ShipmentsPage() {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [entries, setEntries] = useState('All')
  const [showColMenu, setShowColMenu] = useState(false)

  const [columns, setColumns] = useState([
    { key: 'action', label: 'Action', visible: true },
    { key: 'date', label: 'Date', visible: true },
    { key: 'invoiceNo', label: 'Invoice No.', visible: true },
    { key: 'customer', label: 'Customer name', visible: true },
    { key: 'contact', label: 'Contact Number', visible: true },
    { key: 'location', label: 'Location', visible: true },
    { key: 'deliveryPerson', label: 'Delivery Person', visible: true },
    { key: 'shippingStatus', label: 'Shipping Status', visible: true },
    { key: 'paymentStatus', label: 'Payment Status', visible: true }
  ])

  const [rows] = useState([
    { date:'10/01/2025 14:15', invoiceNo:'2786', customer:'Youth Clock', contact:'821037033016', location:'NATURAL OPTIONS', deliveryPerson:'FATMA', shippingStatus:'Delivered', paymentStatus:'Partial' },
    { date:'02/05/2025 04:53', invoiceNo:'1098', customer:'FATMA ABDALLAH', contact:'0721540741', location:'NATURAL OPTIONS', deliveryPerson:'', shippingStatus:'Ordered', paymentStatus:'Paid' }
  ])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = rows
    if (q) {
      list = rows.filter(r =>
        ['date','invoiceNo','customer','contact','location','deliveryPerson','shippingStatus','paymentStatus']
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

  const toggleColumn = key => setColumns(prev => prev.map(c => (c.key === key ? { ...c, visible: !c.visible } : c)))

  const downloadCsv = () => {
    const header = visibleCols.map(c => c.label).join(',')
    const lines = filtered.map(r => visibleCols.map(c => JSON.stringify(r[c.key] ?? '')).join(','))
    const csv = [header, ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'shipments.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className='p-8 space-y-4'>
      <h1 className='text-2xl font-semibold'>Shipments</h1>

      {/* Filters */}
      <div className='bg-white border rounded shadow'>
        <button
          className='w-full text-left p-3 flex items-center gap-2 text-gray-700'
          onClick={() => setFiltersOpen(o => !o)}
        >
          <i className='tabler-filter' /> Filters
          <span className='ml-auto text-xs text-gray-500'>{filtersOpen ? 'Hide' : 'Show'}</span>
        </button>
        {filtersOpen && (
          <div className='px-4 pb-4 grid grid-cols-1 md:grid-cols-4 gap-4'>
            <div>
              <label className='block text-xs text-gray-500 mb-1'>From</label>
              <input type='date' className='border rounded p-2 w-full' />
            </div>
            <div>
              <label className='block text-xs text-gray-500 mb-1'>To</label>
              <input type='date' className='border rounded p-2 w-full' />
            </div>
            <div>
              <label className='block text-xs text-gray-500 mb-1'>Shipping Status</label>
              <select className='border rounded p-2 w-full'>
                <option value=''>All</option>
                <option>Ordered</option>
                <option>Dispatched</option>
                <option>Delivered</option>
              </select>
            </div>
            <div>
              <label className='block text-xs text-gray-500 mb-1'>Payment Status</label>
              <select className='border rounded p-2 w-full'>
                <option value=''>All</option>
                <option>Paid</option>
                <option>Partial</option>
                <option>Due</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Table card */}
      <div className='bg-white border rounded shadow p-4 relative'>
        <div className='flex flex-wrap items-center gap-3 mb-3'>
          <div className='flex items-center gap-2'>
            <span className='text-sm text-gray-600'>Show</span>
            <select
              className='border rounded p-1 text-sm'
              value={entries}
              onChange={e => setEntries(e.target.value)}
            >
              {['All', '10', '25', '50', '100'].map(v => (
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
          </div>

          <div className='ml-auto'>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder='Search ...'
              className='border rounded p-2 text-sm'
            />
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
                      <td key={c.key} className='px-3 py-2'>
                        {c.key === 'shippingStatus' ? (
                          <span className={`px-2 py-1 rounded text-xs ${r.shippingStatus === 'Delivered' ? 'bg-green-100 text-green-700' : r.shippingStatus === 'Ordered' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-700'}`}>{r.shippingStatus}</span>
                        ) : c.key === 'paymentStatus' ? (
                          <span className={`px-2 py-1 rounded text-xs ${r.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : r.paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{r.paymentStatus}</span>
                        ) : (
                          String(r[c.key] ?? '')
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className='flex items-center justify-end gap-2 mt-3'>
          <button className='border rounded px-3 py-1 text-sm text-gray-600' disabled>Previous</button>
          <button className='border rounded px-3 py-1 text-sm text-gray-600' disabled>Next</button>
        </div>
      </div>
    </div>
  )
}
