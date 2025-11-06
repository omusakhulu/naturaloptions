'use client'

import { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

export default function AddPurchaseRequisitionPage() {
  const [requiredDate, setRequiredDate] = useState(null)

  return (
    <div className='p-8 space-y-6'>
      <h1 className='text-2xl font-semibold'>Add Purchase Requisition</h1>

      {/* Top fields */}
      <div className='bg-white border rounded shadow p-6 space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div>
            <label className='block text-sm font-medium mb-1'>Brand:</label>
            <input className='w-full border p-2 rounded text-sm' placeholder='Brand' />
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>Category:</label>
            <input className='w-full border p-2 rounded text-sm' placeholder='Category' />
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>Business Location:</label>
            <select className='w-full border p-2 rounded text-sm'>
              <option>NATURAL OPTIONS (BL0001)</option>
            </select>
          </div>
        </div>
        <div>
          <button className='bg-yellow-500 text-white px-4 py-2 rounded flex items-center'>
            <i className='tabler-search mr-1' /> Show products
          </button>
        </div>
      </div>

      {/* Reference */}
      <div className='bg-white border rounded shadow p-6 space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-medium mb-1'>Reference No:</label>
            <input className='w-full border p-2 rounded text-sm' placeholder='Auto-generate or enter…' />
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>Required by date:</label>
            <DatePicker
              selected={requiredDate}
              onChange={d => setRequiredDate(d)}
              className='w-full border p-2 rounded text-sm'
              placeholderText='Select date'
            />
          </div>
        </div>
      </div>

      {/* Products table */}
      <div className='bg-white border rounded shadow'>
        <table className='min-w-full text-sm'>
          <thead className='bg-gray-100'>
            <tr>
              <th className='border px-2 py-1'>Product</th>
              <th className='border px-2 py-1'>Alert quantity</th>
              <th className='border px-2 py-1'>Required quantity</th>
              <th className='border px-2 py-1 w-10'></th>
            </tr>
          </thead>
          <tbody>
            {/* rows will be added dynamically */}
            <tr>
              <td colSpan={4} className='text-center p-4'>No products selected</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Save button */}
      <div className='text-center'>
        <button className='bg-purple-600 text-white px-8 py-2 rounded text-lg'>Save</button>
      </div>
    </div>
  )
}
