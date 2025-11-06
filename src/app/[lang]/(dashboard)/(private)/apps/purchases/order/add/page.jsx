'use client'

import { useState } from 'react'

import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

export default function AddPurchaseOrderPage() {
  const [orderDate, setOrderDate] = useState(new Date())
  const [deliveryDate, setDeliveryDate] = useState(null)

  return (
    <div className='p-8 space-y-6'>
      <h1 className='text-2xl font-semibold'>Add Purchase Order</h1>

      {/* Top grid */}
      <div className='bg-white border rounded shadow p-6 space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <div className='col-span-1'>
            <label className='block text-sm font-medium mb-1'>Supplier*:</label>
            <div className='flex'>
              <select className='w-full border p-2 rounded text-sm'>
                <option value=''>Please Select</option>
              </select>
              <button className='border rounded p-2 ml-1'>
                <i className='tabler-plus' />
              </button>
            </div>
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>Reference No:</label>
            <input className='w-full border p-2 rounded text-sm' />
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>Order date*:</label>
            <DatePicker
              selected={orderDate}
              onChange={d => setOrderDate(d)}
              className='w-full border p-2 rounded text-sm'
            />
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>Delivery date:</label>
            <DatePicker
              selected={deliveryDate}
              onChange={d => setDeliveryDate(d)}
              className='w-full border p-2 rounded text-sm'
              placeholderText='Select date'
            />
          </div>
          <div className='md:col-span-2'>
            <label className='block text-sm font-medium mb-1'>Address:</label>
            <textarea className='w-full border p-2 rounded text-sm' rows={2} />
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>Business Location*:</label>
            <select className='w-full border p-2 rounded text-sm'>
              <option>NATURAL OPTIONS (BL0001)</option>
            </select>
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>Pay term:</label>
            <select className='w-full border p-2 rounded text-sm'>
              <option value=''>Please Select</option>
            </select>
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>Attach Document:</label>
            <input type='file' className='w-full border p-2 rounded text-sm' />
            <p className='text-xs text-gray-500 mt-1'>Max file size: 5MB<br />Allowed file: .pdf, .csv, .zip, .doc, .docx, .jpeg, .jpg, .png</p>
          </div>
        </div>

        <div>
          <label className='block text-sm font-medium mb-1'>Purchase Requisition:</label>
          <input className='w-full border p-2 rounded text-sm max-w-sm' />
        </div>
      </div>

      {/* Product search + table */}
      <div className='bg-white border rounded shadow p-4 space-y-4'>
        <div className='flex items-center space-x-2'>
          <i className='tabler-search text-gray-500' />
          <input
            type='text'
            placeholder='Enter Product name / SKU / Scan bar code'
            className='border p-2 rounded flex-1 text-sm'
          />
          <button className='text-blue-600 text-sm'>+Add new product</button>
        </div>
        <div className='overflow-x-auto'>
          <table className='min-w-full text-sm border'>
            <thead className='bg-gray-100'>
              <tr>
                {['#', 'Product Name', 'Order quantity', 'Unit Cost (Before Discount)', 'Discount Percent', 'Unit Cost (Before Tax)', 'Line Total'].map(h => (
                  <th key={h} className='border px-2 py-1'>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={7} className='text-center p-4'>No products</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className='text-right text-sm space-y-1'>
          <p>Total items: 0</p>
          <p>Net Total Amount: Ksh 0</p>
        </div>
      </div>

      {/* Shipping details */}
      <div className='bg-white border rounded shadow p-6 space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <div className='md:col-span-2'>
            <label className='block text-sm font-medium mb-1'>Shipping Details</label>
            <textarea className='w-full border p-2 rounded text-sm' rows={2} />
          </div>
          <div className='md:col-span-2'>
            <label className='block text-sm font-medium mb-1'>Shipping Address</label>
            <textarea className='w-full border p-2 rounded text-sm' rows={2} />
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>Shipping Charges</label>
            <input type='number' defaultValue={0} className='w-full border p-2 rounded text-sm' />
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>Shipping Status</label>
            <select className='w-full border p-2 rounded text-sm'>
              <option value=''>Please Select</option>
            </select>
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>Delivered To</label>
            <input className='w-full border p-2 rounded text-sm' />
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>Shipping Documents</label>
            <input type='file' className='w-full border p-2 rounded text-sm' />
            <p className='text-xs text-gray-500 mt-1'>Max file size: 5MB<br />Allowed file: .pdf, .csv, .zip, .doc, .docx, .jpeg, .jpg, .png</p>
          </div>
        </div>
        <button className='border px-4 py-2 text-sm rounded'>+ Add additional expenses</button>
        <div className='text-right font-medium'>Order Total: Ksh 0</div>
      </div>

      {/* Additional notes */}
      <div className='bg-white border rounded shadow p-6'>
        <label className='block text-sm font-medium mb-1'>Additional Notes</label>
        <textarea className='w-full border p-2 rounded text-sm' rows={3} />
      </div>

      <div className='text-center'>
        <button className='bg-purple-600 text-white px-8 py-2 rounded text-lg'>Save</button>
      </div>
    </div>
  )
}
