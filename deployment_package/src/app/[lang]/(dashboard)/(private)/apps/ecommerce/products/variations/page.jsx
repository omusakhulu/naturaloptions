'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'

export default function VariationsPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/products/variations')
      setData(res.data)
    } catch (err) {
      setError('Failed to load variations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleDelete = async v => {
    if (!confirm('Delete this variation?')) return
    try {
      await axios.delete(`/api/products/variations?id=${v.id}&parentId=${v.parentId}`)
      setData(data.filter(x => x.id !== v.id))
    } catch (err) {
      alert('Delete failed')
    }
  }

  return (
    <div className='p-8'>
      <h1 className='text-2xl font-semibold mb-4'>Product Variations</h1>
      {loading ? (
        <p>Loading…</p>
      ) : error ? (
        <p className='text-red-600'>{error}</p>
      ) : data.length === 0 ? (
        <p>No variations found.</p>
      ) : (
        <table className='min-w-full border text-sm'>
          <thead className='bg-gray-100'>
            <tr>
              <th className='px-2 py-1 border'>ID</th>
              <th className='px-2 py-1 border'>Parent</th>
              <th className='px-2 py-1 border'>SKU</th>
              <th className='px-2 py-1 border'>Price</th>
              <th className='px-2 py-1 border'>Stock</th>
              <th className='px-2 py-1 border'>Qty</th>
              <th className='px-2 py-1 border'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map(v => (
              <tr key={v.id} className='hover:bg-gray-50'>
                <td className='border px-2 py-1'>{v.id}</td>
                <td className='border px-2 py-1'>{v.product}</td>
                <td className='border px-2 py-1'>{v.sku}</td>
                <td className='border px-2 py-1'>{v.price}</td>
                <td className='border px-2 py-1'>{v.stock_status}</td>
                <td className='border px-2 py-1'>{v.stock_quantity}</td>
                <td className='border px-2 py-1'>
                  {/* Edit to be implemented */}
                  <button
                    onClick={() => handleDelete(v)}
                    className='text-red-600 hover:underline'
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
