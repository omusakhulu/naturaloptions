'use client'

import { useState, useRef } from 'react'

export default function ImportSalesPage() {
  const fileInputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState([])
  const [headers, setHeaders] = useState([])
  const [mapping, setMapping] = useState({})
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')

  const requiredFields = [
    { key: 'productSku', label: 'Product SKU', required: true },
    { key: 'quantity', label: 'Quantity', required: true },
    { key: 'unitPrice', label: 'Unit Price', required: false },
    { key: 'customerEmail', label: 'Customer Email', required: false },
    { key: 'saleDate', label: 'Sale Date', required: false },
    { key: 'paymentMethod', label: 'Payment Method', required: false },
    { key: 'discount', label: 'Discount', required: false },
    { key: 'notes', label: 'Notes', required: false }
  ]

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length === 0) return { headers: [], rows: [] }
    
    const parseRow = (row) => {
      const result = []
      let current = ''
      let inQuotes = false
      
      for (let i = 0; i < row.length; i++) {
        const char = row[i]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      result.push(current.trim())
      return result
    }

    const headers = parseRow(lines[0])
    const rows = lines.slice(1).map(parseRow)
    return { headers, rows }
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    setFile(selectedFile)
    setError('')
    setResults(null)

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result
        const { headers: csvHeaders, rows } = parseCSV(text)
        setHeaders(csvHeaders)
        setPreview(rows.slice(0, 5))
        const autoMapping = {}
        requiredFields.forEach(field => {
          const match = csvHeaders.findIndex(h => 
            h.toLowerCase().replace(/[_\s]/g, '') === field.key.toLowerCase()
          )
          if (match !== -1) autoMapping[field.key] = match
        })
        setMapping(autoMapping)
      } catch (err) {
        setError('Failed to parse CSV file.')
      }
    }
    reader.readAsText(selectedFile)
  }

  const handleImport = async () => {
    if (!file) { setError('Please select a file'); return }
    const missingRequired = requiredFields.filter(f => f.required && mapping[f.key] === undefined)
    if (missingRequired.length > 0) {
      setError('Please map: ' + missingRequired.map(f => f.label).join(', '))
      return
    }
    setImporting(true)
    setError('')

    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const text = event.target?.result
        const { rows } = parseCSV(text)
        const salesData = rows.map(row => {
          const sale = {}
          Object.entries(mapping).forEach(([field, colIndex]) => {
            if (colIndex !== undefined && row[colIndex]) sale[field] = row[colIndex]
          })
          return sale
        }).filter(s => s.productSku && s.quantity)

        const res = await fetch('/api/sales/bulk-import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sales: salesData })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Import failed')
        setResults(data)
        setImporting(false)
      }
      reader.readAsText(file)
    } catch (err) {
      setError(err.message)
      setImporting(false)
    }
  }

  const downloadTemplate = () => {
    const template = 'productSku,quantity,unitPrice,customerEmail,saleDate,paymentMethod,discount,notes\nSKU001,2,1500,customer@email.com,2024-01-15,CASH,0,Sample note'
    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sales_import_template.csv'
    a.click()
  }

  return (
    <div className='p-6'>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-2xl font-semibold'>Bulk Sales Import</h1>
          <p className='text-gray-500 text-sm mt-1'>Import multiple sales from a CSV file</p>
        </div>
        <button onClick={downloadTemplate} className='px-4 py-2 border rounded hover:bg-gray-50'>
          Download Template
        </button>
      </div>

      {error && <div className='mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded'>{error}</div>}
      {results && (
        <div className='mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded'>
          Import complete! {results.imported} sales imported, {results.failed || 0} failed.
        </div>
      )}

      <div className='bg-white border rounded-lg p-6 mb-6'>
        <h2 className='font-medium mb-4'>Step 1: Select CSV File</h2>
        <input ref={fileInputRef} type='file' accept='.csv' onChange={handleFileChange} className='hidden' />
        <button onClick={() => fileInputRef.current?.click()} className='px-4 py-2 border-2 border-dashed rounded-lg hover:bg-gray-50 w-full'>
          {file ? file.name : 'Click to select CSV file'}
        </button>
      </div>

      {headers.length > 0 && (
        <div className='bg-white border rounded-lg p-6 mb-6'>
          <h2 className='font-medium mb-4'>Step 2: Map Columns</h2>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            {requiredFields.map(field => (
              <div key={field.key}>
                <label className='text-sm text-gray-600'>
                  {field.label} {field.required && <span className='text-red-500'>*</span>}
                </label>
                <select
                  value={mapping[field.key] ?? ''}
                  onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value ? parseInt(e.target.value) : undefined })}
                  className='w-full border rounded px-2 py-1 mt-1'
                >
                  <option value=''>-- Select --</option>
                  {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {preview.length > 0 && (
        <div className='bg-white border rounded-lg p-6 mb-6'>
          <h2 className='font-medium mb-4'>Preview (first 5 rows)</h2>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead><tr className='border-b'>{headers.map((h, i) => <th key={i} className='p-2 text-left'>{h}</th>)}</tr></thead>
              <tbody>{preview.map((row, i) => <tr key={i} className='border-b'>{row.map((cell, j) => <td key={j} className='p-2'>{cell}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </div>
      )}

      {headers.length > 0 && (
        <button onClick={handleImport} disabled={importing} className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50'>
          {importing ? 'Importing...' : 'Import Sales'}
        </button>
      )}
    </div>
  )
}
