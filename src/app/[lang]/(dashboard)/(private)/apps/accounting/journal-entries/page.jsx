"use client"

import { useEffect, useMemo, useState } from 'react'

function formatKSh(n) {
  const num = Number(n || 0)
  return `KSh ${num.toLocaleString('en-KE')}`
}

const emptyLine = () => ({ accountId: '', description: '', debit: '', credit: '' })

export default function JournalEntriesPage() {
  const [items, setItems] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [q, setQ] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const [addOpen, setAddOpen] = useState(false)
  const [entryDate, setEntryDate] = useState('')
  const [reference, setReference] = useState('')
  const [description, setDescription] = useState('')
  const [lines, setLines] = useState(Array.from({ length: 10 }, emptyLine))
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)

  const totals = useMemo(() => {
    const debit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0)
    const credit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0)
    return { debit, credit, diff: debit - credit }
  }, [lines])

  const fetchEntries = async (after, before, query) => {
    setLoading(true)
    setError('')
    try {
      const qp = new URLSearchParams()
      if (after) qp.set('after', after)
      if (before) qp.set('before', before)
      if (query) qp.set('q', query)
      const url = `/api/accounting/journal-entries${qp.toString() ? `?${qp.toString()}` : ''}`
      const res = await fetch(url)
      const json = await res.json()
      setItems(json.items || [])
    } catch (e) {
      setError('Failed to load journal entries')
    } finally {
      setLoading(false)
    }
  }

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/accounting/accounts')
      const json = await res.json()
      const list = (json.items || []).filter(a => a.isActive !== false)
      list.sort((a, b) => (a.accountCode || '').localeCompare(b.accountCode || ''))
      setAccounts(list)
    } catch {}
  }

  useEffect(() => {
    fetchEntries()
    fetchAccounts()
    const now = new Date()
    setEntryDate(now.toISOString().slice(0, 16))
  }, [])

  const applyFilters = () => {
    fetchEntries(fromDate, toDate, q)
  }

  const resetForm = () => {
    setReference('')
    setDescription('')
    setLines(Array.from({ length: 10 }, emptyLine))
    const now = new Date()
    setEntryDate(now.toISOString().slice(0, 16))
    setSaveError('')
  }

  const addRow = () => setLines(prev => [...prev, emptyLine()])

  const setLine = (idx, patch) => setLines(prev => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)))

  const save = async () => {
    setSaving(true)
    setSaveError('')
    try {
      if (Math.round(totals.diff * 100) !== 0) {
        setSaveError('Debits must equal credits')
        setSaving(false)
        return
      }
      const payload = {
        entryDate: entryDate ? new Date(entryDate).toISOString() : new Date().toISOString(),
        reference: reference || null,
        description: description || '',
        lines: lines
          .filter(l => l.accountId && ((Number(l.debit) || 0) > 0 || ((Number(l.credit) || 0) > 0)))
          .map(l => ({ accountId: l.accountId, description: l.description, debit: Number(l.debit) || 0, credit: Number(l.credit) || 0 }))
      }
      if (!payload.lines.length) {
        setSaveError('Add at least one line with amount')
        setSaving(false)
        return
      }
      const res = await fetch('/api/accounting/journal-entries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const json = await res.json()
      if (!res.ok) {
        setSaveError(json?.error || 'Failed to save entry')
        setSaving(false)
        return
      }
      setAddOpen(false)
      resetForm()
      fetchEntries(fromDate, toDate, q)
    } catch (e) {
      setSaveError('Failed to save entry')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Journal Entries</h1>
        <div className="flex items-center gap-2">
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="border rounded px-2 py-1 text-sm" />
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="border rounded px-2 py-1 text-sm" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search..." className="border rounded px-2 py-1 text-sm" />
          <button className="px-3 py-1 rounded bg-blue-600 text-white text-sm" onClick={applyFilters}>Apply</button>
          <button className="px-3 py-2 rounded bg-primary text-white" onClick={() => { setAddOpen(true); resetForm() }}>Add</button>
        </div>
      </div>

      <div className="bg-white border rounded shadow overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-2 py-2 bg-gray-50 text-xs font-medium border-b">
          <div className="col-span-2">Journal Date</div>
          <div className="col-span-2">Entry #</div>
          <div className="col-span-2">Reference</div>
          <div className="col-span-3">Description</div>
          <div className="col-span-1 text-right">Debit</div>
          <div className="col-span-1 text-right">Credit</div>
          <div className="col-span-1 text-right">Diff</div>
        </div>
        {loading && <div className="p-4 text-sm text-gray-500">Loading…</div>}
        {error && <div className="p-4 text-sm text-red-600">{error}</div>}
        {!loading && items.map(row => (
          <div key={row.id} className="grid grid-cols-12 gap-2 px-2 py-2 border-b text-sm">
            <div className="col-span-2">{new Date(row.entryDate).toLocaleString()}</div>
            <div className="col-span-2 font-mono text-xs">{row.entryNumber}</div>
            <div className="col-span-2">{row.reference || '-'}</div>
            <div className="col-span-3">{row.description}</div>
            <div className="col-span-1 text-right tabular-nums">{formatKSh(row.totalDebit)}</div>
            <div className="col-span-1 text-right tabular-nums">{formatKSh(row.totalCredit)}</div>
            <div className="col-span-1 text-right tabular-nums">{formatKSh(Number(row.totalDebit) - Number(row.totalCredit))}</div>
          </div>
        ))}
      </div>

      {addOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50">
          <div className="bg-white w-full max-w-5xl mt-10 rounded shadow-lg border p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold">Journal Entry</div>
              <button className="px-2 py-1" onClick={() => setAddOpen(false)}>✕</button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-xs text-gray-600 mb-1">Reference No.</div>
                <input value={reference} onChange={e => setReference(e.target.value)} className="border rounded px-2 py-2 w-full" placeholder="e.g., INV/2025/0001" />
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">Journal Date</div>
                <input type="datetime-local" value={entryDate} onChange={e => setEntryDate(e.target.value)} className="border rounded px-2 py-2 w-full" />
              </div>
              <div className="col-span-2">
                <div className="text-xs text-gray-600 mb-1">Additional notes</div>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="border rounded px-2 py-2 w-full" rows={3} />
              </div>
            </div>

            <div className="border rounded overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-2 py-2 bg-gray-50 text-xs font-medium border-b">
                <div className="col-span-1">#</div>
                <div className="col-span-5">Account</div>
                <div className="col-span-3">Description</div>
                <div className="col-span-1 text-right">Debit</div>
                <div className="col-span-1 text-right">Credit</div>
                <div className="col-span-1"></div>
              </div>
              {lines.map((l, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 px-2 py-2 border-b text-sm items-center">
                  <div className="col-span-1 text-xs text-gray-500">{idx + 1}</div>
                  <div className="col-span-5">
                    <select value={l.accountId} onChange={e => setLine(idx, { accountId: e.target.value })} className="border rounded px-2 py-2 w-full">
                      <option value="">Please Select</option>
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.accountCode} - {a.accountName} - {a.accountType}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input value={l.description} onChange={e => setLine(idx, { description: e.target.value })} className="border rounded px-2 py-2 w-full" />
                  </div>
                  <div className="col-span-1">
                    <input type="number" step="0.01" value={l.debit} onChange={e => setLine(idx, { debit: e.target.value })} className="border rounded px-2 py-2 w-full text-right" />
                  </div>
                  <div className="col-span-1">
                    <input type="number" step="0.01" value={l.credit} onChange={e => setLine(idx, { credit: e.target.value })} className="border rounded px-2 py-2 w-full text-right" />
                  </div>
                  <div className="col-span-1 text-right">
                    <button className="text-red-600 text-xs" onClick={() => setLines(prev => prev.filter((_, i) => i !== idx))}>Remove</button>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between px-2 py-2">
                <button className="px-3 py-2 rounded bg-gray-100" onClick={addRow}>Add more row</button>
                <div className="grid grid-cols-3 gap-4 w-1/2 text-sm">
                  <div className="text-right">Total</div>
                  <div className="text-right font-semibold">{formatKSh(totals.debit)}</div>
                  <div className="text-right font-semibold">{formatKSh(totals.credit)}</div>
                </div>
              </div>
            </div>

            {saveError && <div className="mt-2 text-sm text-red-600">{saveError}</div>}

            <div className="mt-4 flex items-center justify-end gap-2">
              <button className="px-3 py-2 rounded bg-gray-100" onClick={() => setAddOpen(false)}>Cancel</button>
              <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={save} disabled={saving}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
