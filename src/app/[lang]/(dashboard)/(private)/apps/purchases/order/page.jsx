'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PurchaseOrderPage() {
  const router = useRouter()
  const [filterOpen, setFilterOpen] = useState(true)
  const data = [] // TODO fetch purchase orders

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
              onClick={() => router.push('./order/add')}
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
              {data.length === 0 ? (
                <tr>
                  <td colSpan={9} className='text-center p-4'>No data available in table</td>
                </tr>
              ) : (
                data.map(o => (
                  <tr key={o.id} className='odd:bg-gray-50'>
                    <td className='border px-2 py-1'>edit</td>
                    <td className='border px-2 py-1'>{o.date}</td>
                    <td className='border px-2 py-1'>{o.ref}</td>
                    <td className='border px-2 py-1'>{o.location}</td>
                    <td className='border px-2 py-1'>{o.supplier}</td>
                    <td className='border px-2 py-1'>{o.status}</td>
                    <td className='border px-2 py-1'>{o.qtyRemain}</td>
                    <td className='border px-2 py-1'>{o.shipping}</td>
                    <td className='border px-2 py-1'>{o.user}</td>
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
