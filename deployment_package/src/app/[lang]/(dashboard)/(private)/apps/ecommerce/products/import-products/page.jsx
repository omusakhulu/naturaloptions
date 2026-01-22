'use client'

import { useState } from 'react'
import axios from 'axios'

export default function ImportProductsPage() {
  const [file, setFile] = useState(null)
  const [log, setLog] = useState('')
  const [loading, setLoading] = useState(false)

  const downloadTemplate = () => {
    window.location.href = '/api/products/import-template'
  }

  const submit = async e => {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setLog('📤 Uploading file and processing...\n\nThis may take a while depending on the number of products.\nPlease do not close this page.\n\n')
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await axios.post('/api/products/bulk-import', form, {
        timeout: 300000 // 5 minutes timeout for large imports
      })
      setLog(res.data || '✅ Import complete')
    } catch (err) {
      console.error('Import error:', err)
      const errorMsg = err?.response?.data || err?.message || 'Import failed'
      setLog(`❌ Import failed:\n\n${errorMsg}`)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    ['1', 'Product Name *', 'Name of the product'],
    ['2', 'Brand (optional)', 'Name of the brand'],
    ['3', 'Unit', 'Unit used e.g pcs, kg'],
    ['4', 'Category (optional)', 'Name of the Category'],
    ['5', 'Sub-category (optional)', 'Name of the Sub-Category'],
    ['6', 'SKU (optional)', 'Product SKU (unique)'],
    ['7', 'Barcode Type (optional)', 'Barcode type e.g EAN13'],
    ['8', 'Manage Stock (Yes/No)', 'Enable or disable stock management'],
    ['9', 'Alert Quantity', 'Alert on low stock'],
    ['10', 'Expiration (days)', 'Product expiry in days'],
    ['11', 'Selling Price', 'Selling price (number)'],
    ['12', 'Tax % (optional)', 'Tax percentage'],
    ['13', 'Product Type', 'simple / variable'],
    ['14', 'Variation Attributes', 'Comma-separated attribute names'],
    ['15', 'Opening Stock', 'Opening quantity'],
    ['16', 'Location', 'Business location'],
    ['17', 'Image (URL)', 'URL of the product image']
  ]

  return (
    <div className='p-8 space-y-6'>
      <h1 className='text-2xl font-semibold'>Import Products</h1>

      {/* Upload card */}
      <form
        onSubmit={submit}
        className='bg-white border rounded shadow p-6 space-y-4 max-w-xl'
      >
        <div>
          <label className='block font-medium mb-2'>CSV File to import</label>
          <input
            type='file'
            accept='.csv'
            onChange={e => setFile(e.target.files?.[0] || null)}
          />
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
        {log && (
          <div className='mt-4 p-4 bg-gray-50 border rounded max-h-96 overflow-y-auto'>
            <pre className='text-sm whitespace-pre-wrap font-mono'>{log}</pre>
          </div>
        )}
      </form>

      {/* Instructions */}
      <div className='bg-white border rounded shadow p-6'>
        <h2 className='text-lg font-semibold mb-4'>Instructions</h2>
        <p className='mb-4'>Carefully follow the instructions before importing the file.</p>
        <div className='overflow-x-auto'>
          <table className='min-w-full text-sm border'>
            <thead className='bg-gray-100'>
              <tr>
                <th className='border px-2 py-1'>Column #</th>
                <th className='border px-2 py-1'>Column Name</th>
                <th className='border px-2 py-1'>Instruction</th>
              </tr>
            </thead>
            <tbody>
              {columns.map(col => (
                <tr key={col[0]} className='odd:bg-gray-50'>
                  <td className='border px-2 py-1'>{col[0]}</td>
                  <td className='border px-2 py-1'>{col[1]}</td>
                  <td className='border px-2 py-1'>{col[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
