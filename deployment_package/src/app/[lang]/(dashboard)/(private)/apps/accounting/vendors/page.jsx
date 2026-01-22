'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

export default function VendorsPage() {

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [entries, setEntries] = useState('All')
  const [showColMenu, setShowColMenu] = useState(false)

  const [columns, setColumns] = useState([
    { key: 'name', label: 'Name', visible: true },
    { key: 'email', label: 'Email', visible: true },
    { key: 'phone', label: 'Phone', visible: true },
    { key: 'paymentTerm', label: 'Payment Term', visible: true },
    { key: 'status', label: 'Status', visible: true },
    { key: 'billsCount', label: 'Bills', visible: true },
    { key: 'totalOwed', label: 'Total Owed', visible: true },
    { key: 'action', label: 'Action', visible: true }
  ])

  const [rows, setRows] = useState([])
  const [terms, setTerms] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [mounted, setMounted] = useState(false)

  const [addOpen, setAddOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(true)

  const openAdd = () => {
    setAddOpen(true)
  }

  const closeAdd = reason => {
    setAddOpen(false)
  }

  const initialForm = {
    name: '',
    email: '',
    phone: '',
    address: '',
    paymentTermId: '',
    isActive: true,
    shippingAddress: '',
    profile: {
      contactType: 'Suppliers',
      isBusiness: true,
      contactId: '',
      mobile: '',
      alternateContact: '',
      landline: '',
      assignedTo: '',
      taxNumber: '',
      openingBalance: '',
      payTermNote: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      country: '',
      zip: '',
      landmark: '',
      streetName: '',
      buildingNumber: '',
      additionalNumber: '',
      custom1: '',
      custom2: '',
      custom3: '',
      custom4: '',
      custom5: '',
      custom6: '',
      custom7: '',
      custom8: '',
      custom9: '',
      custom10: '',
      contactPersons: []
    }
  }
  const [form, setForm] = useState(initialForm)
  const canSave = form.name.trim().length > 0 && (!!form.profile.mobile || !!form.email)

  const fetchAll = async () => {
    setLoading(true)
    setError('')
    try {
      const [vRes, tRes] = await Promise.all([
        fetch('/api/vendors'),
        fetch('/api/payment-terms')
      ])
      const vendorsJson = await vRes.json()
      const termsJson = await tRes.json()
      setRows(vendorsJson.items || [])
      setTerms(termsJson.items || [])
    } catch (e) {
      setError('Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!addOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [addOpen])

  useEffect(() => {
    console.log('[vendors] state', { mounted, addOpen })
  }, [mounted, addOpen])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = rows
    if (q) {
      list = rows.filter(r =>
        ['name','email','phone','paymentTerm','status']
          .some(k => String(r[k] || '').toLowerCase().includes(q))
      )
    }
    if (entries !== 'All') {
      const n = parseInt(entries, 10) || 10
      list = list.slice(0, n)
    }
    return list
  }, [rows, search, entries])

  const visibleCols = columns.filter(c => c.visible)
  const toggleColumn = key => setColumns(prev => prev.map(c => (c.key === key ? { ...c, visible: !c.visible } : c)))

  const downloadCsv = () => {
    const header = visibleCols.map(c => c.label).join(',')
    const lines = filtered.map(r => visibleCols.map(c => JSON.stringify(
      c.key === 'totalOwed' ? `KSh ${Number(r.totalOwed||0).toLocaleString('en-KE')}` : r[c.key] ?? ''
    )).join(','))
    const csv = [header, ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'vendors.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const saveVendor = async () => {
    if (!canSave) return
    try {
      const payload = {
        ...form,
        profile: {
          ...form.profile,
          openingBalance: form.profile.openingBalance ? Number(form.profile.openingBalance) : 0
        }
      }
      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Failed to save vendor')
      closeAdd('saveVendor-success')
      setForm(initialForm)
      await fetchAll()
    } catch (e) {
      alert('Saving vendor failed')
    }
  }

  return (
    <div className='p-8 space-y-4'>
      <h1 className='text-2xl font-semibold'>Vendors</h1>

      {/* Filters */}
      <div className='bg-white border rounded shadow'>
        <button
          className='w-full text-left p-3 flex items-center gap-2 text-gray-700'
          onClick={() => setFiltersOpen(o => !o)}
        >
          <i className='tabler-filter' /> Filters
          <span className='ml-auto text-xs text-gray-500'>{filtersOpen ? 'Hide' : 'Show'}</span>
        </button>
        {filtersOpen && (
          <div className='px-4 pb-4 grid grid-cols-1 md:grid-cols-4 gap-4'>
            <div>
              <label className='block text-xs text-gray-500 mb-1'>Status</label>
              <select className='border rounded p-2 w-full'>
                <option value=''>All</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
            <div>
              <label className='block text-xs text-gray-500 mb-1'>Payment Term</label>
              <select className='border rounded p-2 w-full'>
                <option value=''>All</option>
                {terms.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Table card */}
      <div className='bg-white border rounded shadow p-4 relative'>
        <div className='flex flex-wrap items-center gap-3 mb-3'>
          <div className='flex items-center gap-2'>
            <span className='text-sm text-gray-600'>Show</span>
            <select
              className='border rounded p-1 text-sm'
              value={entries}
              onChange={e => setEntries(e.target.value)}
            >
              {['All','10','25','50','100'].map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
            <span className='text-sm text-gray-600'>entries</span>
          </div>

          <div className='flex items-center gap-2'>
            <button onClick={downloadCsv} className='border rounded px-3 py-1 text-sm'>Export CSV</button>
            <button onClick={downloadCsv} className='border rounded px-3 py-1 text-sm'>Export Excel</button>
            <button onClick={() => window.print()} className='border rounded px-3 py-1 text-sm'>Print</button>
            <div className='relative'>
              <button onClick={() => setShowColMenu(s => !s)} className='border rounded px-3 py-1 text-sm'>Column visibility</button>
              {showColMenu && (
                <div className='absolute z-10 mt-2 bg-white border rounded shadow p-3 w-56'>
                  <div className='text-xs font-medium mb-2'>Toggle columns</div>
                  <div className='space-y-2 max-h-56 overflow-auto'>
                    {columns.map(c => (
                      <label key={c.key} className='flex items-center gap-2 text-sm'>
                        <input type='checkbox' checked={c.visible} onChange={() => toggleColumn(c.key)} />
                        {c.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => window.print()} className='border rounded px-3 py-1 text-sm'>Export PDF</button>
          </div>

          <div className='ml-auto flex items-center gap-2'>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder='Search ...'
              className='border rounded p-2 text-sm'
            />
            <button
              type='button'
              onClick={e => {
                e.preventDefault()
                e.stopPropagation()
                console.log('[vendors] open add vendor modal')
                openAdd()
              }}
              className='bg-indigo-600 hover:bg-indigo-700 text-white rounded px-4 py-2 text-sm relative z-50 pointer-events-auto'
            >
              + Add Vendor
            </button>
          </div>
        </div>

        {loading && <div className='text-sm text-gray-500'>Loading…</div>}
        {error && <div className='text-sm text-red-600'>{error}</div>}

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
                filtered.map((r, idx) => (
                  <tr key={idx} className='border-b'>
                    {visibleCols.map(c => (
                      <td key={c.key} className='px-3 py-2'>
                        {c.key === 'status' ? (
                          <span className={`px-2 py-1 rounded text-xs ${r.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{r.status}</span>
                        ) : c.key === 'totalOwed' ? (
                          `KSh ${Number(r.totalOwed || 0).toLocaleString('en-KE')}`
                        ) : (
                          String(r[c.key] ?? '')
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className='flex items-center justify-end gap-2 mt-3'>
          <button className='border rounded px-3 py-1 text-sm text-gray-600' disabled>Previous</button>
          <button className='border rounded px-3 py-1 text-sm text-gray-600' disabled>Next</button>
        </div>
      </div>

      {/* Add Vendor Modal (simple drawer-like card) */}
      {mounted && addOpen && createPortal(
        <div
          data-vendors-add-modal-backdrop
          className='p-4 md:p-8'
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0, 0, 0, 0.45)', overflowY: 'auto' }}
          role='dialog'
          aria-modal='true'
          onClick={e => {
            if (e.target === e.currentTarget) closeAdd('backdrop')
          }}
        >
          <style
            dangerouslySetInnerHTML={{
              __html: `
                [data-vendors-add-modal-card] { color: rgb(17 24 39); }
                [data-vendors-add-modal-card] label { display: block; font-size: 12px; color: rgb(107 114 128); margin-bottom: 4px; }
                [data-vendors-add-modal-card] input,
                [data-vendors-add-modal-card] select,
                [data-vendors-add-modal-card] textarea {
                  width: 100%;
                  border: 1px solid rgb(209 213 219);
                  border-radius: 8px;
                  padding: 10px 12px;
                  font-size: 14px;
                  line-height: 20px;
                  background: #fff;
                }
                [data-vendors-add-modal-card] textarea { resize: vertical; }
                [data-vendors-add-modal-card] input[type='radio'] { width: auto; padding: 0; border: 0; }
                [data-vendors-add-modal-card] .vendors-radio-row { display: flex; gap: 12px; align-items: center; padding: 10px 12px; border: 1px solid rgb(209 213 219); border-radius: 8px; }
                [data-vendors-add-modal-card] .vendors-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
                @media (min-width: 640px) {
                  [data-vendors-add-modal-card] .vendors-grid { grid-template-columns: 1fr 1fr; }
                  [data-vendors-add-modal-card] [data-vendors-span='2'] { grid-column: 1 / -1; }
                }
              `
            }}
          />
          <div
            data-vendors-add-modal-card
            className='flex flex-col'
            style={{
              position: 'relative',
              width: 'min(96vw, 72rem)',
              margin: '2rem auto',
              height: 'calc(100vh - 4rem)',
              minHeight: 0,
              background: '#fff',
              borderRadius: '0.75rem',
              overflow: 'hidden',
              boxShadow: '0 20px 45px rgba(0,0,0,0.25)'
            }}
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
          >
            <div className='flex items-center justify-between p-4 border-b flex-none'>
              <h2 className='text-lg font-medium'>Add Vendor</h2>
              <button onClick={() => closeAdd('x')} className='text-gray-500 hover:text-gray-700'>✕</button>
            </div>

            <div
              className='p-4 overflow-y-auto flex-1 min-h-0'
              style={{ overflowY: 'auto', flex: '1 1 0%', minHeight: 0, WebkitOverflowScrolling: 'touch' }}
            >
              <div className='vendors-grid'>
                <div className='sm:col-span-1'>
                  <label className='block text-xs text-gray-500 mb-1'>Contact type*</label>
                  <select value={form.profile.contactType} onChange={e => setForm({ ...form, profile: { ...form.profile, contactType: e.target.value } })} className='border rounded p-2 w-full'>
                    <option>Suppliers</option>
                    <option>Customers</option>
                  </select>
                </div>

                <div className='sm:col-span-1'>
                  <label className='block text-xs text-gray-500 mb-1'>Individual / Business</label>
                  <div className='vendors-radio-row'>
                    <label className='flex items-center gap-1 text-sm'>
                      <input type='radio' checked={!form.profile.isBusiness} onChange={() => setForm({ ...form, profile: { ...form.profile, isBusiness: false } })} /> Individual
                    </label>
                    <label className='flex items-center gap-1 text-sm'>
                      <input type='radio' checked={form.profile.isBusiness} onChange={() => setForm({ ...form, profile: { ...form.profile, isBusiness: true } })} /> Business
                    </label>
                  </div>
                </div>

                <div className='sm:col-span-1'>
                  <label className='block text-xs text-gray-500 mb-1'>Contact ID</label>
                  <input value={form.profile.contactId} onChange={e => setForm({ ...form, profile: { ...form.profile, contactId: e.target.value } })} className='border rounded p-2 w-full' placeholder='Leave blank to auto generate' />
                </div>

                <div className='sm:col-span-1'>
                  <label className='block text-xs text-gray-500 mb-1'>Email</label>
                  <input type='email' value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className='border rounded p-2 w-full' />
                </div>

                <div className='sm:col-span-1'>
                  <label className='block text-xs text-gray-500 mb-1'>Mobile*</label>
                  <input value={form.profile.mobile} onChange={e => setForm({ ...form, profile: { ...form.profile, mobile: e.target.value } })} className='border rounded p-2 w-full' placeholder='Mobile' />
                </div>

                <div className='sm:col-span-1'>
                  <label className='block text-xs text-gray-500 mb-1'>Alternate contact number</label>
                  <input value={form.profile.alternateContact} onChange={e => setForm({ ...form, profile: { ...form.profile, alternateContact: e.target.value } })} className='border rounded p-2 w-full' placeholder='Alternate contact' />
                </div>

                <div className='sm:col-span-1'>
                  <label className='block text-xs text-gray-500 mb-1'>Landline</label>
                  <input value={form.profile.landline} onChange={e => setForm({ ...form, profile: { ...form.profile, landline: e.target.value } })} className='border rounded p-2 w-full' placeholder='Landline' />
                </div>

                <div className='sm:col-span-1'>
                  <label className='block text-xs text-gray-500 mb-1'>Assigned to</label>
                  <input value={form.profile.assignedTo} onChange={e => setForm({ ...form, profile: { ...form.profile, assignedTo: e.target.value } })} className='border rounded p-2 w-full' placeholder='Assignee' />
                </div>

                <div className='sm:col-span-2' data-vendors-span='2'>
                  <button onClick={() => setMoreOpen(o => !o)} className='bg-indigo-600 text-white rounded px-3 py-2 text-sm'>More Information {moreOpen ? '▲' : '▼'}</button>
                </div>

                {moreOpen && (
                  <>
                    <div className='sm:col-span-1'>
                      <label className='block text-xs text-gray-500 mb-1'>Tax number</label>
                      <input value={form.profile.taxNumber} onChange={e => setForm({ ...form, profile: { ...form.profile, taxNumber: e.target.value } })} className='border rounded p-2 w-full' placeholder='Tax number' />
                    </div>

                    <div className='sm:col-span-1'>
                      <label className='block text-xs text-gray-500 mb-1'>Opening Balance</label>
                      <input type='number' value={form.profile.openingBalance} onChange={e => setForm({ ...form, profile: { ...form.profile, openingBalance: e.target.value } })} className='border rounded p-2 w-full' placeholder='0' />
                    </div>

                    <div className='sm:col-span-2' data-vendors-span='2'>
                      <label className='block text-xs text-gray-500 mb-1'>Pay term</label>
                      <div className='grid grid-cols-2 gap-2'>
                        <select value={form.paymentTermId} onChange={e => setForm({ ...form, paymentTermId: e.target.value })} className='border rounded p-2 w-full'>
                          <option value=''>Please Select</option>
                          {terms.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                        <input value={form.profile.payTermNote} onChange={e => setForm({ ...form, profile: { ...form.profile, payTermNote: e.target.value } })} className='border rounded p-2 w-full' placeholder='Pay term note' />
                      </div>
                    </div>

                    <div className='sm:col-span-1'>
                      <label className='block text-xs text-gray-500 mb-1'>Address line 1</label>
                      <input value={form.profile.addressLine1} onChange={e => setForm({ ...form, profile: { ...form.profile, addressLine1: e.target.value } })} className='border rounded p-2 w-full' />
                    </div>

                    <div className='sm:col-span-1'>
                      <label className='block text-xs text-gray-500 mb-1'>Address line 2</label>
                      <input value={form.profile.addressLine2} onChange={e => setForm({ ...form, profile: { ...form.profile, addressLine2: e.target.value } })} className='border rounded p-2 w-full' />
                    </div>

                    <div className='sm:col-span-1'>
                      <label className='block text-xs text-gray-500 mb-1'>City</label>
                      <input value={form.profile.city} onChange={e => setForm({ ...form, profile: { ...form.profile, city: e.target.value } })} className='border rounded p-2 w-full' />
                    </div>

                    <div className='sm:col-span-1'>
                      <label className='block text-xs text-gray-500 mb-1'>State</label>
                      <input value={form.profile.state} onChange={e => setForm({ ...form, profile: { ...form.profile, state: e.target.value } })} className='border rounded p-2 w-full' />
                    </div>

                    <div className='sm:col-span-1'>
                      <label className='block text-xs text-gray-500 mb-1'>Country</label>
                      <input value={form.profile.country} onChange={e => setForm({ ...form, profile: { ...form.profile, country: e.target.value } })} className='border rounded p-2 w-full' />
                    </div>

                    <div className='sm:col-span-1'>
                      <label className='block text-xs text-gray-500 mb-1'>Zip Code</label>
                      <input value={form.profile.zip} onChange={e => setForm({ ...form, profile: { ...form.profile, zip: e.target.value } })} className='border rounded p-2 w-full' />
                    </div>

                    <div className='sm:col-span-1'>
                      <label className='block text-xs text-gray-500 mb-1'>Landmark</label>
                      <input value={form.profile.landmark} onChange={e => setForm({ ...form, profile: { ...form.profile, landmark: e.target.value } })} className='border rounded p-2 w-full' />
                    </div>

                    <div className='sm:col-span-1'>
                      <label className='block text-xs text-gray-500 mb-1'>Street name</label>
                      <input value={form.profile.streetName} onChange={e => setForm({ ...form, profile: { ...form.profile, streetName: e.target.value } })} className='border rounded p-2 w-full' />
                    </div>

                    <div className='sm:col-span-1'>
                      <label className='block text-xs text-gray-500 mb-1'>Building number</label>
                      <input value={form.profile.buildingNumber} onChange={e => setForm({ ...form, profile: { ...form.profile, buildingNumber: e.target.value } })} className='border rounded p-2 w-full' />
                    </div>

                    <div className='sm:col-span-1'>
                      <label className='block text-xs text-gray-500 mb-1'>Additional number</label>
                      <input value={form.profile.additionalNumber} onChange={e => setForm({ ...form, profile: { ...form.profile, additionalNumber: e.target.value } })} className='border rounded p-2 w-full' />
                    </div>

                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className='sm:col-span-1'>
                        <label className='block text-xs text-gray-500 mb-1'>Custom Field {i + 1}</label>
                        <input value={form.profile[`custom${i + 1}`] || ''} onChange={e => setForm({ ...form, profile: { ...form.profile, [`custom${i + 1}`]: e.target.value } })} className='border rounded p-2 w-full' placeholder={`Custom Field ${i + 1}`} />
                      </div>
                    ))}

                    <div className='sm:col-span-2' data-vendors-span='2'>
                      <label className='block text-xs text-gray-500 mb-1'>Shipping Address</label>
                      <input value={form.shippingAddress} onChange={e => setForm({ ...form, shippingAddress: e.target.value })} className='border rounded p-2 w-full' placeholder='Search address' />
                    </div>
                  </>
                )}

                <div className='sm:col-span-1'>
                  <label className='block text-xs text-gray-500 mb-1'>Vendor Name</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className='border rounded p-2 w-full' />
                </div>

                <div className='sm:col-span-1'>
                  <label className='block text-xs text-gray-500 mb-1'>Status</label>
                  <select value={form.isActive ? 'Active' : 'Inactive'} onChange={e => setForm({ ...form, isActive: e.target.value === 'Active' })} className='border rounded p-2 w-full'>
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>

                <div className='sm:col-span-2' data-vendors-span='2'>
                  <label className='block text-xs text-gray-500 mb-1'>Billing Address</label>
                  <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className='border rounded p-2 w-full' rows={2} />
                </div>
              </div>
            </div>

            <div className='flex items-center justify-end gap-2 p-4 border-t flex-none'>
              <button onClick={() => closeAdd('cancel')} className='border rounded px-4 py-2 text-sm'>Cancel</button>
              <button disabled={!canSave} onClick={saveVendor} className={`rounded px-4 py-2 text-sm ${canSave ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>Save</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
