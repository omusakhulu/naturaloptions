'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { Button, Card, CardContent, TextField, Select, MenuItem, FormControl, InputLabel, Checkbox, FormControlLabel, Alert } from '@mui/material'
import { Print, QrCode2, QrCodeScanner } from '@mui/icons-material'

export default function PrintLabelsPage() {
  const [products, setProducts] = useState([])
  const [selectedProducts, setSelectedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [labelSettings, setLabelSettings] = useState({
    labelType: 'barcode',
    paperSize: 'a4',
    columns: 3,
    includePrice: true,
    includeName: true,
    includeSKU: true
  })

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/products/list')
      setProducts(res.data || [])
    } catch (err) {
      console.error('Failed to load products:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleProductToggle = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(products.map(p => p.id))
    }
  }

  const handlePrintLabels = () => {
    if (selectedProducts.length === 0) {
      alert('Please select at least one product')
      return
    }

    const selectedProductData = products.filter(p => selectedProducts.includes(p.id))
    
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Product Labels</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .label-grid { display: grid; grid-template-columns: repeat(${labelSettings.columns}, 1fr); gap: 10px; }
            .label { border: 1px solid #ccc; padding: 10px; text-align: center; page-break-inside: avoid; }
            .label h3 { margin: 5px 0; font-size: 14px; }
            .label p { margin: 3px 0; font-size: 12px; }
            .barcode { font-family: 'Libre Barcode 39', monospace; font-size: 24px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <button class="no-print" onclick="window.print()">Print Labels</button>
          <div class="label-grid">
            ${selectedProductData.map(product => `
              <div class="label">
                ${labelSettings.includeName ? `<h3>${product.productName || product.name}</h3>` : ''}
                ${labelSettings.includeSKU ? `<p>SKU: ${product.sku || 'N/A'}</p>` : ''}
                ${labelSettings.includePrice ? `<p><strong>${product.price || '$0.00'}</strong></p>` : ''}
                ${labelSettings.labelType === 'barcode' ? `<div class="barcode">${product.sku || product.id}</div>` : ''}
                ${labelSettings.labelType === 'qrcode' ? `<p>[QR Code: ${product.id}]</p>` : ''}
              </div>
            `).join('')}
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className='p-8'>
      <h1 className='text-2xl font-semibold mb-6'>Print Product Labels</h1>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2'>
          <Card>
            <CardContent>
              <div className='flex justify-between items-center mb-4'>
                <h2 className='text-lg font-semibold'>Select Products</h2>
                <Button onClick={handleSelectAll} variant='outlined' size='small'>
                  {selectedProducts.length === products.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>

              {loading ? (
                <p>Loading products...</p>
              ) : products.length === 0 ? (
                <Alert severity='info'>No products available. Please add products first.</Alert>
              ) : (
                <div className='max-h-96 overflow-y-auto'>
                  {products.map((product) => (
                    <div key={product.id} className='flex items-center p-2 hover:bg-gray-50 border-b'>
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => handleProductToggle(product.id)}
                      />
                      <div className='flex-1 ml-2'>
                        <p className='font-medium'>{product.productName || product.name}</p>
                        <p className='text-sm text-gray-500'>SKU: {product.sku || 'N/A'} | {product.price || '$0.00'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className='mt-4'>
                <Alert severity='info'>
                  Selected: {selectedProducts.length} product(s)
                </Alert>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardContent>
              <h2 className='text-lg font-semibold mb-4'>Label Settings</h2>

              <div className='space-y-4'>
                <FormControl fullWidth>
                  <InputLabel>Label Type</InputLabel>
                  <Select
                    value={labelSettings.labelType}
                    onChange={(e) => setLabelSettings({ ...labelSettings, labelType: e.target.value })}
                    label='Label Type'
                  >
                    <MenuItem value='barcode'><QrCodeScanner /> Barcode</MenuItem>
                    <MenuItem value='qrcode'><QrCode2 /> QR Code</MenuItem>
                    <MenuItem value='simple'>Simple Text</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Paper Size</InputLabel>
                  <Select
                    value={labelSettings.paperSize}
                    onChange={(e) => setLabelSettings({ ...labelSettings, paperSize: e.target.value })}
                    label='Paper Size'
                  >
                    <MenuItem value='a4'>A4</MenuItem>
                    <MenuItem value='letter'>Letter</MenuItem>
                    <MenuItem value='label'>Label Sheet</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label='Columns per Page'
                  type='number'
                  value={labelSettings.columns}
                  onChange={(e) => setLabelSettings({ ...labelSettings, columns: parseInt(e.target.value) || 3 })}
                  inputProps={{ min: 1, max: 6 }}
                />

                <div>
                  <p className='text-sm font-medium mb-2'>Include on Label:</p>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={labelSettings.includeName}
                        onChange={(e) => setLabelSettings({ ...labelSettings, includeName: e.target.checked })}
                      />
                    }
                    label='Product Name'
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={labelSettings.includeSKU}
                        onChange={(e) => setLabelSettings({ ...labelSettings, includeSKU: e.target.checked })}
                      />
                    }
                    label='SKU'
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={labelSettings.includePrice}
                        onChange={(e) => setLabelSettings({ ...labelSettings, includePrice: e.target.checked })}
                      />
                    }
                    label='Price'
                  />
                </div>

                <Button
                  fullWidth
                  variant='contained'
                  startIcon={<Print />}
                  onClick={handlePrintLabels}
                  disabled={selectedProducts.length === 0}
                  size='large'
                >
                  Print Labels ({selectedProducts.length})
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
