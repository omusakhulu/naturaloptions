"use client"

import React, { useEffect, useState } from 'react'
import ReportLayout from '@/components/reports/ReportLayout'
import useReportQuery from '@/components/reports/useReportQuery'
import { Avatar, Chip } from '@mui/material'

type Row = {
  id: string
  user: string
  userImage?: string
  action: string
  entityType: string
  entityId: string
  description: string
  icon: string
  color: string
  date: string
}

type Data = {
  range: { from: string; to: string }
  items: Row[]
}

export default function ActivityLogReportTSX({ lang = 'en' }: { lang?: string }) {
  const { params, setParams } = useReportQuery({ from: '', to: '', userId: '', entityType: '' })
  const [data, setData] = useState<Data>({ range: { from: '', to: '' }, items: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchReport = async () => {
    setLoading(true)
    setError('')
    try {
      const sp = new URLSearchParams()
      if (params.from) sp.set('from', params.from)
      if (params.to) sp.set('to', params.to)
      if (params.userId) sp.set('userId', String(params.userId))
      if (params.entityType) sp.set('entityType', String(params.entityType))
      
      const res = await fetch(`/api/reports/activity-log${sp.toString() ? `?${sp.toString()}` : ''}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load activity logs')
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
  }, [params.from, params.to, params.userId, params.entityType])

  const breadcrumbs = [
    { label: 'Reports', href: `/${lang}/apps/reports` },
    { label: 'Activity Log' }
  ]

  const getStatusColor = (color: string) => {
    switch (color) {
      case 'primary': return 'primary'
      case 'success': return 'success'
      case 'warning': return 'warning'
      case 'error': return 'error'
      case 'info': return 'info'
      default: return 'default'
    }
  }

  return (
    <ReportLayout
      title="Activity Log"
      description="Timeline of system activities and user actions"
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
            <div className="text-xs text-gray-600 mb-1">Entity Type</div>
            <select className="border rounded px-3 py-2 w-full" value={params.entityType || ''} onChange={e => setParams({ entityType: e.target.value })}>
              <option value="">All Entities</option>
              <option value="ORDER">Order</option>
              <option value="PRODUCT">Product</option>
              <option value="INVOICE">Invoice</option>
              <option value="CUSTOMER">Customer</option>
              <option value="WAREHOUSE">Warehouse</option>
            </select>
          </div>
        </div>
      }
    >
      {loading && <div className="text-sm text-gray-500">Loading activity logs…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="border rounded overflow-hidden">
          <div className="grid grid-cols-12 text-xs font-medium text-gray-700 bg-gray-50 border-b py-3 px-4">
            <div className="col-span-2">Date & Time</div>
            <div className="col-span-2">User</div>
            <div className="col-span-2">Action</div>
            <div className="col-span-2">Entity</div>
            <div className="col-span-4">Description</div>
          </div>
          {(data.items || []).length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No activity logs found for the selected criteria.</div>
          ) : (
            data.items.map(item => (
              <div key={item.id} className="grid grid-cols-12 text-sm border-b py-3 px-4 items-center hover:bg-gray-50">
                <div className="col-span-2 text-gray-600">
                  {new Date(item.date).toLocaleString()}
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <Avatar src={item.userImage} sx={{ width: 24, height: 24 }} />
                  <span className="truncate">{item.user}</span>
                </div>
                <div className="col-span-2">
                  <Chip 
                    label={item.action} 
                    size="small" 
                    color={getStatusColor(item.color) as any}
                    variant="tonal"
                  />
                </div>
                <div className="col-span-2">
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {item.entityType}
                  </span>
                  <div className="text-xs text-gray-400 mt-1">ID: {item.entityId}</div>
                </div>
                <div className="col-span-4 text-gray-700">
                  {item.description}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </ReportLayout>
  )
}
