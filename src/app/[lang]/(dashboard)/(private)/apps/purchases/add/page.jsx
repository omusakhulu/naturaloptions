'use client'

import { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

export default function AddPurchasePage() {
  const [purchaseDate, setPurchaseDate] = useState(new Date())
  const [paidOn, setPaidOn] = useState(new Date())

  return (
    <div className='p-8 space-y-6'>
      <h1 className='text-2xl font-semibold'>Add Purchase</h1>

      {/* Header fields */}
      <div className='bg-white border rounded shadow p-6 space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <div className='col-span-1'>
            <label className='block text-sm font-medium mb-1'>Supplier*:</label>
            <div className='flex'>
              <select className='w-full border p-2 rounded text-sm'>
                <option value=''>Please Select</option>
              </select>
              <button className='border rounded p-2 ml-1'><i className='tabler-plus' /></button>
            </div>
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>Reference No:</label>
            <input className='w-full border p-2 rounded text-sm' />
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>Purchase Date*:</label>
            <DatePicker selected={purchaseDate} onChange={setPurchaseDate} className='w-full border p-2 rounded text-sm' />
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>Purchase Status*:</label>
            <select className='w-full border p-2 rounded text-sm'>
              <option value='received'>Received</option>
              <option value='pending'>Pending</option>
            </select>
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
            <p className='text-xs text-gray-500 mt-1'>Max file size 5MB</p>
          </div>
        </div>
        <div>
          <label className='block text-sm font-medium mb-1'>Purchase Order:</label>
          <input className='w-full border p-2 rounded text-sm max-w-sm' />
        </div>
      </div>

      {/* Product search & table */}
      <div className='bg-white border rounded shadow p-4 space-y-4'>
        <div className='flex items-center space-x-2'>
          <button className='bg-purple-600 text-white px-3 py-1 rounded text-sm'>Import Products</button>
          <input
            type='text'
            placeholder='Enter Product name / SKU / Scan bar code'
            className='border p-2 rounded flex-1 text-sm'
          />
          <button className='text-blue-600 text-sm'>+Add new product</button>
        </div>
        <div className='overflow-x-auto'>
          <table className='min-w-full text-sm border'>
            <thead className='bg-green-100'>
              <tr>
                {['#', 'Product Name', 'Purchase Quantity', 'Unit Cost (Before Discount)', 'Discount Percent', 'Unit Cost (Before Tax)', 'Line Total', 'Profit Margin %', 'Unit Selling Price (Incl. tax)', 'Lot Number', 'MFG Date / EXP Date'].map(h => (
                  <th key={h} className='border px-2 py-1'>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr><td colSpan={11} className='text-center p-4'>No products</td></tr>
            </tbody>
          </table>
        </div>
        <div className='text-right text-sm space-y-1'>
          <p>Total items: 0</p>
          <p>Net Total Amount: 0</p>
        </div>
      </div>

      {/* Discount & tax card */}
      <div className='bg-white border rounded shadow p-6 space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <div>
            <label className='text-sm'>Discount Type</label>
            <select className='w-full border p-2 rounded text-sm'>
              <option>None</option>
              <option>Fixed</option>
              <option>Percentage</option>
            </select>
          </div>
          <div>
            <label className='text-sm'>Discount Amount</label>
            <input type='number' defaultValue={0} className='w-full border p-2 rounded text-sm' />
          </div>
          <div>
            <label className='text-sm'>Discount(%)</label>
            <input type='number' defaultValue={0} className='w-full border p-2 rounded text-sm' />
          </div>
          <div>
            <label className='text-sm'>Purchase Tax</label>
            <select className='w-full border p-2 rounded text-sm'>
              <option>None</option>
            </select>
          </div>
        </div>
        <label className='text-sm block'>Additional Notes</label>
        <textarea className='w-full border p-2 rounded text-sm' rows={2} />
      </div>

      {/* Shipping details */}
      <div className='bg-white border rounded shadow p-6 space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='text-sm'>Shipping Details</label>
            <textarea className='w-full border p-2 rounded text-sm' rows={2} />
          </div>
          <div>
            <label className='text-sm'>(*) Additional Shipping charges:</label>
            <input type='number' defaultValue={0} className='w-full border p-2 rounded text-sm' />
          </div>
        </div>
        <button className='border px-4 py-2 text-sm rounded'>+ Add additional expenses</button>
        <div className='text-right font-medium'>Purchase Total: 0</div>
      </div>

      {/* Payment section */}
      <div className='bg-white border rounded shadow p-6 space-y-4'>
        <h2 className='font-medium'>Add payment</h2>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div>
            <label className='text-sm'>Amount*</label>
            <input type='number' defaultValue={0} className='w-full border p-2 rounded text-sm' />
          </div>
          <div>
            <label className='text-sm'>Paid on*</label>
            <DatePicker selected={paidOn} onChange={setPaidOn} className='w-full border p-2 rounded text-sm' />
          </div>
          <div>
            <label className='text-sm'>Payment Method*</label>
            <select className='w-full border p-2 rounded text-sm'>
              <option>Cash</option>
              <option>Bank</option>
            </select>
          </div>
          <div>
            <label className='text-sm'>Payment Account</label>
            <select className='w-full border p-2 rounded text-sm'>
              <option>CASH</option>
            </select>
          </div>
        </div>
        <label className='text-sm block'>Payment note</label>
        <textarea className='w-full border p-2 rounded text-sm' rows={2} />
        <div className='text-right font-medium'>Payment due: 0.00</div>
      </div>

      <div className='text-center'>
        <button className='bg-purple-600 text-white px-8 py-2 rounded text-lg'>Save</button>
      </div>
    </div>
  )
}

