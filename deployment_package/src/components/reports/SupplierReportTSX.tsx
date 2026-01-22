"use client"

import React, { useEffect, useMemo, useState } from 'react'
import ReportLayout from '@/components/reports/ReportLayout'
import useReportQuery from '@/components/reports/useReportQuery'

type VendorRow = {
  vendorId: string
  vendorName: string
  bills: number
  purchaseReturns: number
  totalPurchased: number
  totalPaid: number
  balance: number
}

type SupplierData = {
  range: { from: string; to: string }
  locationId?: string | null
  items: VendorRow[]
  totals: { totalPurchased: number; totalPaid: number; balance: number }
}

function toDateInputValue(d: Date) {
  const dt = new Date(d)
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function SupplierReportTSX({ lang = 'en' }: { lang?: string }) {
  const monthStart = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1), [])
  const today = useMemo(() => new Date(), [])
  const { params, setParams } = useReportQuery({ from: toDateInputValue(monthStart), to: toDateInputValue(today), locationId: '' })

  const [data, setData] = useState<SupplierData>({
    range: { from: toDateInputValue(monthStart), to: toDateInputValue(today) },
    locationId: '',
    items: [],
    totals: { totalPurchased: 0, totalPaid: 0, balance: 0 }
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
      if (params.from) sp.set('from', params.from)
      if (params.to) sp.set('to', params.to)
      if (params.locationId) sp.set('locationId', String(params.locationId))
      const res = await fetch(`/api/reports/supplier${sp.toString() ? `?${sp.toString()}` : ''}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load report')
      const json = await res.json()
      setData(json as SupplierData)
    } catch (e) {
      // Mock fallback
      const items: VendorRow[] = [
        { vendorId: 'v1', vendorName: 'Acme Supplies', bills: 12, purchaseReturns: 1, totalPurchased: 32500, totalPaid: 25000, balance: 7500 },
        { vendorId: 'v2', vendorName: 'Global Traders', bills: 9, purchaseReturns: 0, totalPurchased: 18700, totalPaid: 12000, balance: 6700 },
        { vendorId: 'v3', vendorName: 'Prime Vendor Ltd', bills: 6, purchaseReturns: 2, totalPurchased: 14100, totalPaid: 9000, balance: 5100 }
      ]
      const totals = items.reduce((s, r) => ({ totalPurchased: s.totalPurchased + r.totalPurchased, totalPaid: s.totalPaid + r.totalPaid, balance: s.balance + r.balance }), { totalPurchased: 0, totalPaid: 0, balance: 0 })
      setData({ range: { from: params.from || toDateInputValue(monthStart), to: params.to || toDateInputValue(today) }, locationId: params.locationId || '', items, totals })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReport() /* eslint-disable-line react-hooks/exhaustive-deps */ }, [params.from, params.to, params.locationId])

  const breadcrumbs = [
    { label: 'Reports', href: `/${lang}/apps/reports` },
    { label: 'Supplier Report' }
  ]

  return (
    <ReportLayout
      title="Supplier Report"
      description="Totals purchased, paid and returns by vendor"
      breadcrumbs={breadcrumbs}
      filters={
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
            <div className="text-xs text-gray-600 mb-1">Location</div>
            <select className="border rounded px-3 py-2 w-full" value={params.locationId || ''} onChange={e => setParams({ locationId: e.target.value })}>
              <option value="">All Locations</option>
              {locations.map(l => (<option key={l.id} value={l.id}>{l.name}</option>))}
            </select>
          </div>
        </div>
      }
    >
      {/*
        Prisma Logic:

        // Inputs: from, to (date range); optional location filtering not represented on Bill in schema
        // Primary Models: Vendor, Bill, PurchaseReturn

        const from = new Date(query.from)
        const to = new Date(query.to)

        // Bills grouped by vendor
        const billsByVendor = await prisma.bill.groupBy({
          by: ['vendorId'],
          where: { billDate: { gte: from, lte: to } },
          _sum: { amount: true, paidAmount: true },
          _count: { _all: true }
        })

        const returnsByVendor = await prisma.purchaseReturn.groupBy({
          by: ['vendorId'],
          where: { date: { gte: from, lte: to } },
          _sum: { amount: true },
          _count: { _all: true }
        })

        const vendors = await prisma.vendor.findMany({ select: { id: true, name: true } })

        const rows = billsByVendor.map(b => {
          const vendor = vendors.find(v => v.id === b.vendorId)
          const ret = returnsByVendor.find(r => r.vendorId === b.vendorId)
          const totalPurchased = Number(b._sum.amount || 0)
          const totalPaid = Number(b._sum.paidAmount || 0)
          const balance = totalPurchased - totalPaid
          return {
            vendorId: b.vendorId,
            vendorName: vendor?.name || 'Vendor',
            bills: Number(b._count._all || 0),
            purchaseReturns: Number(ret?._count._all || 0),
            totalPurchased,
            totalPaid,
            balance
          }
        })

        const totals = rows.reduce((s, r) => ({ totalPurchased: s.totalPurchased + r.totalPurchased, totalPaid: s.totalPaid + r.totalPaid, balance: s.balance + r.balance }), { totalPurchased: 0, totalPaid: 0, balance: 0 })

        return { range: { from: query.from, to: query.to }, items: rows, totals }
      */}

      {loading && <div className="text-sm text-gray-500">Loading…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="border rounded p-3">
              <div className="text-sm">Total Purchased</div>
              <div className="text-lg font-semibold">{Number(data.totals.totalPurchased || 0).toLocaleString()}</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-sm">Total Paid</div>
              <div className="text-lg font-semibold">{Number(data.totals.totalPaid || 0).toLocaleString()}</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-sm">Balance</div>
              <div className="text-lg font-semibold">{Number(data.totals.balance || 0).toLocaleString()}</div>
            </div>
          </div>

          <div className="border rounded">
            <div className="grid grid-cols-6 text-xs font-medium text-gray-700 border-b py-2 px-3">
              <div className="col-span-2">Vendor</div>
              <div className="text-right">Bills</div>
              <div className="text-right">Returns</div>
              <div className="text-right">Purchased</div>
              <div className="text-right">Paid / Balance</div>
            </div>
            {(data.items || []).map(r => (
              <div key={r.vendorId} className="grid grid-cols-6 text-sm border-b py-2 px-3">
                <div className="col-span-2">{r.vendorName}</div>
                <div className="text-right">{r.bills}</div>
                <div className="text-right">{r.purchaseReturns}</div>
                <div className="text-right">{Number(r.totalPurchased || 0).toLocaleString()}</div>
                <div className="text-right">{Number(r.totalPaid || 0).toLocaleString()} / {Number(r.balance || 0).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </ReportLayout>
  )
}
