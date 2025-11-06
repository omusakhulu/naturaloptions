'use client'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'

export default function POSListPage() {
  const { lang } = useParams()

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [entries, setEntries] = useState('All')
  const [showColMenu, setShowColMenu] = useState(false)
  const [loading, setLoading] = useState(false)

  const [columns, setColumns] = useState([
    { key: 'action', label: 'Action', visible: true },
    { key: 'date', label: 'Date', visible: true },
    { key: 'invoiceNo', label: 'Invoice No.', visible: true },
    { key: 'customer', label: 'Customer name', visible: true },
    { key: 'contact', label: 'Contact Number', visible: true },
    { key: 'location', label: 'Location', visible: true },
    { key: 'paymentStatus', label: 'Payment Status', visible: true },
    { key: 'paymentMethod', label: 'Payment Method', visible: true },
    { key: 'totalAmount', label: 'Total amount', visible: true },
    { key: 'totalPaid', label: 'Total paid', visible: true },
    { key: 'sellDue', label: 'Sell Due', visible: true },
    { key: 'sellReturnDue', label: 'Sell Return Due', visible: true },
    { key: 'shippingStatus', label: 'Shipping Status', visible: true },
    { key: 'totalItems', label: 'Total Items', visible: true }
  ])

  const [rows, setRows] = useState([
    { date:'11/05/2025', invoiceNo:'3058', customer:'NATURAL OPTIONS', contact:'00', location:'NATURAL OPTIONS', paymentStatus:'Paid', paymentMethod:'Cash', totalAmount:2200, totalPaid:2200, sellDue:0, sellReturnDue:0, shippingStatus:'', totalItems:3 },
    { date:'11/05/2025', invoiceNo:'3057', customer:'NATURAL OPTIONS', contact:'00', location:'NATURAL OPTIONS', paymentStatus:'Paid', paymentMethod:'MPESA', totalAmount:2700, totalPaid:2700, sellDue:0, sellReturnDue:0, shippingStatus:'', totalItems:5 },
    { date:'11/05/2025', invoiceNo:'3056', customer:'NATURAL OPTIONS', contact:'00', location:'NATURAL OPTIONS', paymentStatus:'Paid', paymentMethod:'MPESA', totalAmount:2700, totalPaid:2700, sellDue:0, sellReturnDue:0, shippingStatus:'', totalItems:2 },
    { date:'11/05/2025', invoiceNo:'3055', customer:'NATURAL OPTIONS', contact:'00', location:'NATURAL OPTIONS', paymentStatus:'Paid', paymentMethod:'MPESA', totalAmount:3560, totalPaid:3560, sellDue:0, sellReturnDue:0, shippingStatus:'', totalItems:4 },
    { date:'11/05/2025', invoiceNo:'3054', customer:'NATURAL OPTIONS', contact:'00', location:'NATURAL OPTIONS', paymentStatus:'Paid', paymentMethod:'MPESA', totalAmount:2700, totalPaid:2700, sellDue:0, sellReturnDue:0, shippingStatus:'', totalItems:1 },
    { date:'11/05/2025', invoiceNo:'3053', customer:'NATURAL OPTIONS', contact:'00', location:'NATURAL OPTIONS', paymentStatus:'Paid', paymentMethod:'Card', totalAmount:1500, totalPaid:1500, sellDue:0, sellReturnDue:0, shippingStatus:'', totalItems:2 },
    { date:'11/04/2025', invoiceNo:'3051', customer:'NATURAL OPTIONS', contact:'00', location:'NATURAL OPTIONS', paymentStatus:'Partial', paymentMethod:'Cash', totalAmount:5200, totalPaid:3000, sellDue:2200, sellReturnDue:0, shippingStatus:'', totalItems:6 },
    { date:'11/04/2025', invoiceNo:'3050', customer:'NATURAL OPTIONS', contact:'00', location:'NATURAL OPTIONS', paymentStatus:'Due', paymentMethod:'MPESA', totalAmount:2200, totalPaid:0, sellDue:2200, sellReturnDue:0, shippingStatus:'', totalItems:1 }
  ])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/sell/pos?perPage=100&maxPages=3')
        const data = await res.json()
        if (!cancelled && Array.isArray(data?.items) && data.items.length > 0) {
          setRows(data.items)
        }
      } catch (e) {
        console.error(e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = rows
    if (q) {
      list = rows.filter(r =>
        ['date','invoiceNo','customer','contact','location','paymentStatus','paymentMethod','shippingStatus']
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

  const totals = useMemo(() => {
    const sum = key => filtered.reduce((s, r) => s + (parseFloat(r[key] ?? 0) || 0), 0)
    const countBy = (key, value) => filtered.filter(r => r[key] === value).length
    return {
      totalAmount: sum('totalAmount'),
      totalPaid: sum('totalPaid'),
      sellDue: sum('sellDue'),
      sellReturnDue: sum('sellReturnDue'),
      totalItems: sum('totalItems'),
      statusPaid: countBy('paymentStatus','Paid'),
      statusDue: countBy('paymentStatus','Due'),
      statusPartial: countBy('paymentStatus','Partial'),
      pmCash: countBy('paymentMethod','Cash'),
      pmMpesa: countBy('paymentMethod','MPESA'),
      pmCard: countBy('paymentMethod','Card'),
      pmMultiple: countBy('paymentMethod','Multiple Pay'),
      pmBank: countBy('paymentMethod','Bank Transfer')
    }
  }, [filtered])

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
    a.download = 'pos-sales.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className='p-8 space-y-4'>
      <h1 className='text-2xl font-semibold'>POS</h1>

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
              <label className='block text-xs text-gray-500 mb-1'>Payment Status</label>
              <select className='border rounded p-2 w-full'>
                <option value=''>All</option>
                <option>Paid</option>
                <option>Partial</option>
                <option>Due</option>
              </select>
            </div>
            <div>
              <label className='block text-xs text-gray-500 mb-1'>Payment Method</label>
              <select className='border rounded p-2 w-full'>
                <option value=''>All</option>
                <option>Cash</option>
                <option>MPESA</option>
                <option>Card</option>
                <option>Multiple Pay</option>
                <option>Bank Transfer</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className='bg-white border rounded shadow p-4 relative'>
        {loading && (
          <div className='absolute inset-0 bg-white/40 flex items-center justify-center text-sm'>Processing...</div>
        )}
        <div className='flex items-center justify-between mb-3'>
          <h3 className='font-medium'>List POS</h3>
          <div className='flex items-center gap-2'>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder='Search ...'
              className='border rounded p-2 text-sm'
            />
            <a href={`/${lang}/apps/sell/add`} className='bg-indigo-600 hover:bg-indigo-700 text-white rounded px-4 py-2 text-sm'>+ Add</a>
          </div>
        </div>

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
                        {c.key === 'paymentStatus' ? (
                          <span className={`px-2 py-1 rounded text-xs ${r.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : r.paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                            {r.paymentStatus}
                          </span>
                        ) : c.key === 'totalAmount' || c.key === 'totalPaid' || c.key === 'sellDue' || c.key === 'sellReturnDue' ? (
                          `KSh ${Number(r[c.key] || 0).toLocaleString('en-KE')}`
                        ) : (
                          String(r[c.key] ?? '')
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className='bg-gray-50 text-gray-700'>
                {visibleCols.map((c, i) => (
                  <td key={c.key} className={`px-3 py-2 font-medium ${i === 0 ? 'w-[140px]' : ''}`}>
                    {i === 0 ? 'Total:' : (
                      c.key === 'totalAmount' ? `KSh ${totals.totalAmount.toLocaleString('en-KE')}` :
                      c.key === 'totalPaid' ? `KSh ${totals.totalPaid.toLocaleString('en-KE')}` :
                      c.key === 'sellDue' ? `KSh ${totals.sellDue.toLocaleString('en-KE')}` :
                      c.key === 'sellReturnDue' ? `KSh ${totals.sellReturnDue.toLocaleString('en-KE')}` :
                      c.key === 'totalItems' ? totals.totalItems : ''
                    )}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 text-sm'>
          <div className='bg-gray-50 rounded p-3'>
            <div className='font-medium mb-1'>Status</div>
            <div className='space-y-1 text-gray-700'>
              <div>Paid - {totals.statusPaid}</div>
              <div>Due - {totals.statusDue}</div>
              <div>Partial - {totals.statusPartial}</div>
            </div>
          </div>
          <div className='bg-gray-50 rounded p-3'>
            <div className='font-medium mb-1'>Payment Methods</div>
            <div className='grid grid-cols-2 gap-2 text-gray-700'>
              <div>Cash - {totals.pmCash}</div>
              <div>MPESA - {totals.pmMpesa}</div>
              <div>Card - {totals.pmCard}</div>
              <div>Multiple Pay - {totals.pmMultiple}</div>
              <div>Bank Transfer - {totals.pmBank}</div>
            </div>
          </div>
          <div className='bg-gray-50 rounded p-3'>
            <div className='font-medium mb-1'>Amounts</div>
            <div className='space-y-1 text-gray-700'>
              <div>Total amount: KSh {totals.totalAmount.toLocaleString('en-KE')}</div>
              <div>Total paid: KSh {totals.totalPaid.toLocaleString('en-KE')}</div>
              <div>Sell due: KSh {totals.sellDue.toLocaleString('en-KE')}</div>
              <div>Sell return due: KSh {totals.sellReturnDue.toLocaleString('en-KE')}</div>
            </div>
          </div>
        </div>

        <div className='flex items-center justify-end gap-2 mt-3'>
          <button className='border rounded px-3 py-1 text-sm text-gray-600' disabled>Previous</button>
          <button className='border rounded px-3 py-1 text-sm text-gray-600' disabled>Next</button>
        </div>
      </div>
    </div>
  )
}
