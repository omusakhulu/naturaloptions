'use client'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'react-toastify'

export default function QuotationsListPage() {
  const { lang } = useParams()
  const router = useRouter()

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [entries, setEntries] = useState('All')
  const [showColMenu, setShowColMenu] = useState(false)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, pages: 1 })
  const [filterStatus, setFilterStatus] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')

  const [columns, setColumns] = useState([
    { key: 'date', label: 'Date', visible: true },
    { key: 'referenceNo', label: 'Reference No', visible: true },
    { key: 'customer', label: 'Customer name', visible: true },
    { key: 'status', label: 'Status', visible: true },
    { key: 'totalItems', label: 'Total Items', visible: true },
    { key: 'totalPayable', label: 'Total Payable', visible: true },
    { key: 'action', label: 'Action', visible: true }
  ])

  const fetchQuotations = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '20')
      if (filterStatus) params.set('status', filterStatus)

      const res = await fetch(`/api/quotations?${params}`)
      const data = await res.json()

      if (res.ok && data.items) {
        const mapped = data.items.map(q => {
          let itemCount = 0
          try {
            const items = JSON.parse(q.lineItems || '[]')
            itemCount = Array.isArray(items) ? items.length : 0
          } catch { /* ignore */ }

          return {
            id: q.id,
            date: new Date(q.saleDate).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' }),
            referenceNo: q.quotationNumber,
            customer: q.customerName || 'Walk-in Customer',
            status: q.status || 'Draft',
            totalItems: itemCount,
            totalPayable: parseFloat(q.totalPayable) || 0,
            raw: q
          }
        })

        // Apply date filters client-side
        let filtered = mapped
        if (filterFrom) {
          const from = new Date(filterFrom)
          filtered = filtered.filter(r => new Date(r.raw.saleDate) >= from)
        }
        if (filterTo) {
          const to = new Date(filterTo)
          to.setHours(23, 59, 59, 999)
          filtered = filtered.filter(r => new Date(r.raw.saleDate) <= to)
        }

        setRows(filtered)
        setPagination(data.pagination || { total: 0, pages: 1 })
      } else {
        toast.error(data.error || 'Failed to load quotations')
      }
    } catch (err) {
      console.error('Error fetching quotations:', err)
      toast.error('Failed to load quotations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuotations()
  }, [page, filterStatus])

  const handleApplyFilters = () => {
    setPage(1)
    fetchQuotations()
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this quotation?')) return
    try {
      const res = await fetch(`/api/quotations?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Quotation deleted')
        fetchQuotations()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to delete')
      }
    } catch {
      toast.error('Failed to delete quotation')
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = rows
    if (q) {
      list = rows.filter(r =>
        ['date', 'referenceNo', 'customer', 'status']
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
    const header = visibleCols.filter(c => c.key !== 'action').map(c => c.label).join(',')
    const lines = filtered.map(r =>
      visibleCols.filter(c => c.key !== 'action').map(c => JSON.stringify(r[c.key] ?? '')).join(',')
    )
    const csv = [header, ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'quotations.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const getStatusBadge = (status) => {
    const colors = {
      Draft: 'bg-gray-100 text-gray-700',
      Pending: 'bg-yellow-100 text-yellow-700',
      Sent: 'bg-blue-100 text-blue-700',
      Accepted: 'bg-green-100 text-green-700',
      Declined: 'bg-red-100 text-red-700'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className='p-8 space-y-4'>
      <h1 className='text-2xl font-semibold'>List Quotations</h1>

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
              <input type='date' value={filterFrom} onChange={e => setFilterFrom(e.target.value)} className='border rounded p-2 w-full' />
            </div>
            <div>
              <label className='block text-xs text-gray-500 mb-1'>To</label>
              <input type='date' value={filterTo} onChange={e => setFilterTo(e.target.value)} className='border rounded p-2 w-full' />
            </div>
            <div>
              <label className='block text-xs text-gray-500 mb-1'>Status</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className='border rounded p-2 w-full'>
                <option value=''>All</option>
                <option>Draft</option>
                <option>Pending</option>
                <option>Sent</option>
                <option>Accepted</option>
                <option>Declined</option>
              </select>
            </div>
            <div className='flex items-end'>
              <button onClick={handleApplyFilters} className='bg-blue-600 text-white px-4 py-2 rounded text-sm'>Apply</button>
            </div>
          </div>
        )}
      </div>

      <div className='bg-white border rounded shadow p-4 relative'>
        <div className='flex flex-wrap items-center justify-between gap-3 mb-3'>
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
            <button onClick={() => window.print()} className='border rounded px-3 py-1 text-sm'>Print</button>
            <div className='relative'>
              <button onClick={() => setShowColMenu(s => !s)} className='border rounded px-3 py-1 text-sm'>Column visibility</button>
              {showColMenu && (
                <div className='absolute z-10 mt-2 bg-white border rounded shadow p-3 w-56 right-0'>
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
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder='Search ...'
              className='border rounded p-2 text-sm'
            />
            <a href={`/${lang}/apps/sell/quotations/add`} className='bg-indigo-600 hover:bg-indigo-700 text-white rounded px-4 py-2 text-sm whitespace-nowrap'>+ Add Quotation</a>
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
              {loading ? (
                <tr>
                  <td colSpan={visibleCols.length} className='text-center py-10 text-gray-500'>
                    <div className='flex flex-col items-center gap-2'>
                      <i className='tabler-loader animate-spin text-2xl' />
                      <span>Loading quotations...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={visibleCols.length} className='text-center text-gray-500 py-10'>No quotations found</td>
                </tr>
              ) : (
                filtered.map(r => (
                  <tr key={r.id} className='border-b hover:bg-gray-50 transition-colors'>
                    {visibleCols.map(c => (
                      <td key={c.key} className='px-3 py-2'>
                        {c.key === 'action' ? (
                          <div className='flex items-center gap-2'>
                            <button
                              onClick={() => router.push(`/${lang}/apps/sell/quotations/${r.id}`)}
                              className='text-blue-600 hover:text-blue-800'
                              title='View / Edit'
                            >
                              <i className='tabler-eye text-lg' />
                            </button>
                            <button
                              onClick={() => handleDelete(r.id)}
                              className='text-red-600 hover:text-red-800'
                              title='Delete'
                            >
                              <i className='tabler-trash text-lg' />
                            </button>
                          </div>
                        ) : c.key === 'status' ? (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(r.status)}`}>
                            {r.status}
                          </span>
                        ) : c.key === 'totalPayable' ? (
                          `KSh ${Number(r.totalPayable).toLocaleString('en-KE')}`
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

        <div className='flex items-center justify-between mt-3'>
          <span className='text-xs text-gray-500'>
            {pagination.total} quotation{pagination.total !== 1 ? 's' : ''} total
          </span>
          <div className='flex items-center gap-2'>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className='border rounded px-3 py-1 text-sm text-gray-600 disabled:opacity-50'
            >
              Previous
            </button>
            <span className='text-sm text-gray-600'>Page {page} of {pagination.pages || 1}</span>
            <button
              onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
              disabled={page >= pagination.pages}
              className='border rounded px-3 py-1 text-sm text-gray-600 disabled:opacity-50'
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
