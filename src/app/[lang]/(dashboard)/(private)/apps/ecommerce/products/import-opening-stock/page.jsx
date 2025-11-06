'use client'

import { useState } from 'react'

import axios from 'axios'

export default function ImportOpeningStockPage() {
  const [file, setFile] = useState(null)
  const [log, setLog] = useState('')
  const [loading, setLoading] = useState(false)

  const downloadTemplate = () => {
    window.location.href = '/api/stock/opening-template'
  }

  const submit = async e => {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setLog('Uploading…')
    const form = new FormData()

    form.append('file', file)

    try {
      const res = await axios.post('/api/stock/opening-import', form)

      setLog(res.data || 'Import complete')
    } catch (err) {
      setLog(err?.response?.data || 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='p-12 space-y-6'>
      <h1 className='text-2xl font-semibold'>Import Opening Stock</h1>
      <div className='bg-white border rounded shadow p-6 space-y-4 max-w-xl'>
        <form onSubmit={submit} className='space-y-4'>
          <div>
            <label className='block font-medium mb-2'>CSV File</label>
            <input type='file' accept='.csv' onChange={e => setFile(e.target.files?.[0] || null)} />
          </div>
          <div className='flex items-center space-x-4'>
            <button
              type='submit'
              disabled={loading || !file}
              className='bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50'
            >
              {loading ? 'Importing…' : 'Submit'}
            </button>
            <button
              type='button'
              onClick={downloadTemplate}
              className='bg-green-600 text-white px-4 py-2 rounded'
            >
              Download template file
            </button>
          </div>
          {log && <p className='text-sm'>{log}</p>}
        </form>
      </div>

      <div className='bg-white border rounded shadow p-6'>
        <h2 className='text-lg font-semibold mb-4'>Instructions</h2>
        <p className='mb-4'>Ensure the CSV contains the following columns:</p>
        <ul className='list-disc pl-6 space-y-1 text-sm'>
          <li>product_sku* – SKU matching existing product</li>
          <li>location* – Business location name</li>
          <li>quantity* – Opening stock quantity (number)</li>
          <li>expiry_date (optional) – YYYY-MM-DD</li>
        </ul>
      </div>
    </div>
  )
}
