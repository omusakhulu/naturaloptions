'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'react-toastify'

export default function PurchaseRequisitionPage() {
  const router = useRouter()
  const { lang } = useParams()
  const [filterOpen, setFilterOpen] = useState(true)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchRequisitions = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/purchases/requisitions', { cache: 'no-store' })
      const result = await res.json()

      console.log('Fetch requisitions result:', result)

      if (res.ok && result.requisitions) {
        setData(result.requisitions)
      } else {
        toast.error(result.error || 'Failed to load requisitions')
      }
    } catch (error) {
      console.error('Error fetching requisitions:', error)
      toast.error('Failed to load requisitions')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this requisition?')) return

    try {
      const res = await fetch(`/api/purchases/requisitions?id=${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Requisition deleted successfully')
        fetchRequisitions()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to delete requisition')
      }
    } catch (error) {
      console.error('Error deleting requisition:', error)
      toast.error('An error occurred while deleting')
    }
  }

  useEffect(() => {
    fetchRequisitions()
  }, [])

  return (
    <div className='p-8 space-y-6'>
      <h1 className='text-2xl font-semibold'>Purchase Requisition</h1>
      <p className='text-sm max-w-3xl'>A purchase requisition is a document that an employee creates to request a purchase of goods or services.</p>

      {/* Filters accordion */}
      <div className='bg-white border rounded'>
        <button
          className='flex items-center px-4 py-2 w-full text-left font-medium'
          onClick={() => setFilterOpen(!filterOpen)}
        >
          <i className='tabler-filter mr-2' /> Filters
        </button>
        {filterOpen && (
          <div className='px-4 pb-4 space-y-4'>
            {/* simple placeholder filters */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <label className='text-sm'>Status</label>
                <select className='w-full border p-2 rounded text-sm'>
                  <option value=''>All</option>
                  <option value='pending'>Pending</option>
                  <option value='approved'>Approved</option>
                </select>
              </div>
              <div>
                <label className='text-sm'>Location</label>
                <input type='text' className='w-full border p-2 rounded text-sm' placeholder='Search location' />
              </div>
            </div>
            <button className='bg-blue-600 text-white px-4 py-2 rounded'>Apply</button>
          </div>
        )}
      </div>

      {/* Table card */}
      <div className='bg-white border rounded shadow p-4'>
        <div className='flex justify-between items-center mb-4'>
          <div className='space-x-2 text-sm'>
            <button className='border px-2 py-1 rounded'>Export CSV</button>
            <button className='border px-2 py-1 rounded'>Export Excel</button>
            <button className='border px-2 py-1 rounded'>Print</button>
            <button className='border px-2 py-1 rounded'>Column visibility</button>
            <button className='border px-2 py-1 rounded'>Export PDF</button>
          </div>
          <div className='flex items-center space-x-2'>
            <input type='text' placeholder='Search…' className='border p-2 rounded text-sm' />
            <button
              onClick={() => router.push(`/${lang}/apps/purchases/requisition/add`)}
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
                {['Action', 'Date', 'Reference No', 'Location', 'Status', 'Required by date', 'Added By'].map(h => (
                  <th key={h} className='border px-2 py-1'>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className='text-center p-8'>
                    <i className='tabler-loader animate-spin mr-2' />
                    Loading requisitions...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className='text-center p-4'>No data available in table</td>
                </tr>
              ) : (
                data.map(r => (
                  <tr key={r.id} className='odd:bg-gray-50 hover:bg-gray-100 transition-colors'>
                    <td className='border px-2 py-1 text-center'>
                      <button
                        onClick={() => router.push(`/${lang}/apps/purchases/requisition/edit/${r.id}`)}
                        className='text-primary hover:underline mr-2'
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className='text-error hover:underline'
                      >
                        Delete
                      </button>
                    </td>
                    <td className='border px-2 py-1'>{new Date(r.requestDate).toLocaleDateString()}</td>
                    <td className='border px-2 py-1 font-medium'>{r.requisitionNumber}</td>
                    <td className='border px-2 py-1'>{r.requestedFor || 'N/A'}</td>
                    <td className='border px-2 py-1 text-center'>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        r.status === 'APPROVED' ? 'bg-success/10 text-success' :
                        r.status === 'REJECTED' ? 'bg-error/10 text-error' :
                        'bg-warning/10 text-warning'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className='border px-2 py-1'>{r.requiredDate ? new Date(r.requiredDate).toLocaleDateString() : 'N/A'}</td>
                    <td className='border px-2 py-1'>{r.requestedBy}</td>
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
