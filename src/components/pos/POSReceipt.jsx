'use client'

import { forwardRef } from 'react'
import Image from 'next/image'

const POSReceipt = forwardRef(({ sale, onClose, onPrint }, ref) => {
  const formatCurrency = (amount) => {
    return `KSh ${parseFloat(amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!sale) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-[320px] max-h-[90vh] overflow-auto">
        {/* Receipt Header */}
        <div className="p-3 border-b flex justify-between items-center">
          <h2 className="text-sm font-bold">Receipt Preview</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition"
          >
            <i className="tabler-x text-lg" />
          </button>
        </div>

        {/* Printable Receipt Content - 80mm thermal receipt width */}
        <div ref={ref} className="p-4 bg-white" id="receipt-content" style={{ width: '280px', margin: '0 auto', fontFamily: "'Courier New', monospace" }}>
          {/* Logo */}
          <div className="text-center mb-3">
            <img 
              src="/images/logos/logo.png" 
              alt="Natural Options" 
              className="h-12 mx-auto mb-2"
              style={{ maxHeight: '48px', width: 'auto' }}
            />
            <p className="text-xs text-gray-600">Nairobi, Kenya</p>
            <p className="text-xs text-gray-600">Tel: +254 700 000 000</p>
            <p className="text-xs text-gray-500">www.naturaloptions.co.ke</p>
          </div>

          {/* Receipt Info */}
          <div className="border-t border-b border-dashed border-gray-400 py-2 mb-3" style={{ fontSize: '11px' }}>
            <div className="flex justify-between">
              <span>Receipt #:</span>
              <span className="font-bold">{sale.saleNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{formatDate(sale.date || new Date())}</span>
            </div>
            {sale.employee && (
              <div className="flex justify-between">
                <span>Served by:</span>
                <span>{sale.employee}</span>
              </div>
            )}
            {sale.customer && (
              <div className="flex justify-between">
                <span>Customer:</span>
                <span>{sale.customer.name || sale.customer.firstName || 'Walk-in'}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="mb-3" style={{ fontSize: '10px' }}>
            <div className="border-b border-gray-400 pb-1 mb-1 flex font-bold">
              <span className="flex-1">Item</span>
              <span className="w-8 text-center">Qty</span>
              <span className="w-16 text-right">Price</span>
              <span className="w-16 text-right">Total</span>
            </div>
            {sale.items?.map((item, index) => (
              <div key={index} className="flex py-1 border-b border-dotted border-gray-200">
                <span className="flex-1 truncate" style={{ maxWidth: '100px' }}>{item.name}</span>
                <span className="w-8 text-center">{item.quantity}</span>
                <span className="w-16 text-right">{formatCurrency(item.price)}</span>
                <span className="w-16 text-right font-medium">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-dashed border-gray-400 pt-2 space-y-1" style={{ fontSize: '11px' }}>
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(sale.subtotal)}</span>
            </div>
            {sale.discountAmount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Discount:</span>
                <span>-{formatCurrency(sale.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Tax (8%):</span>
              <span>{formatCurrency(sale.tax)}</span>
            </div>
            <div className="flex justify-between font-bold border-t border-gray-400 pt-2 mt-1" style={{ fontSize: '14px' }}>
              <span>TOTAL:</span>
              <span>{formatCurrency(sale.total)}</span>
            </div>
          </div>

          {/* Payment Info */}
          {sale.payments && sale.payments.length > 0 && (
            <div className="mt-3 pt-2 border-t border-dashed border-gray-400" style={{ fontSize: '10px' }}>
              <p className="font-bold mb-1">Payment:</p>
              {sale.payments.map((payment, index) => (
                <div key={index} className="flex justify-between">
                  <span className="capitalize">{payment.method}:</span>
                  <span>{formatCurrency(payment.amount)}</span>
                </div>
              ))}
            </div>
          )}

          {sale.paymentMethod && !sale.payments?.length && (
            <div className="mt-3 pt-2 border-t border-dashed border-gray-400" style={{ fontSize: '10px' }}>
              <div className="flex justify-between">
                <span>Payment:</span>
                <span className="capitalize font-bold">{sale.paymentMethod}</span>
              </div>
              {sale.amountTendered && (
                <>
                  <div className="flex justify-between">
                    <span>Tendered:</span>
                    <span>{formatCurrency(sale.amountTendered)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Change:</span>
                    <span>{formatCurrency(sale.amountTendered - sale.total)}</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-dashed border-gray-400 text-center" style={{ fontSize: '10px' }}>
            <p className="font-bold">Thank you for shopping!</p>
            <p className="mt-1">Goods once sold cannot be returned</p>
            <p>Keep this receipt for your records</p>
            
            {/* Barcode placeholder */}
            <div className="mt-3 py-1 bg-gray-100">
              <p className="font-mono" style={{ fontSize: '9px' }}>{sale.saleNumber}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-3 border-t bg-gray-50 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition"
          >
            Close
          </button>
          <button
            onClick={onPrint}
            className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-1"
          >
            <i className="tabler-printer" />
            Print
          </button>
        </div>
      </div>
    </div>
  )
})

POSReceipt.displayName = 'POSReceipt'

export default POSReceipt
