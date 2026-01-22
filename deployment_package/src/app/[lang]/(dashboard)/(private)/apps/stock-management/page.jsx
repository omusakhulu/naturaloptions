'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'

export default function StockManagementPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [showSyncModal, setShowSyncModal] = useState(false)
  const [adjustmentData, setAdjustmentData] = useState({
    quantity: 0,
    reason: '',
    notes: ''
  })

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/api/products')
      setProducts(res.data || [])
    } catch (error) {
      console.error('Failed to load products:', error)
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const handleAdjustStock = async () => {
    if (!selectedProduct || adjustmentData.quantity === 0) {
      toast.error('Please enter a quantity')
      return
    }

    try {
      const res = await axios.post('/api/stock/adjust', {
        productId: selectedProduct.id,
        quantity: parseInt(adjustmentData.quantity),
        reason: adjustmentData.reason,
        notes: adjustmentData.notes
      })

      toast.success(res.data.message)
      setShowAdjustModal(false)
      setAdjustmentData({ quantity: 0, reason: '', notes: '' })
      loadProducts()
    } catch (error) {
      console.error('Stock adjustment failed:', error)
      toast.error(error.response?.data?.error || 'Failed to adjust stock')
    }
  }

  const handleSyncStock = async (productId) => {
    try {
      const res = await axios.post('/api/stock/sync', { productId })
      toast.success(res.data.message)
      loadProducts()
    } catch (error) {
      console.error('Stock sync failed:', error)
      toast.error(error.response?.data?.error || 'Failed to sync stock')
    }
  }

  const handleSyncAll = async () => {
    if (!confirm('Sync all products to WooCommerce? This may take a while.')) {
      return
    }

    try {
      const res = await axios.post('/api/stock/sync', { syncAll: true })
      toast.success(res.data.message)
      setShowSyncModal(false)
      loadProducts()
    } catch (error) {
      console.error('Bulk sync failed:', error)
      toast.error(error.response?.data?.error || 'Failed to sync all products')
    }
  }

  const getStockStatus = (product) => {
    const available = product.actualStock - product.reservedStock
    if (available <= 0) return { text: 'Out of Stock', color: 'text-red-600 bg-red-50' }
    if (available <= product.lowStockAlert) return { text: 'Low Stock', color: 'text-orange-600 bg-orange-50' }
    return { text: 'In Stock', color: 'text-green-600 bg-green-50' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading products...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Stock Management</h1>
        <button
          onClick={() => setShowSyncModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Sync All to Website
        </button>
      </div>

      {/* Stock Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm text-gray-600">Total Products</div>
          <div className="text-2xl font-bold">{products.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm text-gray-600">Low Stock Items</div>
          <div className="text-2xl font-bold text-orange-600">
            {products.filter(p => (p.actualStock - p.reservedStock) <= p.lowStockAlert).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm text-gray-600">Out of Stock</div>
          <div className="text-2xl font-bold text-red-600">
            {products.filter(p => (p.actualStock - p.reservedStock) <= 0).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm text-gray-600">Reserved Stock</div>
          <div className="text-2xl font-bold">
            {products.reduce((sum, p) => sum + (p.reservedStock || 0), 0)}
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actual Stock</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Reserved</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Available</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Website Stock</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => {
                const available = product.actualStock - product.reservedStock
                const status = getStockStatus(product)
                const needsSync = product.websiteStock !== available

                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        {product.image && (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-10 h-10 rounded object-cover mr-3"
                          />
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{product.sku || '-'}</td>
                    <td className="px-4 py-3 text-center font-semibold">{product.actualStock}</td>
                    <td className="px-4 py-3 text-center text-orange-600">{product.reservedStock || 0}</td>
                    <td className="px-4 py-3 text-center font-semibold">{available}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={needsSync ? 'text-orange-600 font-semibold' : ''}>
                        {product.websiteStock}
                        {needsSync && ' ⚠️'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${status.color}`}>
                        {status.text}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedProduct(product)
                            setShowAdjustModal(true)
                          }}
                          className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                        >
                          Adjust
                        </button>
                        <button
                          onClick={() => handleSyncStock(product.id)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                          disabled={!needsSync}
                        >
                          Sync
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {showAdjustModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Adjust Stock: {selectedProduct.name}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Current Actual Stock</label>
                <div className="text-2xl font-bold">{selectedProduct.actualStock}</div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Adjustment Quantity</label>
                <input
                  type="number"
                  value={adjustmentData.quantity}
                  onChange={(e) => setAdjustmentData({ ...adjustmentData, quantity: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter positive or negative number"
                />
                <div className="text-sm text-gray-600 mt-1">
                  New stock will be: {selectedProduct.actualStock + parseInt(adjustmentData.quantity || 0)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Reason</label>
                <select
                  value={adjustmentData.reason}
                  onChange={(e) => setAdjustmentData({ ...adjustmentData, reason: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select reason</option>
                  <option value="RECOUNT">Physical recount</option>
                  <option value="DAMAGE">Damaged goods</option>
                  <option value="RETURN">Customer return</option>
                  <option value="PURCHASE">New purchase</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                <textarea
                  value={adjustmentData.notes}
                  onChange={(e) => setAdjustmentData({ ...adjustmentData, notes: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  rows="3"
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAdjustStock}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Adjust Stock
              </button>
              <button
                onClick={() => {
                  setShowAdjustModal(false)
                  setAdjustmentData({ quantity: 0, reason: '', notes: '' })
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sync All Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Sync All Products</h2>
            <p className="text-gray-600 mb-6">
              This will sync actual stock (minus reserved) to WooCommerce for all products. This may take several minutes.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleSyncAll}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Sync All
              </button>
              <button
                onClick={() => setShowSyncModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
