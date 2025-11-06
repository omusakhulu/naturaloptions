'use client'

import { useState } from 'react'

export default function AddQuotationPage() {
  const [serviceType, setServiceType] = useState('')
  const [customer, setCustomer] = useState('')
  const [payTerm, setPayTerm] = useState('')
  const [saleDate, setSaleDate] = useState(() => new Date().toISOString().slice(0, 16))
  const [status, setStatus] = useState('')
  const [invoiceScheme, setInvoiceScheme] = useState('Default')
  const [invoiceNo, setInvoiceNo] = useState('')
  const [salesOrder, setSalesOrder] = useState('')
  const [discountType, setDiscountType] = useState('Percentage')
  const [discountAmount, setDiscountAmount] = useState('0')
  const [orderTax, setOrderTax] = useState('None')
  const [sellNote, setSellNote] = useState('')
  const [shippingDetails, setShippingDetails] = useState('')
  const [shippingAddress, setShippingAddress] = useState('')
  const [shippingCharges, setShippingCharges] = useState('0')
  const [shippingStatus, setShippingStatus] = useState('')
  const [deliveredTo, setDeliveredTo] = useState('')
  const [deliveryPerson, setDeliveryPerson] = useState('')

  const totalPayable = 0

  return (
    <div className='p-8 space-y-6'>
      <h1 className='text-2xl font-semibold'>Add Quotation</h1>

      <div className='bg-white border rounded shadow p-4 grid grid-cols-1 md:grid-cols-3 gap-4'>
        <div className='md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div>
            <label className='block text-xs text-gray-500 mb-1'>Select types of service</label>
            <select value={serviceType} onChange={e=>setServiceType(e.target.value)} className='border rounded p-2 w-full'>
              <option value=''>Select</option>
              <option value='retail'>Retail</option>
              <option value='wholesale'>Wholesale</option>
              <option value='service'>Service</option>
            </select>
          </div>
          <div>
            <label className='block text-xs text-gray-500 mb-1'>Customer</label>
            <input value={customer} onChange={e=>setCustomer(e.target.value)} className='border rounded p-2 w-full' placeholder='Search or select customer' />
          </div>
          <div>
            <label className='block text-xs text-gray-500 mb-1'>Pay terms</label>
            <select value={payTerm} onChange={e=>setPayTerm(e.target.value)} className='border rounded p-2 w-full'>
              <option value=''>Please Select</option>
              <option>Due on receipt</option>
              <option>Net 7</option>
              <option>Net 14</option>
              <option>Net 30</option>
            </select>
          </div>
        </div>
        <div>
          <label className='block text-xs text-gray-500 mb-1'>Sale Date</label>
          <input type='datetime-local' value={saleDate} onChange={e=>setSaleDate(e.target.value)} className='border rounded p-2 w-full' />
        </div>
        <div>
          <label className='block text-xs text-gray-500 mb-1'>Status</label>
          <select value={status} onChange={e=>setStatus(e.target.value)} className='border rounded p-2 w-full'>
            <option value=''>Please Select</option>
            <option>Draft</option>
            <option>Pending</option>
            <option>Sent</option>
            <option>Accepted</option>
            <option>Declined</option>
          </select>
        </div>
        <div>
          <label className='block text-xs text-gray-500 mb-1'>Invoice scheme</label>
          <select value={invoiceScheme} onChange={e=>setInvoiceScheme(e.target.value)} className='border rounded p-2 w-full'>
            <option>Default</option>
          </select>
        </div>
        <div>
          <label className='block text-xs text-gray-500 mb-1'>Invoice No.</label>
          <input value={invoiceNo} onChange={e=>setInvoiceNo(e.target.value)} className='border rounded p-2 w-full' placeholder='Leave blank to auto generate' />
        </div>
        <div className='md:col-span-2'>
          <label className='block text-xs text-gray-500 mb-1'>Attach Document</label>
          <input type='file' className='block w-full text-sm border rounded p-2' />
          <div className='text-[11px] text-gray-500 mt-1'>Max file size: 5MB. Allowed: pdf, csv, zip, doc, docx, jpeg, jpg, png</div>
        </div>
        <div className='md:col-span-3'>
          <label className='block text-xs text-gray-500 mb-1'>Sales Order</label>
          <input value={salesOrder} onChange={e=>setSalesOrder(e.target.value)} className='border rounded p-2 w-full' />
        </div>
      </div>

      <div className='bg-white border rounded shadow p-4 space-y-3'>
        <div className='overflow-auto'>
          <table className='min-w-full text-sm'>
            <thead>
              <tr className='bg-gray-50 text-gray-600'>
                <th className='text-left font-medium px-3 py-2 border-b'>#</th>
                <th className='text-left font-medium px-3 py-2 border-b'>Product</th>
                <th className='text-left font-medium px-3 py-2 border-b'>Quantity</th>
                <th className='text-left font-medium px-3 py-2 border-b'>Unit Price</th>
                <th className='text-left font-medium px-3 py-2 border-b'>Discount</th>
                <th className='text-right font-medium px-3 py-2 border-b'>Subtotal</th>
                <th className='px-3 py-2 border-b'>X</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={7} className='text-center text-gray-500 py-8'>No items added.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className='flex items-center gap-2'>
          <input className='border rounded p-2 flex-1' placeholder='Enter Product name / SKU / Scan bar code' />
          <button className='border rounded px-3 py-2 text-sm'>Add Item</button>
        </div>
      </div>

      <div className='bg-white border rounded shadow p-4 grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='block text-xs text-gray-500 mb-1'>Discount Type</label>
            <select value={discountType} onChange={e=>setDiscountType(e.target.value)} className='border rounded p-2 w-full'>
              <option>Percentage</option>
              <option>Fixed</option>
            </select>
          </div>
          <div>
            <label className='block text-xs text-gray-500 mb-1'>Discount Amount</label>
            <input value={discountAmount} onChange={e=>setDiscountAmount(e.target.value)} className='border rounded p-2 w-full' />
          </div>
          <div className='md:col-span-2'>
            <label className='block text-xs text-gray-500 mb-1'>Order Tax</label>
            <select value={orderTax} onChange={e=>setOrderTax(e.target.value)} className='border rounded p-2 w-full'>
              <option>None</option>
              <option>VAT (16%)</option>
            </select>
          </div>
          <div className='md:col-span-2'>
            <label className='block text-xs text-gray-500 mb-1'>Sell note</label>
            <textarea value={sellNote} onChange={e=>setSellNote(e.target.value)} className='border rounded p-2 w-full' rows={4} />
          </div>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='block text-xs text-gray-500 mb-1'>Shipping Details</label>
            <input value={shippingDetails} onChange={e=>setShippingDetails(e.target.value)} className='border rounded p-2 w-full' />
          </div>
          <div>
            <label className='block text-xs text-gray-500 mb-1'>Shipping Address</label>
            <input value={shippingAddress} onChange={e=>setShippingAddress(e.target.value)} className='border rounded p-2 w-full' />
          </div>
          <div>
            <label className='block text-xs text-gray-500 mb-1'>Shipping Charges</label>
            <input value={shippingCharges} onChange={e=>setShippingCharges(e.target.value)} className='border rounded p-2 w-full' />
          </div>
          <div>
            <label className='block text-xs text-gray-500 mb-1'>Shipping Status</label>
            <select value={shippingStatus} onChange={e=>setShippingStatus(e.target.value)} className='border rounded p-2 w-full'>
              <option value=''>Please Select</option>
              <option>Pending</option>
              <option>In Transit</option>
              <option>Delivered</option>
              <option>Cancelled</option>
            </select>
          </div>
          <div>
            <label className='block text-xs text-gray-500 mb-1'>Delivered To</label>
            <input value={deliveredTo} onChange={e=>setDeliveredTo(e.target.value)} className='border rounded p-2 w-full' />
          </div>
          <div>
            <label className='block text-xs text-gray-500 mb-1'>Delivery Person</label>
            <input value={deliveryPerson} onChange={e=>setDeliveryPerson(e.target.value)} className='border rounded p-2 w-full' />
          </div>
          <div className='md:col-span-2'>
            <label className='block text-xs text-gray-500 mb-1'>Shipping Documents</label>
            <input type='file' className='block w-full text-sm border rounded p-2' />
            <div className='text-[11px] text-gray-500 mt-1'>Max file size: 5MB. Allowed: pdf, csv, zip, doc, docx, jpeg, jpg, png</div>
          </div>
        </div>
      </div>

      <div className='bg-white border rounded shadow p-4 flex items-center justify-between'>
        <div className='text-sm text-gray-700'>Total Payable: <span className='font-semibold'>KSh {Number(totalPayable).toLocaleString('en-KE')}</span></div>
        <div className='space-x-2'>
          <button className='border rounded px-4 py-2 text-sm'>Save</button>
          <button className='bg-indigo-600 hover:bg-indigo-700 text-white rounded px-4 py-2 text-sm'>Save and print</button>
        </div>
      </div>
    </div>
  )
}
