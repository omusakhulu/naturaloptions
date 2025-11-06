"use client"

import Link from 'next/link'

const cards = [
  {
    title: 'Trial Balance',
    desc: 'A trial balance displays summary of all ledger balances and helps check that transactions are balanced.',
    href: (lang) => `/${lang}/apps/accounting/reports/trial-balance`
  },
  {
    title: 'Ledger Report',
    desc: 'Detailed journal line items for selected account and period.',
    href: (lang) => `/${lang}/apps/accounting/reports/ledger`
  },
  {
    title: 'Balance Sheet',
    desc: 'Snapshot of assets, liabilities and equity at a point in time.',
    href: (lang) => `/${lang}/apps/payment-accounts/balance-sheet`
  },
  {
    title: 'AR Aging (Summary)',
    desc: 'Summary of pending sales invoices by aging bucket.',
    href: (lang) => `/${lang}/apps/accounting/reports/ar-aging`
  },
  {
    title: 'AP Aging (Summary)',
    desc: 'Summary of pending purchase bills by aging bucket.',
    href: (lang) => `/${lang}/apps/accounting/reports/ap-aging`
  }
]

export default function ReportsLanding({ params }) {
  const lang = params?.lang || 'en'
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Reports</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map(c => (
          <div key={c.title} className="bg-white border rounded shadow p-4">
            <div className="text-lg font-semibold mb-1">{c.title}</div>
            <div className="text-sm text-gray-600 mb-3">{c.desc}</div>
            <Link className="inline-block px-3 py-2 rounded bg-indigo-600 text-white text-sm" href={c.href(lang)}>View Report</Link>
          </div>
        ))}
      </div>
    </div>
  )
}
