"use client"

import Link from 'next/link'

const reports = [
  { slug: 'profit-loss', title: 'Profit / Loss Report' },
  { slug: 'purchase-sale', title: 'Purchase & Sale' },
  { slug: 'tax', title: 'Tax Report' },
  { slug: 'supplier-customer', title: 'Supplier & Customer Report' },
  { slug: 'customer-groups', title: 'Customer Groups Report' },
  { slug: 'stock', title: 'Stock Report' },
  { slug: 'stock-expiry', title: 'Stock Expiry Report' },
  { slug: 'lot', title: 'Lot Report' },
  { slug: 'stock-adjustment', title: 'Stock Adjustment Report' },
  { slug: 'trending-products', title: 'Trending Products' },
  { slug: 'items', title: 'Items Report' },
  { slug: 'product-purchase', title: 'Product Purchase Report' },
  { slug: 'product-sell', title: 'Product Sell Report' },
  { slug: 'purchase-payment', title: 'Purchase Payment Report' },
  { slug: 'sell-payment', title: 'Sell Payment Report' },
  { slug: 'expense', title: 'Expense Report' },
  { slug: 'register', title: 'Register Report' },
  { slug: 'sales-representative', title: 'Sales Representative Report' },
  { slug: 'activity-log', title: 'Activity Log' }
]

export default function ReportsIndex({ params }) {
  const lang = params?.lang || 'en'
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Reports</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map(r => (
          <div key={r.slug} className="bg-white border rounded shadow p-4">
            <div className="text-base font-semibold mb-2">{r.title}</div>
            <Link className="inline-block px-3 py-2 rounded bg-indigo-600 text-white text-sm" href={`/${lang}/apps/reports/${r.slug}`}>
              Open
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
