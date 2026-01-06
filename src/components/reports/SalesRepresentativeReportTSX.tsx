"use client"

import React, { useEffect, useState } from 'react'
import ReportLayout from '@/components/reports/ReportLayout'
import useReportQuery from '@/components/reports/useReportQuery'

type Row = {
  id: string
  name: string
  email: string
  totalSales: number
  totalRevenue: number
  avgSaleValue: number
}

type Data = {
  range: { from: string; to: string }
  items: Row[]
  totals: { sales: number; amount: number }
}

export default function SalesRepresentativeReportTSX({ lang = 'en' }: { lang?: string }) {
  const { params, setParams } = useReportQuery({ from: '', to: '' })
  const [data, setData] = useState<Data>({ 
    range: { from: '', to: '' }, 
    items: [], 
    totals: { sales: 0, amount: 0 } 
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchReport = async () => {
    setLoading(true)
    setError('')
    try {
      const sp = new URLSearchParams()
      if (params.from) sp.set('from', params.from)
      if (params.to) sp.set('to', params.to)
      
      const res = await fetch(`/api/reports/sales-representative${sp.toString() ? `?${sp.toString()}` : ''}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load sales representative report')
      const json = await res.json()
      setData(json as Data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [params.from, params.to])

  const breadcrumbs = [
    { label: 'Reports', href: `/${lang}/apps/reports` },
    { label: 'Sales Representative Report' }
  ]

  return (
    <ReportLayout
      title="Sales Representative Report"
      description="Sales performance breakdown by representative"
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
        </div>
      }
    >
      {loading && <div className="text-sm text-gray-500">Loading report data…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="border rounded p-3">
              <div className="text-sm text-gray-500">Total Sales Count</div>
              <div className="text-lg font-semibold">{data.totals.sales.toLocaleString()}</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-sm text-gray-500">Total Revenue</div>
              <div className="text-lg font-semibold">${data.totals.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          </div>

          <div className="border rounded overflow-hidden">
            <div className="grid grid-cols-5 text-xs font-medium text-gray-700 bg-gray-50 border-b py-3 px-4">
              <div className="col-span-2">Representative</div>
              <div className="text-right">Total Sales</div>
              <div className="text-right">Total Revenue</div>
              <div className="text-right">Avg. Sale Value</div>
            </div>
            {(data.items || []).length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">No data found for the selected period.</div>
            ) : (
              data.items.map(item => (
                <div key={item.id} className="grid grid-cols-5 text-sm border-b py-3 px-4 items-center hover:bg-gray-50">
                  <div className="col-span-2">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.email}</div>
                  </div>
                  <div className="text-right">{item.totalSales.toLocaleString()}</div>
                  <div className="text-right">${item.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <div className="text-right">${item.avgSaleValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </ReportLayout>
  )
}
