"use client"

import { useEffect, useMemo, useState } from 'react'
import ReportLayout from '@/components/reports/ReportLayout'
import useReportQuery from '@/components/reports/useReportQuery'

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

export default function TaxReport({ lang = 'en' }) {
  const monthStart = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1), [])
  const today = useMemo(() => new Date(), [])
  const { params, setParams } = useReportQuery({ from: toDateInputValue(monthStart), to: toDateInputValue(today) })

  const [data, setData] = useState({ range: { from: monthStart, to: today }, salesTaxTotal: 0, inputTaxTotal: 0, netTax: 0, series: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchReport = async () => {
    setLoading(true)
    setError('')
    try {
      const sp = new URLSearchParams()
      if (params.from) sp.set('from', params.from)
      if (params.to) sp.set('to', params.to)
      const res = await fetch(`/api/reports/tax${sp.toString() ? `?${sp.toString()}` : ''}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load report')
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError('Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReport() /* eslint-disable-line react-hooks/exhaustive-deps */ }, [params.from, params.to])

  const breadcrumbs = [
    { label: 'Reports', href: `/${lang}/apps/reports` },
    { label: 'Tax Report' }
  ]

  const exportCsv = () => {
    const rows = []
    rows.push(['Date', 'Sales Tax'])
    for (const r of (data.series || [])) rows.push([r.date, String(r.salesTax)])
    rows.push([])
    rows.push(['Sales Tax Total', String(data.salesTaxTotal)])
    rows.push(['Input Tax Total', String(data.inputTaxTotal)])
    rows.push(['Net Tax', String(data.netTax)])
    const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    downloadCsv(`tax-${params.from || ''}-${params.to || ''}.csv`, csv)
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
    </div>
  )

  return (
    <ReportLayout title="Tax Report" description="Sales tax collected and net tax" breadcrumbs={breadcrumbs} actions={actions} filters={filters}>
      {loading && <div className="text-sm text-gray-500">Loading…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="border rounded p-3">
              <div className="text-sm font-medium mb-2">Sales Tax</div>
              <div className="text-lg font-semibold">{Number(data.salesTaxTotal || 0).toLocaleString()}</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-sm font-medium mb-2">Input Tax</div>
              <div className="text-lg font-semibold">{Number(data.inputTaxTotal || 0).toLocaleString()}</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-sm font-medium mb-2">Net Tax</div>
              <div className="text-lg font-semibold">{Number(data.netTax || 0).toLocaleString()}</div>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold mb-2">Sales Tax by Date</div>
            <div className="mb-3">
              <div className="flex items-end gap-1 h-24">
                {((data.series || [])).map((s) => {
                  const max = Math.max(1, ...((data.series || [])).map(r => Number(r.salesTax || 0)))
                  const h = Math.max(4, (Number(s.salesTax || 0) / max) * 100)
                  return <div key={s.date} title={`${s.date}: ${Number(s.salesTax || 0).toLocaleString()}`} style={{ height: `${h}%`, width: '8px', backgroundColor: '#2563eb' }} />
                })}
              </div>
            </div>
            <div className="border rounded">
              <div className="grid grid-cols-2 text-xs font-medium text-gray-700 border-b py-2 px-3">
                <div>Date</div>
                <div className="text-right">Sales Tax</div>
              </div>
              {(data.series || []).map(r => (
                <div key={r.date} className="grid grid-cols-2 text-sm border-b py-2 px-3">
                  <div>{r.date}</div>
                  <div className="text-right">{Number(r.salesTax || 0).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </ReportLayout>
  )
}
