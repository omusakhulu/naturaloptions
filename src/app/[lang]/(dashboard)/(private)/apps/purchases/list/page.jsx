'use client'

import { useState, useEffect } from 'react'

import { useRouter } from 'next/navigation'

import axios from 'axios'

export default function PurchasesListPage() {
  const [filterOpen, setFilterOpen] = useState(true)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // ensure we always store an array

    const load = async () => {
      try {
        const res = await axios.get('/api/purchases/orders')
        const orders = res?.data?.orders

        setData(Array.isArray(orders) ? orders : [])
      } catch (e) {
        console.error('Failed to load purchases:', e)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return (
    <div className='p-8 space-y-6'>
      <h1 className='text-2xl font-semibold'>Purchases</h1>
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
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
              <div>
                <label className='text-sm'>Purchase Status</label>
                <select className='w-full border p-2 rounded text-sm'>
                  <option value=''>All</option>
                  <option value='received'>Received</option>
                  <option value='pending'>Pending</option>
                </select>
              </div>
              <div>
                <label className='text-sm'>Payment Status</label>
                <select className='w-full border p-2 rounded text-sm'>
                  <option value=''>All</option>
                  <option value='paid'>Paid</option>
                  <option value='partial'>Partial</option>
                  <option value='due'>Due</option>
                </select>
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
              onClick={() => router.push('./add')}
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
                {['Action', 'Date', 'Reference No', 'Location', 'Supplier', 'Purchase Status', 'Payment Status', 'Grand Total', 'Payment Due', 'Added By'].map(h => (
                  <th key={h} className='border px-2 py-1'>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className='p-4 text-center'>Loading…</td></tr>
              ) : !Array.isArray(data) || data.length === 0 ? (
                <tr><td colSpan={10} className='p-4 text-center'>No data available in table</td></tr>
              ) : (
                (Array.isArray(data) ? data : []).map(p => (
                  <tr key={p.id} className='odd:bg-gray-50'>
                    <td className='border px-2 py-1'>view</td>
                    <td className='border px-2 py-1'>{p.orderDate ? new Date(p.orderDate).toLocaleDateString() : ''}</td>
                    <td className='border px-2 py-1'>{p.orderNumber || ''}</td>
                    <td className='border px-2 py-1'>{p.warehouseId || ''}</td>
                    <td className='border px-2 py-1'>{p.vendor?.name || ''}</td>
                    <td className='border px-2 py-1'>{p.status || ''}</td>
                    <td className='border px-2 py-1'>{p.paymentStatus || ''}</td>
                    <td className='border px-2 py-1'>{p.totalAmount ?? ''}</td>
                    <td className='border px-2 py-1'>{(p.totalAmount != null && p.paidAmount != null) ? Number(p.totalAmount) - Number(p.paidAmount) : ''}</td>
                    <td className='border px-2 py-1'>{p.createdBy || ''}</td>
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
