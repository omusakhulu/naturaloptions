'use client'

export default function AddSalesOrderPage() {
  return (
    <div className='p-8 space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>Add Sales Order</h1>
        <div className='space-x-2'>
          <button className='border rounded px-4 py-2 text-sm'>Save Draft</button>
          <button className='bg-indigo-600 hover:bg-indigo-700 text-white rounded px-4 py-2 text-sm'>Save Order</button>
        </div>
      </div>

      {/* Customer & Order Info */}
      <div className='bg-white border rounded shadow p-4 grid grid-cols-1 md:grid-cols-3 gap-4'>
        <div>
          <label className='block text-xs text-gray-500 mb-1'>Customer</label>
          <input className='border rounded p-2 w-full' placeholder='Search or select customer' />
        </div>
        <div>
          <label className='block text-xs text-gray-500 mb-1'>Contact Number</label>
          <input className='border rounded p-2 w-full' />
        </div>
        <div>
          <label className='block text-xs text-gray-500 mb-1'>Location</label>
          <input className='border rounded p-2 w-full' />
        </div>
        <div>
          <label className='block text-xs text-gray-500 mb-1'>Order Date</label>
          <input type='date' className='border rounded p-2 w-full' />
        </div>
        <div>
          <label className='block text-xs text-gray-500 mb-1'>Status</label>
          <select className='border rounded p-2 w-full'>
            <option>Open</option>
            <option>Processing</option>
            <option>Completed</option>
            <option>Cancelled</option>
          </select>
        </div>
      </div>

      {/* Products */}
      <div className='bg-white border rounded shadow p-4 space-y-3'>
        <div className='flex items-center gap-2'>
          <input className='border rounded p-2 flex-1' placeholder='Search product or scan barcode' />
          <button className='border rounded px-3 py-2 text-sm'>Add Item</button>
        </div>
        <div className='overflow-auto'>
          <table className='min-w-full text-sm'>
            <thead>
              <tr className='bg-gray-50 text-gray-600'>
                <th className='text-left font-medium px-3 py-2 border-b'>Product</th>
                <th className='text-left font-medium px-3 py-2 border-b'>Qty</th>
                <th className='text-left font-medium px-3 py-2 border-b'>Price</th>
                <th className='text-left font-medium px-3 py-2 border-b'>Discount</th>
                <th className='text-left font-medium px-3 py-2 border-b'>Tax</th>
                <th className='text-right font-medium px-3 py-2 border-b'>Subtotal</th>
                <th className='px-3 py-2 border-b'>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={7} className='text-center text-gray-500 py-8'>No items added.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className='bg-white border rounded shadow p-4 grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='space-y-3'>
          <div>
            <label className='block text-xs text-gray-500 mb-1'>Notes</label>
            <textarea className='border rounded p-2 w-full' rows={4} />
          </div>
        </div>
        <div className='space-y-2'>
          <div className='flex items-center justify-between text-sm'>
            <span>Subtotal</span>
            <span>KSh 0</span>
          </div>
          <div className='flex items-center justify-between text-sm'>
            <span>Discount</span>
            <span>KSh 0</span>
          </div>
          <div className='flex items-center justify-between text-sm'>
            <span>Tax</span>
            <span>KSh 0</span>
          </div>
          <div className='border-t pt-2 flex items-center justify-between font-medium'>
            <span>Total</span>
            <span>KSh 0</span>
          </div>
        </div>
      </div>
    </div>
  )
}
