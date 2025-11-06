"use client"

import { useEffect, useMemo, useState } from 'react'
import ReportLayout from '@/components/reports/ReportLayout'
import useReportQuery from '@/components/reports/useReportQuery'
import CustomerAutocomplete from '@/components/customers/CustomerAutocomplete'

function toDateInputValue(d) {
  const dt = new Date(d)
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function downloadCsv(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export default function PurchaseSaleReport({ lang = 'en' }) {
  const monthStart = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1), [])
  const today = useMemo(() => new Date(), [])
  const { params, setParams } = useReportQuery({ from: toDateInputValue(monthStart), to: toDateInputValue(today) })

  const [data, setData] = useState({
    range: { from: monthStart, to: today },
    sales: { total: 0, byPeriod: [] },
    purchases: { total: 0, byPeriod: [] },
    adjustments: { salesReturns: 0, purchaseReturns: 0 },
    net: { sales: 0, purchases: 0 },
    filters: { customerId: null, vendorId: null }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [vendors, setVendors] = useState([])

  // Load vendors for dropdown
  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/vendors', { cache: 'no-store' })
        const json = await res.json()
        setVendors(Array.isArray(json.items) ? json.items : [])
      } catch {}
    })()
  }, [])

  const fetchReport = async () => {
    setLoading(true)
    setError('')
    try {
      const sp = new URLSearchParams()
      if (params.from) sp.set('from', params.from)
      if (params.to) sp.set('to', params.to)
      if (params.customerId) sp.set('customerId', params.customerId)
      if (params.vendorId) sp.set('vendorId', params.vendorId)
      const res = await fetch(`/api/reports/purchase-sale${sp.toString() ? `?${sp.toString()}` : ''}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load report')
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError('Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.from, params.to, params.customerId, params.vendorId])

  const breadcrumbs = [
    { label: 'Reports', href: `/${lang}/apps/reports` },
    { label: 'Purchase & Sale' }
  ]

  const exportCsv = () => {
    const rows = []
    rows.push(['Date', 'Sales', 'Purchases'])
    const keys = Array.from(new Set([...(data.sales.byPeriod || []).map(r => r.date), ...(data.purchases.byPeriod || []).map(r => r.date)])).sort()
    for (const k of keys) {
      const s = (data.sales.byPeriod || []).find(r => r.date === k)?.total || 0
      const p = (data.purchases.byPeriod || []).find(r => r.date === k)?.total || 0
      rows.push([k, String(s), String(p)])
    }
    rows.push([])
    rows.push(['Totals'])
    rows.push(['Sales Total', String(data.sales.total)])
    rows.push(['Sales Returns', String(data.adjustments.salesReturns)])
    rows.push(['Net Sales', String(data.net.sales)])
    rows.push(['Purchases Total', String(data.purchases.total)])
    rows.push(['Purchase Returns', String(data.adjustments.purchaseReturns)])
    rows.push(['Net Purchases', String(data.net.purchases)])

    const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    downloadCsv(`purchase-sale-${params.from || ''}-${params.to || ''}.csv`, csv)
  }

  const actions = (
    <>
      <button className="px-3 py-2 border rounded hover:bg-gray-50" onClick={() => window.print()}>Print</button>
      <button className="px-3 py-2 border rounded hover:bg-gray-50" onClick={exportCsv}>Export CSV</button>
    </>
  )

  const filters = (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      <div>
        <div className="text-xs text-gray-600 mb-1">From</div>
        <input type="date" className="border rounded px-3 py-2 w-full" value={params.from || ''} onChange={e => setParams({ from: e.target.value })} />
      </div>
      <div>
        <div className="text-xs text-gray-600 mb-1">To</div>
        <input type="date" className="border rounded px-3 py-2 w-full" value={params.to || ''} onChange={e => setParams({ to: e.target.value })} />
      </div>
      <div>
        <div className="text-xs text-gray-600 mb-1">Customer</div>
        <CustomerAutocomplete
          onSelect={(c) => setParams({ customerId: c?.id || c?.wooId || '' })}
          onAddNew={() => {}}
          dropdownWidth={360}
        />
      </div>
      <div>
        <div className="text-xs text-gray-600 mb-1">Vendor</div>
        <select className="border rounded px-3 py-2 w-full" value={params.vendorId || ''} onChange={e => setParams({ vendorId: e.target.value })}>
          <option value="">All Vendors</option>
          {vendors.map(v => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      </div>
    </div>
  )

  const Summary = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="border rounded p-3">
        <div className="text-sm font-medium mb-2">Sales</div>
        <div className="text-sm text-gray-600">Total: <span className="font-semibold">{data.sales.total.toLocaleString()}</span></div>
        <div className="text-sm text-gray-600">Returns: <span className="font-semibold">{data.adjustments.salesReturns.toLocaleString()}</span></div>
        <div className="text-sm">Net Sales: <span className="font-semibold">{data.net.sales.toLocaleString()}</span></div>
      </div>
      <div className="border rounded p-3">
        <div className="text-sm font-medium mb-2">Purchases</div>
        <div className="text-sm text-gray-600">Total: <span className="font-semibold">{data.purchases.total.toLocaleString()}</span></div>
        <div className="text-sm text-gray-600">Returns: <span className="font-semibold">{data.adjustments.purchaseReturns.toLocaleString()}</span></div>
        <div className="text-sm">Net Purchases: <span className="font-semibold">{data.net.purchases.toLocaleString()}</span></div>
      </div>
      <div className="border rounded p-3">
        <div className="text-sm font-medium mb-2">Balance</div>
        <div className="text-sm">Gross Margin (Sales - Purchases): <span className="font-semibold">{(data.net.sales - data.net.purchases).toLocaleString()}</span></div>
      </div>
    </div>
  )

  const PeriodTables = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <div className="text-sm font-semibold mb-2">Sales by Date</div>
        <div className="border rounded">
          <div className="grid grid-cols-2 text-xs font-medium text-gray-700 border-b py-2 px-3">
            <div>Date</div>
            <div className="text-right">Amount</div>
          </div>
          {(data.sales.byPeriod || []).map(r => (
            <div key={r.date} className="grid grid-cols-2 text-sm border-b py-2 px-3">
              <div>{r.date}</div>
              <div className="text-right">{Number(r.total || 0).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="text-sm font-semibold mb-2">Purchases by Date</div>
        <div className="border rounded">
          <div className="grid grid-cols-2 text-xs font-medium text-gray-700 border-b py-2 px-3">
            <div>Date</div>
            <div className="text-right">Amount</div>
          </div>
          {(data.purchases.byPeriod || []).map(r => (
            <div key={r.date} className="grid grid-cols-2 text-sm border-b py-2 px-3">
              <div>{r.date}</div>
              <div className="text-right">{Number(r.total || 0).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <ReportLayout
      title="Purchase & Sale"
      description="Aggregated sales and purchase totals with returns and daily breakdown"
      breadcrumbs={breadcrumbs}
      actions={actions}
      filters={filters}
    >
      {loading && <div className="text-sm text-gray-500">Loading…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="space-y-4">
          <Summary />
          <PeriodTables />
        </div>
      )}
    </ReportLayout>
  )
}
