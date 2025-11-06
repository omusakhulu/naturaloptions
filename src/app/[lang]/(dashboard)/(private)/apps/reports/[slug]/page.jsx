"use client"

const TITLES = {
  'profit-loss': 'Profit / Loss Report',
  'purchase-sale': 'Purchase & Sale',
  'tax': 'Tax Report',
  'supplier-customer': 'Supplier & Customer Report',
  'customer-groups': 'Customer Groups Report',
  'stock': 'Stock Report',
  'stock-expiry': 'Stock Expiry Report',
  'lot': 'Lot Report',
  'stock-adjustment': 'Stock Adjustment Report',
  'trending-products': 'Trending Products',
  'items': 'Items Report',
  'product-purchase': 'Product Purchase Report',
  'product-sell': 'Product Sell Report',
  'purchase-payment': 'Purchase Payment Report',
  'sell-payment': 'Sell Payment Report',
  'expense': 'Expense Report',
  'register': 'Register Report',
  'sales-representative': 'Sales Representative Report',
  'activity-log': 'Activity Log'
}

export default function ReportPage({ params }) {
  const slug = params?.slug
  const title = TITLES[slug] || 'Report'

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <div className="bg-white border rounded shadow p-4 space-y-4">
        <div className="text-sm text-gray-600">Filters</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <input className="border rounded px-3 py-2" placeholder="Date From" type="date" />
          <input className="border rounded px-3 py-2" placeholder="Date To" type="date" />
          <input className="border rounded px-3 py-2" placeholder="Search" />
        </div>
      </div>
      <div className="bg-white border rounded shadow p-4">
        <div className="text-sm text-gray-600 mb-2">Data</div>
        <div className="text-gray-500 text-sm">Report content will appear here.</div>
      </div>
    </div>
  )
}
