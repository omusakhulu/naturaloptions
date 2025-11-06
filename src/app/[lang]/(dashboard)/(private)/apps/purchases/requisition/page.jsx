'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PurchaseRequisitionPage() {
  const router = useRouter()
  const [filterOpen, setFilterOpen] = useState(true)

  const data = [] // TODO fetch requisitions

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
              onClick={() => router.push('./requisition/add')}
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
              {data.length === 0 ? (
                <tr>
                  <td colSpan={7} className='text-center p-4'>No data available in table</td>
                </tr>
              ) : (
                data.map(r => (
                  <tr key={r.id} className='odd:bg-gray-50'>
                    <td className='border px-2 py-1'>edit</td>
                    <td className='border px-2 py-1'>{r.date}</td>
                    <td className='border px-2 py-1'>{r.ref}</td>
                    <td className='border px-2 py-1'>{r.location}</td>
                    <td className='border px-2 py-1'>{r.status}</td>
                    <td className='border px-2 py-1'>{r.required}</td>
                    <td className='border px-2 py-1'>{r.user}</td>
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
