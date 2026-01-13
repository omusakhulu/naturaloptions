'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'react-toastify'

export default function PurchaseReturnsPage() {
  const router = useRouter()
  const { lang } = useParams()
  const [filterOpen, setFilterOpen] = useState(true)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchPurchaseReturns = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/returns/purchase', { cache: 'no-store' })
      const result = await res.json()
      
      if (res.ok && result.items) {
        setData(result.items)
      } else {
        toast.error(result.error || 'Failed to load purchase returns')
      }
    } catch (error) {
      console.error('Error fetching purchase returns:', error)
      toast.error('Failed to load purchase returns')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this purchase return?')) return

    try {
      const res = await fetch(`/api/returns/purchase?id=${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Purchase return deleted successfully')
        fetchPurchaseReturns()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to delete purchase return')
      }
    } catch (error) {
      console.error('Error deleting purchase return:', error)
      toast.error('An error occurred while deleting')
    }
  }

  useEffect(() => {
    fetchPurchaseReturns()
  }, [])

  return (
    <div className='p-8 space-y-6'>
      <h1 className='text-2xl font-semibold'>Purchase Return</h1>

      {/* Filters */}
      <div className='bg-white border rounded'>
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className='flex items-center px-4 py-2 w-full text-left font-medium'
        >
          <i className='tabler-filter mr-2' /> Filters
        </button>
        {filterOpen && (
          <div className='px-4 pb-4'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
              <div>
                <label className='text-sm'>Payment Status</label>
                <select className='w-full border p-2 rounded text-sm'>
                  <option value=''>All</option>
                  <option value='received'>Received</option>
                  <option value='pending'>Pending</option>
                </select>
              </div>
            </div>
            <button className='bg-blue-600 text-white px-4 py-2 rounded'>Apply</button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className='bg-white border rounded shadow p-4'>
        <div className='flex justify-between items-center mb-4'>
          <div className='space-x-2 text-sm'>
            {['Export CSV', 'Export Excel', 'Print', 'Column visibility', 'Export PDF'].map(b => (
              <button key={b} className='border px-2 py-1 rounded'>{b}</button>
            ))}
          </div>
          <div className='flex items-center space-x-2'>
            <input placeholder='Search…' className='border p-2 rounded text-sm' />
            <button 
              onClick={() => router.push(`/${lang}/apps/purchases/returns/add`)} 
              className='bg-purple-600 text-white px-4 py-2 rounded flex items-center'
            >
              <i className='tabler-plus mr-1' /> Add
            </button>
          </div>
        </div>
        <div className='overflow-x-auto'>
          <table className='min-w-full text-sm border'>
            <thead className='bg-gray-100'>
              <tr>
                {['Date','Reference No','Parent Purchase','Location','Supplier','Payment Status','Grand Total','Payment due','Action'].map(h=> (
                  <th key={h} className='border px-2 py-1'>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className='text-center p-8 text-gray-500'>
                    <div className='flex flex-col items-center gap-2'>
                      <i className='tabler-loader animate-spin text-2xl' />
                      <span>Loading purchase returns...</span>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={9} className='text-center p-4'>No data available in table</td>
                </tr>
              ) : (
                data.map(r => (
                  <tr key={r.id} className='odd:bg-gray-50 hover:bg-gray-100 transition-colors'>
                    <td className='border px-2 py-1'>{new Date(r.date).toLocaleDateString()}</td>
                    <td className='border px-2 py-1 font-medium'>PR-{r.id.slice(-6).toUpperCase()}</td>
                    <td className='border px-2 py-1'>{r.purchaseOrderId || 'N/A'}</td>
                    <td className='border px-2 py-1'>{r.warehouseId || 'Main Store'}</td>
                    <td className='border px-2 py-1'>{r.vendor?.name}</td>
                    <td className='border px-2 py-1 text-center'>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success`}>
                        Completed
                      </span>
                    </td>
                    <td className='border px-2 py-1 text-right'>
                      Ksh {parseFloat(r.amount).toLocaleString()}
                    </td>
                    <td className='border px-2 py-1 text-right'>Ksh 0.00</td>
                    <td className='border px-2 py-1 text-center'>
                      <div className='flex items-center justify-center gap-2'>
                        <button 
                          className='text-primary hover:text-primary-dark transition-colors'
                          title='View'
                        >
                          <i className='tabler-eye text-lg' />
                        </button>
                        <button 
                          onClick={() => handleDelete(r.id)}
                          className='text-error hover:text-error-dark transition-colors'
                          title='Delete'
                        >
                          <i className='tabler-trash text-lg' />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

