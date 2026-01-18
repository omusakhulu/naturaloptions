'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'react-toastify'

export default function PurchaseOrderPage() {
  const router = useRouter()
  const { lang } = useParams()
  const [filterOpen, setFilterOpen] = useState(true)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchPurchaseOrders = async () => {
    setLoading(true)
    try {
      console.log('Fetching purchase orders...')
      const res = await fetch('/api/purchases/orders', { cache: 'no-store' })
      const result = await res.json()
      
      console.log('Purchase orders result:', result)
      
      if (res.ok && result.orders) {
        setData(result.orders)
      } else {
        console.error('API error:', result.error)
        toast.error(result.error || 'Failed to load purchase orders')
      }
    } catch (error) {
      console.error('Fetch error:', error)
      toast.error('Failed to load purchase orders')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this purchase order?')) return

    try {
      const res = await fetch(`/api/purchases/orders?id=${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Purchase order deleted successfully')
        fetchPurchaseOrders()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to delete purchase order')
      }
    } catch (error) {
      console.error('Error deleting purchase order:', error)
      toast.error('An error occurred while deleting')
    }
  }

  useEffect(() => {
    fetchPurchaseOrders()
  }, [])

  return (
    <div className='p-8 space-y-6'>
      <h1 className='text-2xl font-semibold'>Purchase Order</h1>
      {/* Filters accordion */}
      <div className='bg-white border rounded'>
        <button
          className='flex items-center px-4 py-2 w-full text-left font-medium'
          onClick={() => setFilterOpen(!filterOpen)}
        >
          <i className='tabler-filter mr-2' /> Filters
        </button>
        {filterOpen && (
          <div className='px-4 pb-4'>
            {/* placeholder filters */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
              <div>
                <label className='text-sm'>Status</label>
                <select className='w-full border p-2 rounded text-sm'>
                  <option value=''>All</option>
                  <option value='pending'>Pending</option>
                  <option value='received'>Received</option>
                </select>
              </div>
              <div>
                <label className='text-sm'>Supplier</label>
                <input type='text' className='w-full border p-2 rounded text-sm' placeholder='Search supplier' />
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
            {['Export CSV', 'Export Excel', 'Print', 'Column visibility', 'Export PDF'].map(b => (
              <button key={b} className='border px-2 py-1 rounded'>
                {b}
              </button>
            ))}
          </div>
          <div className='flex items-center space-x-2'>
            <input type='text' placeholder='Search…' className='border p-2 rounded text-sm' />
            <button
              onClick={() => router.push(`/${lang}/apps/purchases/order/add`)}
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
                {['Action', 'Date', 'Reference No', 'Location', 'Supplier', 'Status', 'Quantity Remaining', 'Shipping Status', 'Added By'].map(h => (
                  <th key={h} className='border px-2 py-1'>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className='text-center p-8 text-gray-500'>
                    <div className='flex flex-col items-center gap-2'>
                      <i className='tabler-loader animate-spin text-2xl' />
                      <span>Loading purchase orders...</span>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={9} className='text-center p-4'>No data available in table</td>
                </tr>
              ) : (
                data.map(o => (
                  <tr key={o.id} className='odd:bg-gray-50 hover:bg-gray-100 transition-colors'>
                    <td className='border px-2 py-1 text-center'>
                      <div className='flex items-center justify-center gap-2'>
                        <button 
                          type='button'
                          onClick={() => router.push(`/${lang}/apps/purchases/order/edit/${o.id}`)}
                          className='text-primary hover:text-primary-dark transition-colors'
                          title='Edit'
                        >
                          <i className='tabler-edit text-lg' />
                        </button>
                        <button 
                          type='button'
                          onClick={() => handleDelete(o.id)}
                          className='text-error hover:text-error-dark transition-colors'
                          title='Delete'
                        >
                          <i className='tabler-trash text-lg' />
                        </button>
                      </div>
                    </td>
                    <td className='border px-2 py-1'>{new Date(o.orderDate).toLocaleDateString()}</td>
                    <td className='border px-2 py-1 font-medium'>{o.orderNumber}</td>
                    <td className='border px-2 py-1'>{o.warehouseId || 'Main Store'}</td>
                    <td className='border px-2 py-1'>{o.vendor?.name}</td>
                    <td className='border px-2 py-1 text-center'>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        o.status === 'RECEIVED' ? 'bg-success/10 text-success' :
                        o.status === 'CANCELLED' ? 'bg-error/10 text-error' :
                        'bg-warning/10 text-warning'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className='border px-2 py-1 text-center'>
                      {o.items?.reduce((acc, item) => acc + (item.quantity - (item.receivedQty || 0)), 0)}
                    </td>
                    <td className='border px-2 py-1 text-center'>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        o.shippingStatus === 'Delivered' ? 'bg-success/10 text-success' :
                        'bg-info/10 text-info'
                      }`}>
                        {o.shippingStatus || 'Pending'}
                      </span>
                    </td>
                    <td className='border px-2 py-1'>{o.createdBy || 'System'}</td>
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
