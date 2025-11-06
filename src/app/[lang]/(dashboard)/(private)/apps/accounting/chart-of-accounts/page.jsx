"use client"

import { useEffect, useMemo, useState, useCallback } from 'react'

function formatKSh(n) {
  const num = Number(n || 0)
  return `KSh ${num.toLocaleString('en-KE')}`
}

function filterTree(nodes, term) {
  if (!term) return nodes
  const q = term.toLowerCase()
  const walk = list => {
    const out = []
    for (const n of list) {
      const selfMatch = (n.code || '').toLowerCase().includes(q) || (n.name || '').toLowerCase().includes(q)
      const kids = walk(n.children || [])
      if (selfMatch || kids.length) out.push({ ...n, children: kids })
    }
    return out
  }
  return walk(nodes || [])
}

function sumTotals(nodes) {
  const s = { debit: 0, credit: 0 }
  const walk = list => {
    for (const n of list) {
      s.debit += Number(n.debit || 0)
      s.credit += Number(n.credit || 0)
      if (n.children?.length) walk(n.children)
    }
  }
  walk(nodes || [])
  return s
}

export default function ChartOfAccountsPage() {
  const [tree, setTree] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [openMap, setOpenMap] = useState({})

  const toggle = useCallback(id => setOpenMap(m => ({ ...m, [id]: !m[id] })), [])
  const expandAll = useCallback(() => {
    const m = {}
    const walk = list => { for (const n of list) { m[n.id] = true; if (n.children?.length) walk(n.children) } }
    walk(tree)
    setOpenMap(m)
  }, [tree])
  const collapseAll = useCallback(() => setOpenMap({}), [])

  const fetchData = async (after, before) => {
    setLoading(true)
    setError('')
    try {
      const qp = new URLSearchParams()
      if (after) qp.set('after', after)
      if (before) qp.set('before', before)
      const url = `/api/accounting/chart-of-accounts${qp.toString() ? `?${qp.toString()}` : ''}`
      const res = await fetch(url)
      const json = await res.json()
      setTree(json.tree || [])
    } catch (e) {
      setError('Failed to load accounts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const filtered = useMemo(() => filterTree(tree, search), [tree, search])
  const totals = useMemo(() => sumTotals(filtered), [filtered])

  const Row = ({ node, level = 0 }) => {
    const hasChildren = node.children && node.children.length > 0
    const isOpen = openMap[node.id] || false
    return (
      <>
        <div className="grid grid-cols-12 items-center gap-2 px-2 py-1 border-b text-sm">
          <div className="col-span-6 flex items-center">
            <div style={{ width: level * 16 }} />
            {hasChildren && (
              <button className="mr-2 text-gray-600 hover:text-gray-900" onClick={() => toggle(node.id)}>{isOpen ? '▾' : '▸'}</button>
            )}
            {!hasChildren && <span className="mr-2 opacity-0">▸</span>}
            <span className="font-mono text-xs text-gray-500 mr-3">{node.code}</span>
            <span className="font-medium">{node.name}</span>
            <span className="ml-2 text-xs rounded px-2 py-0.5 bg-gray-100 text-gray-600">{node.type}</span>
            {!node.isActive && <span className="ml-2 text-xs rounded px-2 py-0.5 bg-red-50 text-red-600">inactive</span>}
          </div>
          <div className="col-span-2 text-right tabular-nums">{formatKSh(node.debit)}</div>
          <div className="col-span-2 text-right tabular-nums">{formatKSh(node.credit)}</div>
          <div className="col-span-2 text-right font-semibold tabular-nums">{formatKSh((Number(node.debit||0)-Number(node.credit||0)))}</div>
        </div>
        {hasChildren && isOpen && node.children.map(c => (
          <Row key={c.id} node={c} level={level + 1} />
        ))}
      </>
    )
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Chart of Accounts</h1>
        <div className="flex items-center gap-2">
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="border rounded px-2 py-1 text-sm" placeholder="From" />
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="border rounded px-2 py-1 text-sm" placeholder="To" />
          <button className="px-3 py-1 rounded bg-blue-600 text-white text-sm" onClick={() => fetchData(fromDate, toDate)}>Apply</button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search code or name…" className="border rounded px-3 py-2 w-full" />
        <button className="px-3 py-2 rounded bg-gray-100" onClick={expandAll}>Expand All</button>
        <button className="px-3 py-2 rounded bg-gray-100" onClick={collapseAll}>Collapse All</button>
      </div>

      <div className="bg-white border rounded shadow overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-2 py-2 bg-gray-50 text-xs font-medium border-b">
          <div className="col-span-6">Account</div>
          <div className="col-span-2 text-right">Debit</div>
          <div className="col-span-2 text-right">Credit</div>
          <div className="col-span-2 text-right">Balance</div>
        </div>
        {loading && <div className="p-4 text-sm text-gray-500">Loading…</div>}
        {error && <div className="p-4 text-sm text-red-600">{error}</div>}
        {!loading && filtered.map(n => <Row key={n.id} node={n} />)}
        <div className="grid grid-cols-12 gap-2 px-2 py-2 bg-gray-50 text-sm font-semibold border-t">
          <div className="col-span-6">Totals</div>
          <div className="col-span-2 text-right">{formatKSh(totals.debit)}</div>
          <div className="col-span-2 text-right">{formatKSh(totals.credit)}</div>
          <div className="col-span-2 text-right">{formatKSh(totals.debit - totals.credit)}</div>
        </div>
      </div>
    </div>
  )
}
