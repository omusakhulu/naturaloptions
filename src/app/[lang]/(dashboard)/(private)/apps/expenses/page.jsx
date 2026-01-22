"use client"

import { useEffect, useMemo, useState } from 'react'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

export default function Page() {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [accounts, setAccounts] = useState([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [entries, setEntries] = useState('All')
  const [showColMenu, setShowColMenu] = useState(false)
  const [open, setOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState(-1)
  const [form, setForm] = useState({ reference: '', category: '', amount: '', account: '', date: '' })
  // Add Expense detailed fields
  const [location, setLocation] = useState('NATURAL OPTIONS (M.0001)')
  const [subCategory, setSubCategory] = useState('')
  const [expenseFor, setExpenseFor] = useState('None')
  const [expenseContact, setExpenseContact] = useState('')
  const [attachment, setAttachment] = useState(null)
  const [tax, setTax] = useState('None')
  const [isRefund, setIsRefund] = useState(false)
  const [isRecurring, setIsRecurring] = useState(false)
  const [recInterval, setRecInterval] = useState('')
  const [recUnit, setRecUnit] = useState('Days')
  const [recRepetitions, setRecRepetitions] = useState('')
  const [payAmount, setPayAmount] = useState('')
  const [paidOn, setPaidOn] = useState('')
  const [payMethod, setPayMethod] = useState('Cash')
  const [payNote, setPayNote] = useState('')

  const [columns, setColumns] = useState([
    { key: 'action', label: 'Action', visible: true },
    { key: 'date', label: 'Date', visible: true },
    { key: 'reference', label: 'Reference No', visible: true },
    { key: 'category', label: 'Expense Category', visible: true },
    { key: 'account', label: 'Account', visible: true },
    { key: 'amount', label: 'Amount', visible: true },
    { key: 'note', label: 'Note', visible: true }
  ])

  const fetchAll = async () => {
    const [eRes, aRes] = await Promise.all([
      fetch('/api/expenses'),
      fetch('/api/payment-accounts')
    ])
    const eJson = await eRes.json()
    const aJson = await aRes.json()
    setRows(eJson.items || [])
    setTotal(eJson.total || 0)
    setAccounts(aJson.items || [])
  }

  useEffect(() => { fetchAll() }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = rows
    if (q) {
      list = rows.filter(r => [
        'category', 'note', 'accountId'
      ].some(k => String(r[k] || '').toLowerCase().includes(q)))
    }
    if (entries !== 'All') {
      const n = parseInt(entries, 10) || 10
      list = list.slice(0, n)
    }
    return list
  }, [rows, search, entries])

  const visibleCols = columns.filter(c => c.visible)
  const toggleColumn = key => setColumns(prev => prev.map(c => (c.key === key ? { ...c, visible: !c.visible } : c)))

  const lineData = useMemo(() => {
    const byDay = new Map()
    for (const r of rows) {
      const d = new Date(r.date)
      const key = d.toISOString().slice(0,10)
      byDay.set(key, (byDay.get(key) || 0) + Number(r.amount || 0))
    }
    const labels = Array.from(byDay.keys()).sort()
    const data = labels.map(l => byDay.get(l))
    return {
      labels,
      datasets: [{ label: 'Daily Expenses', data, borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', tension: 0.3 }]
    }
  }, [rows])

  const resetDetailed = () => {
    setLocation('NATURAL OPTIONS (M.0001)')
    setSubCategory('')
    setExpenseFor('None')
    setExpenseContact('')
    setAttachment(null)
    setTax('None')
    setIsRefund(false)
    setIsRecurring(false)
    setRecInterval('')
    setRecUnit('Days')
    setRecRepetitions('')
    setPayAmount('')
    setPaidOn('')
    setPayMethod('Cash')
    setPayNote('')
  }
  const onNew = () => { setEditingIndex(-1); setForm({ reference: '', category: '', amount: '', account: '', date: '' }); resetDetailed(); setOpen(true) }
  const onEdit = i => { setEditingIndex(i); const r = rows[i]; setForm({ reference: r.note || '', category: r.category || '', amount: String(r.amount || ''), account: r.accountId || '', date: (r.date || '').slice(0,10) }); resetDetailed(); setOpen(true) }
  const onDelete = async i => { const r = rows[i]; await fetch(`/api/expenses/${r.id}`, { method: 'DELETE' }); await fetchAll() }

  const onSubmit = async () => {
    // Build payload for existing API; extra fields currently not persisted
    const payload = { amount: Number(form.amount || payAmount || 0), category: subCategory ? `${form.category} / ${subCategory}` : form.category, accountId: form.account, date: paidOn ? paidOn : form.date, note: [form.reference, payNote].filter(Boolean).join(' | ') }
    if (editingIndex >= 0) {
      const id = rows[editingIndex].id
      await fetch(`/api/expenses/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    } else {
      await fetch('/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    }
    setOpen(false)
    await fetchAll()
  }

  const totalPaid = useMemo(() => rows.reduce((s, r) => s + Number(r.amount || 0), 0), [rows])

  return (
    <div className='p-8 space-y-4'>
      <h1 className='text-2xl font-semibold'>Expenses</h1>

      {/* KPI cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <div className='bg-white border rounded shadow p-4'>
          <div className='text-xs text-gray-500'>Total Expenses</div>
          <div className='text-2xl font-semibold'>KSh {Number(totalPaid).toLocaleString('en-KE')}</div>
        </div>
        <div className='bg-white border rounded shadow p-4'>
          <div className='text-xs text-gray-500'>This Month</div>
          <div className='text-2xl font-semibold'>KSh {Number(rows.filter(r => new Date(r.date).getMonth() === new Date().getMonth()).reduce((s,r)=>s+Number(r.amount||0),0)).toLocaleString('en-KE')}</div>
        </div>
        <div className='bg-white border rounded shadow p-4'>
          <div className='text-xs text-gray-500'>Average per Day</div>
          <div className='text-2xl font-semibold'>KSh {(() => { const map = new Set(rows.map(r => new Date(r.date).toISOString().slice(0,10))); return map.size ? Math.round(totalPaid / map.size).toLocaleString('en-KE') : 0 })()}</div>
        </div>
        <div className='bg-white border rounded shadow p-4'>
          <div className='text-xs text-gray-500'>Entries</div>
          <div className='text-2xl font-semibold'>{rows.length}</div>
        </div>
      </div>

      {/* Charts */}
      <div className='bg-white border rounded shadow p-4'>
        <div className='text-sm text-gray-600 mb-2'>Daily trend</div>
        <Line data={lineData} options={{ plugins: { legend: { display: false } } }} height={70} />
      </div>

      {/* Filters and toolbar */}
      <div className='bg-white border rounded shadow p-4 relative'>
        <div className='flex items-center justify-between mb-3'>
          <button className='text-sm' onClick={() => setFiltersOpen(o => !o)}><i className='tabler-filter' /> Filters</button>
          <div className='flex items-center gap-2'>
            <button onClick={() => setOpen(true)} className='bg-indigo-600 hover:bg-indigo-700 text-white rounded px-4 py-2 text-sm'>+ Add</button>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder='Search…' className='border rounded p-2 text-sm' />
          </div>
        </div>
        {filtersOpen && (
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-3'>
            <div>
              <label className='block text-xs text-gray-500 mb-1'>From</label>
              <input type='date' className='border rounded p-2 w-full' />
            </div>
            <div>
              <label className='block text-xs text-gray-500 mb-1'>To</label>
              <input type='date' className='border rounded p-2 w-full' />
            </div>
            <div>
              <label className='block text-xs text-gray-500 mb-1'>Category</label>
              <input className='border rounded p-2 w-full' placeholder='All' />
            </div>
            <div>
              <label className='block text-xs text-gray-500 mb-1'>Account</label>
              <select className='border rounded p-2 w-full'>
                <option value=''>All</option>
                {accounts.map(a => (<option key={a.id} value={a.id}>{a.name}</option>))}
              </select>
            </div>
          </div>
        )}

        {/* Table */}
        <div className='overflow-auto'>
          <table className='min-w-full text-sm'>
            <thead>
              <tr className='bg-gray-50 text-gray-600'>
                {visibleCols.map(c => (
                  <th key={c.key} className='text-left font-medium px-3 py-2 border-b'>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={visibleCols.length} className='text-center text-gray-500 py-10'>No data available in table</td>
                </tr>
              ) : (
                filtered.map((r, i) => (
                  <tr key={r.id || i} className='border-b'>
                    {visibleCols.map(c => (
                      <td key={c.key} className='px-3 py-2'>
                        {c.key === 'action' ? (
                          <div className='flex items-center gap-2'>
                            <button className='border rounded px-2 py-1 text-xs' onClick={() => onEdit(i)}>Edit</button>
                            <button className='border rounded px-2 py-1 text-xs' onClick={() => onDelete(i)}>Delete</button>
                          </div>
                        ) : c.key === 'date' ? (
                          new Date(r.date).toLocaleString()
                        ) : c.key === 'reference' ? (
                          r.note || '-'
                        ) : c.key === 'account' ? (
                          r.account?.name || r.accountId
                        ) : c.key === 'amount' ? (
                          `KSh ${Number(r.amount || 0).toLocaleString('en-KE')}`
                        ) : (
                          String(r[c.key] ?? '')
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className='bg-gray-50 text-gray-700'>
                {visibleCols.map((c, i) => (
                  <td key={c.key} className='px-3 py-2 font-medium'>
                    {c.key === 'amount' ? `KSh ${Number(total).toLocaleString('en-KE')}` : i === 0 ? 'Total:' : ''}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {open && (
        <div className='fixed inset-0 z-50 bg-black/30 overflow-y-auto'>
          <div className='min-h-full flex items-start sm:items-center justify-center p-4 sm:p-6'>
            <div className='bg-white rounded shadow-lg w-full max-w-5xl p-5 space-y-4 overflow-y-auto max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)]'>
            <div className='flex items-center justify-between'>
              <div className='text-lg font-medium'>Add Expense</div>
              <button onClick={() => setOpen(false)} className='text-gray-500 hover:text-gray-700'>✕</button>
            </div>

            {/* Header section */}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              <div>
                <label className='block text-xs text-gray-500 mb-1'>Business Location*</label>
                <select value={location} onChange={e=>setLocation(e.target.value)} className='border rounded p-2 w-full'>
                  <option>NATURAL OPTIONS (M.0001)</option>
                  <option>Warehouse A</option>
                </select>
              </div>
              <div>
                <label className='block text-xs text-gray-500 mb-1'>Expense Category*</label>
                <input value={form.category} onChange={e=>setForm({ ...form, category: e.target.value })} className='border rounded p-2 w-full' placeholder='Please Select' />
              </div>
              <div>
                <label className='block text-xs text-gray-500 mb-1'>Sub category</label>
                <input value={subCategory} onChange={e=>setSubCategory(e.target.value)} className='border rounded p-2 w-full' placeholder='Please Select' />
              </div>
              <div>
                <label className='block text-xs text-gray-500 mb-1'>Reference No</label>
                <input value={form.reference} onChange={e=>setForm({ ...form, reference: e.target.value })} className='border rounded p-2 w-full' placeholder='Leave empty to autogenerate' />
              </div>
              <div>
                <label className='block text-xs text-gray-500 mb-1'>Date*</label>
                <input type='datetime-local' value={paidOn} onChange={e=>setPaidOn(e.target.value)} className='border rounded p-2 w-full' />
              </div>
              <div>
                <label className='block text-xs text-gray-500 mb-1'>Expense for</label>
                <select value={expenseFor} onChange={e=>setExpenseFor(e.target.value)} className='border rounded p-2 w-full'>
                  <option>None</option>
                  <option>Employee</option>
                  <option>Project</option>
                  <option>Vendor</option>
                </select>
              </div>
              <div>
                <label className='block text-xs text-gray-500 mb-1'>Expense for contact</label>
                <input value={expenseContact} onChange={e=>setExpenseContact(e.target.value)} className='border rounded p-2 w-full' placeholder='Select contact' />
              </div>
              <div>
                <label className='block text-xs text-gray-500 mb-1'>Attach Document</label>
                <input type='file' onChange={e=>setAttachment(e.target.files?.[0] || null)} className='block w-full text-sm' />
                <div className='text-[11px] text-gray-500 mt-1'>Max 5MB. Allowed: pdf, csv, zip, doc, docx, jpeg, jpg, png</div>
              </div>
              <div>
                <label className='block text-xs text-gray-500 mb-1'>Applicable Tax</label>
                <select value={tax} onChange={e=>setTax(e.target.value)} className='border rounded p-2 w-full'>
                  <option>None</option>
                  <option>VAT 16%</option>
                </select>
              </div>
              <div>
                <label className='block text-xs text-gray-500 mb-1'>Total amount*</label>
                <input type='number' value={form.amount} onChange={e=>setForm({ ...form, amount: e.target.value })} className='border rounded p-2 w-full' placeholder='Total amount' />
              </div>
              <div className='md:col-span-3'>
                <label className='block text-xs text-gray-500 mb-1'>Expense note</label>
                <textarea value={payNote} onChange={e=>setPayNote(e.target.value)} className='border rounded p-2 w-full' rows={3} />
              </div>
              <div className='flex items-center gap-2'>
                <input id='isRefund' type='checkbox' checked={isRefund} onChange={e=>setIsRefund(e.target.checked)} />
                <label htmlFor='isRefund' className='text-sm text-gray-700'>Is refund?</label>
              </div>
            </div>

            {/* Recurring */}
            <div className='bg-gray-50 border rounded p-4 grid grid-cols-1 md:grid-cols-3 gap-4'>
              <label className='flex items-center gap-2'>
                <input type='checkbox' checked={isRecurring} onChange={e=>setIsRecurring(e.target.checked)} />
                <span className='text-sm text-gray-700'>Is Recurring?</span>
              </label>
              <div>
                <label className='block text-xs text-gray-500 mb-1'>Recurring interval*</label>
                <input value={recInterval} onChange={e=>setRecInterval(e.target.value)} className='border rounded p-2 w-full' placeholder='e.g. 1' />
              </div>
              <div>
                <label className='block text-xs text-gray-500 mb-1'>Unit</label>
                <select value={recUnit} onChange={e=>setRecUnit(e.target.value)} className='border rounded p-2 w-full'>
                  <option>Days</option>
                  <option>Weeks</option>
                  <option>Months</option>
                </select>
              </div>
              <div>
                <label className='block text-xs text-gray-500 mb-1'>No. of Repetitions</label>
                <input value={recRepetitions} onChange={e=>setRecRepetitions(e.target.value)} className='border rounded p-2 w-full' placeholder='Leave blank for infinite' />
              </div>
            </div>

            {/* Add payment */}
            <div className='bg-gray-50 border rounded p-4 grid grid-cols-1 md:grid-cols-4 gap-4'>
              <div>
                <label className='block text-xs text-gray-500 mb-1'>Amount*</label>
                <input type='number' value={payAmount} onChange={e=>setPayAmount(e.target.value)} className='border rounded p-2 w-full' />
              </div>
              <div>
                <label className='block text-xs text-gray-500 mb-1'>Paid on*</label>
                <input type='datetime-local' value={paidOn} onChange={e=>setPaidOn(e.target.value)} className='border rounded p-2 w-full' />
              </div>
              <div>
                <label className='block text-xs text-gray-500 mb-1'>Payment Account*</label>
                <select value={form.account} onChange={e=>setForm({ ...form, account: e.target.value })} className='border rounded p-2 w-full'>
                  <option value=''>None</option>
                  {accounts.map(a => (<option key={a.id} value={a.id}>{a.name}</option>))}
                </select>
              </div>
              <div>
                <label className='block text-xs text-gray-500 mb-1'>Payment Method*</label>
                <select value={payMethod} onChange={e=>setPayMethod(e.target.value)} className='border rounded p-2 w-full'>
                  <option>Cash</option>
                  <option>Card</option>
                  <option>Bank Transfer</option>
                  <option>M-PESA</option>
                </select>
              </div>
              <div className='md:col-span-4'>
                <label className='block text-xs text-gray-500 mb-1'>Payment note</label>
                <textarea value={payNote} onChange={e=>setPayNote(e.target.value)} className='border rounded p-2 w-full' rows={3} />
              </div>
              <div className='md:col-span-4 text-right text-sm text-gray-600'>Payment due: {(() => {
                const due = Number(form.amount || 0) - Number(payAmount || 0)
                return `KSh ${Number.isFinite(due) ? due.toLocaleString('en-KE') : '0'}`
              })()}</div>
            </div>

            <div className='flex items-center justify-end gap-2'>
              <button onClick={() => setOpen(false)} className='border rounded px-4 py-2 text-sm'>Cancel</button>
              <button onClick={onSubmit} className='bg-indigo-600 hover:bg-indigo-700 text-white rounded px-4 py-2 text-sm'>Save</button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
