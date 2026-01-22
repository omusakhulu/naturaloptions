"use client"

import React, { useEffect, useMemo, useState } from 'react'
import ReportLayout from '@/components/reports/ReportLayout'
import useReportQuery from '@/components/reports/useReportQuery'

type SupplierRow = {
  vendorId: string
  vendorName: string
  vendorEmail?: string
  bills: number
  purchaseReturns: number
  totalPurchased: number
  totalPaid: number
  balance: number
}

type CustomerRow = {
  id: string
  name: string
  email?: string
  phone?: string
  customerNumber?: string
  loyaltyPoints: number
  salesCount: number
  totalSpent: number
}

type SupplierCustomerData = {
  range: { from: string; to: string }
  locationId?: string | null
  q?: string
  suppliers: {
    items: SupplierRow[]
    totals: { vendors: number; bills: number; totalPurchased: number; totalPaid: number; balance: number }
  }
  customers: {
    items: CustomerRow[]
    totals: { customers: number; sales: number; amount: number }
  }
}

function toDateInputValue(d: Date) {
  const dt = new Date(d)
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function SupplierCustomerReportTSX({ lang = 'en' }: { lang?: string }) {
  const monthStart = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1), [])
  const today = useMemo(() => new Date(), [])

  const { params, setParams } = useReportQuery({
    from: toDateInputValue(monthStart),
    to: toDateInputValue(today),
    locationId: '',
    q: ''
  })

  const [data, setData] = useState<SupplierCustomerData>({
    range: { from: toDateInputValue(monthStart), to: toDateInputValue(today) },
    locationId: '',
    q: '',
    suppliers: { items: [], totals: { vendors: 0, bills: 0, totalPurchased: 0, totalPaid: 0, balance: 0 } },
    customers: { items: [], totals: { customers: 0, sales: 0, amount: 0 } }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/locations?isActive=true', { cache: 'no-store' })
        const json = await res.json()
        if (Array.isArray(json.items)) setLocations(json.items)
      } catch {
        setLocations([{ id: 'main', name: 'Main Location' }])
      }
    })()
  }, [])

  const fetchReport = async () => {
    setLoading(true)
    setError('')
    try {
      const sp = new URLSearchParams()
      if (params.from) sp.set('from', String(params.from))
      if (params.to) sp.set('to', String(params.to))
      if (params.locationId) sp.set('locationId', String(params.locationId))
      if (params.q) sp.set('q', String(params.q))

      const res = await fetch(`/api/reports/supplier-customer${sp.toString() ? `?${sp.toString()}` : ''}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load report')
      const json = await res.json()
      setData(json as SupplierCustomerData)
    } catch (e: any) {
      setError(e?.message || 'Failed to load report. Please try again.')
      setData({
        range: { from: String(params.from || toDateInputValue(monthStart)), to: String(params.to || toDateInputValue(today)) },
        locationId: (params.locationId as string) || '',
        q: String(params.q || ''),
        suppliers: { items: [], totals: { vendors: 0, bills: 0, totalPurchased: 0, totalPaid: 0, balance: 0 } },
        customers: { items: [], totals: { customers: 0, sales: 0, amount: 0 } }
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport() // eslint-disable-line react-hooks/exhaustive-deps
  }, [params.from, params.to, params.locationId, params.q])

  const breadcrumbs = useMemo(() => [{ label: 'Reports', href: `/${lang}/apps/reports` }, { label: 'Supplier & Customer Report' }], [lang])

  return (
    <ReportLayout
      title="Supplier & Customer Report"
      description="Supplier purchases and customer sales in one view"
      breadcrumbs={breadcrumbs}
      filters={
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <div className="text-xs text-gray-600 mb-1">From</div>
            <input type="date" className="border rounded px-3 py-2 w-full" value={String(params.from || '')} onChange={e => setParams({ from: e.target.value })} />
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">To</div>
            <input type="date" className="border rounded px-3 py-2 w-full" value={String(params.to || '')} onChange={e => setParams({ to: e.target.value })} />
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">Location</div>
            <select className="border rounded px-3 py-2 w-full" value={String(params.locationId || '')} onChange={e => setParams({ locationId: e.target.value })}>
              <option value="">All Locations</option>
              {locations.map(l => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">Search</div>
            <input className="border rounded px-3 py-2 w-full" placeholder="Supplier or customer" value={String(params.q || '')} onChange={e => setParams({ q: e.target.value })} />
          </div>
        </div>
      }
    >
      {loading && <div className="text-sm text-gray-500">Loading…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {!loading && !error && (
        <div className="space-y-8">
          <div className="space-y-3">
            <div className="text-sm font-semibold">Suppliers</div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="border rounded p-3">
                <div className="text-sm">Vendors</div>
                <div className="text-lg font-semibold">{Number(data.suppliers.totals.vendors || 0).toLocaleString()}</div>
              </div>
              <div className="border rounded p-3">
                <div className="text-sm">Bills</div>
                <div className="text-lg font-semibold">{Number(data.suppliers.totals.bills || 0).toLocaleString()}</div>
              </div>
              <div className="border rounded p-3">
                <div className="text-sm">Total Purchased</div>
                <div className="text-lg font-semibold">{Number(data.suppliers.totals.totalPurchased || 0).toLocaleString()}</div>
              </div>
              <div className="border rounded p-3">
                <div className="text-sm">Total Paid</div>
                <div className="text-lg font-semibold">{Number(data.suppliers.totals.totalPaid || 0).toLocaleString()}</div>
              </div>
              <div className="border rounded p-3">
                <div className="text-sm">Balance</div>
                <div className="text-lg font-semibold">{Number(data.suppliers.totals.balance || 0).toLocaleString()}</div>
              </div>
            </div>

            <div className="border rounded">
              <div className="grid grid-cols-7 text-xs font-medium text-gray-700 border-b py-2 px-3">
                <div className="col-span-2">Vendor</div>
                <div className="text-right">Bills</div>
                <div className="text-right">Returns</div>
                <div className="text-right">Purchased</div>
                <div className="text-right">Paid</div>
                <div className="text-right">Balance</div>
              </div>
              {(data.suppliers.items || []).length === 0 ? (
                <div className="text-sm text-gray-500 py-3 px-3">No supplier data for the selected filters.</div>
              ) : (
                (data.suppliers.items || []).map(r => (
                  <div key={r.vendorId} className="grid grid-cols-7 text-sm border-b py-2 px-3">
                    <div className="col-span-2">
                      {r.vendorName}
                      {r.vendorEmail ? <div className="text-xs text-gray-500">{r.vendorEmail}</div> : null}
                    </div>
                    <div className="text-right">{Number(r.bills || 0).toLocaleString()}</div>
                    <div className="text-right">{Number(r.purchaseReturns || 0).toLocaleString()}</div>
                    <div className="text-right">{Number(r.totalPurchased || 0).toLocaleString()}</div>
                    <div className="text-right">{Number(r.totalPaid || 0).toLocaleString()}</div>
                    <div className="text-right">{Number(r.balance || 0).toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold">Customers</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="border rounded p-3">
                <div className="text-sm">Customers</div>
                <div className="text-lg font-semibold">{Number(data.customers.totals.customers || 0).toLocaleString()}</div>
              </div>
              <div className="border rounded p-3">
                <div className="text-sm">Sales</div>
                <div className="text-lg font-semibold">{Number(data.customers.totals.sales || 0).toLocaleString()}</div>
              </div>
              <div className="border rounded p-3">
                <div className="text-sm">Amount</div>
                <div className="text-lg font-semibold">{Number(data.customers.totals.amount || 0).toLocaleString()}</div>
              </div>
            </div>

            <div className="border rounded">
              <div className="grid grid-cols-6 text-xs font-medium text-gray-700 border-b py-2 px-3">
                <div className="col-span-2">Customer</div>
                <div className="text-right">Loyalty</div>
                <div className="text-right">Sales</div>
                <div className="text-right">Total Spent</div>
                <div className="text-right">Phone</div>
              </div>
              {(data.customers.items || []).length === 0 ? (
                <div className="text-sm text-gray-500 py-3 px-3">No customer data for the selected filters.</div>
              ) : (
                (data.customers.items || []).map(r => (
                  <div key={r.id} className="grid grid-cols-6 text-sm border-b py-2 px-3">
                    <div className="col-span-2">
                      {r.name}
                      {r.email ? <div className="text-xs text-gray-500">{r.email}</div> : null}
                      {r.customerNumber ? <div className="text-xs text-gray-500">#{r.customerNumber}</div> : null}
                    </div>
                    <div className="text-right">{Number(r.loyaltyPoints || 0).toLocaleString()}</div>
                    <div className="text-right">{Number(r.salesCount || 0).toLocaleString()}</div>
                    <div className="text-right">{Number(r.totalSpent || 0).toLocaleString()}</div>
                    <div className="text-right">{r.phone || ''}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </ReportLayout>
  )
}
