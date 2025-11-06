'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'

export default function PurchaseReturnsPage() {
  const [filterOpen, setFilterOpen] = useState(true)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get('/api/purchases/returns')
        setData(Array.isArray(res.data) ? res.data : [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className='p-8 space-y-6'>
      <h1 className='text-2xl font-semibold'>Purchase Return</h1>

      {/* Filters */}
      <div className='bg-white border rounded'>
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className='flex items-center px-4 py-2 w-full text-left font-medium'
        >
          <i className='tabler-filter mr-2' /> Filters
        </button>
        {filterOpen && (
          <div className='px-4 pb-4'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
              <div>
                <label className='text-sm'>Payment Status</label>
                <select className='w-full border p-2 rounded text-sm'>
                  <option value=''>All</option>
                  <option value='received'>Received</option>
                  <option value='pending'>Pending</option>
                </select>
              </div>
            </div>
            <button className='bg-blue-600 text-white px-4 py-2 rounded'>Apply</button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className='bg-white border rounded shadow p-4'>
        <div className='flex justify-between items-center mb-4'>
          <div className='space-x-2 text-sm'>
            {['Export CSV', 'Export Excel', 'Print', 'Column visibility', 'Export PDF'].map(b => (
              <button key={b} className='border px-2 py-1 rounded'>{b}</button>
            ))}
          </div>
          <div className='flex items-center space-x-2'>
            <input placeholder='Search…' className='border p-2 rounded text-sm' />
            <button onClick={() => router.push('./returns/add')} className='bg-purple-600 text-white px-4 py-2 rounded flex items-center'>
              <i className='tabler-plus mr-1' /> Add
            </button>
          </div>
        </div>
        <div className='overflow-x-auto'>
          <table className='min-w-full text-sm border'>
            <thead className='bg-gray-100'>
              <tr>
                {['Date','Reference No','Parent Purchase','Location','Supplier','Payment Status','Grand Total','Payment due','Action'].map(h=> (
                  <th key={h} className='border px-2 py-1'>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className='p-4 text-center'>Loading…</td></tr>
              ) : data.length===0 ? (
                <tr><td colSpan={9} className='p-4 text-center'>No data available in table</td></tr>
              ) : (
                data.map(r=> (
                  <tr key={r.id} className='odd:bg-gray-50'>
                    <td className='border px-2 py-1'>{r.date}</td>
                    <td className='border px-2 py-1'>{r.ref}</td>
                    <td className='border px-2 py-1'>{r.parent}</td>
                    <td className='border px-2 py-1'>{r.location}</td>
                    <td className='border px-2 py-1'>{r.supplier}</td>
                    <td className='border px-2 py-1'>{r.paymentStatus}</td>
                    <td className='border px-2 py-1'>{r.grandTotal}</td>
                    <td className='border px-2 py-1'>{r.paymentDue}</td>
                    <td className='border px-2 py-1'>view</td>
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

