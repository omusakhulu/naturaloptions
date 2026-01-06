'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { useParams, useRouter } from 'next/navigation'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

export default function AddPurchaseReturnPage() {
  const [returnDate, setReturnDate] = useState(new Date())
  const [suppliers, setSuppliers] = useState([])
  const [businessLocations, setBusinessLocations] = useState([])
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [referenceNo, setReferenceNo] = useState('')
  const [parentPurchase, setParentPurchase] = useState('')
  const [notes, setNotes] = useState('')
  const params = useParams()
  const router = useRouter()
  const lang = params?.lang || 'en'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [suppliersRes, locationsRes] = await Promise.all([
        axios.get('/api/suppliers'),
        axios.get('/api/business-locations')
      ])
      setSuppliers(suppliersRes.data)
      setBusinessLocations(locationsRes.data)
    } catch (err) {
      console.error('Error loading data:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      // TODO: Implement actual save functionality
      alert('Purchase return functionality will be implemented')
      router.push(`/${lang}/apps/purchases/returns`)
    } catch (err) {
      console.error('Error saving purchase return:', err)
      alert('Failed to save purchase return')
    }
  }

  return (
    <div className='p-8 space-y-6'>
      <div className='flex justify-between items-center'>
        <h1 className='text-2xl font-semibold'>Add Purchase Return</h1>
        <button
          onClick={() => router.push(`/${lang}/apps/purchases/returns`)}
          className='border px-4 py-2 rounded text-sm'
        >
          Back to List
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Header fields */}
        <div className='bg-white border rounded shadow p-6 space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <label className='block text-sm font-medium mb-1'>Supplier*:</label>
              <select 
                className='w-full border p-2 rounded text-sm'
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                required
              >
                <option value=''>Please Select</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className='block text-sm font-medium mb-1'>Reference No:</label>
              <input 
                className='w-full border p-2 rounded text-sm'
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder='Auto-generated if empty'
              />
            </div>
            <div>
              <label className='block text-sm font-medium mb-1'>Return Date*:</label>
              <DatePicker 
                selected={returnDate} 
                onChange={setReturnDate} 
                className='w-full border p-2 rounded text-sm'
                required
              />
            </div>
            <div>
              <label className='block text-sm font-medium mb-1'>Parent Purchase:</label>
              <input 
                className='w-full border p-2 rounded text-sm'
                value={parentPurchase}
                onChange={(e) => setParentPurchase(e.target.value)}
                placeholder='Original purchase reference'
              />
            </div>
            <div>
              <label className='block text-sm font-medium mb-1'>Business Location*:</label>
              <select className='w-full border p-2 rounded text-sm' required>
                {businessLocations.length > 0 ? (
                  businessLocations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.code || 'N/A'})
                    </option>
                  ))
                ) : (
                  <option>NATURAL OPTIONS (BL0001)</option>
                )}
              </select>
            </div>
            <div>
              <label className='block text-sm font-medium mb-1'>Return Status*:</label>
              <select className='w-full border p-2 rounded text-sm' required>
                <option value='pending'>Pending</option>
                <option value='completed'>Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product search & table */}
        <div className='bg-white border rounded shadow p-4 space-y-4'>
          <div className='flex items-center space-x-2'>
            <input
              type='text'
              placeholder='Enter Product name / SKU / Scan bar code'
              className='border p-2 rounded flex-1 text-sm'
            />
            <button type='button' className='text-blue-600 text-sm'>+Add product</button>
          </div>
          <div className='overflow-x-auto'>
            <table className='min-w-full text-sm border'>
              <thead className='bg-red-100'>
                <tr>
                  {['#', 'Product Name', 'Return Quantity', 'Unit Cost', 'Line Total', 'Reason'].map(h => (
                    <th key={h} className='border px-2 py-1'>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr><td colSpan={6} className='text-center p-4'>No products added</td></tr>
              </tbody>
            </table>
          </div>
          <div className='text-right text-sm space-y-1'>
            <p>Total items: 0</p>
            <p>Net Total Amount: 0</p>
          </div>
        </div>

        {/* Additional details */}
        <div className='bg-white border rounded shadow p-6 space-y-4'>
          <div>
            <label className='text-sm block font-medium mb-1'>Additional Notes</label>
            <textarea 
              className='w-full border p-2 rounded text-sm' 
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder='Enter any additional notes about this return'
            />
          </div>
          <div className='text-right font-medium text-lg'>
            Return Total: 0.00
          </div>
        </div>

        {/* Payment section */}
        <div className='bg-white border rounded shadow p-6 space-y-4'>
          <h2 className='font-medium'>Payment Information</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='text-sm'>Payment Status*</label>
              <select className='w-full border p-2 rounded text-sm' required>
                <option value='pending'>Pending</option>
                <option value='refunded'>Refunded</option>
                <option value='partial'>Partial Refund</option>
              </select>
            </div>
            <div>
              <label className='text-sm'>Refund Amount</label>
              <input 
                type='number' 
                defaultValue={0} 
                step='0.01'
                className='w-full border p-2 rounded text-sm' 
              />
            </div>
          </div>
        </div>

        <div className='flex gap-3 justify-center'>
          <button 
            type='submit'
            className='bg-purple-600 text-white px-8 py-2 rounded text-lg'
          >
            Save Return
          </button>
          <button 
            type='button'
            onClick={() => router.push(`/${lang}/apps/purchases/returns`)}
            className='border px-8 py-2 rounded text-lg'
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
