// Simple placeholder page for Update Price
'use client'

'use client'

import { useState } from 'react'

import axios from 'axios'

export default function UpdatePricePage() {
  const [file, setFile] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const downloadCsv = () => {
    window.location.href = '/api/products/price-export'
  }

  const handleImport = async e => {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    const form = new FormData()

    form.append('file', file)

    try {
      await axios.post('/api/products/price-import', form)
      setMessage('Prices updated successfully!')
    } catch (err) {
      setMessage('Import failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='p-8'>
      <h1 className='text-2xl font-semibold mb-4'>Bulk Price Update</h1>

      <div className='space-x-4'>
        <button
          className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'
          onClick={downloadCsv}
        >
          Export Prices (CSV)
        </button>

        <form onSubmit={handleImport} className='inline-block'>
          <input
            type='file'
            accept='.csv'
            onChange={e => setFile(e.target.files?.[0] || null)}
            className='mr-2'
          />
          <button
            type='submit'
            disabled={loading || !file}
            className='bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50'
          >
            {loading ? 'Uploading…' : 'Import & Update'}
          </button>
        </form>
      </div>

      {message && <p className='mt-4'>{message}</p>}
    </div>
  )
}
