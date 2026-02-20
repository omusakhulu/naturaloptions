'use client'

import { useEffect, useMemo, useState } from 'react'

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

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [moreOpen, setMoreOpen] = useState(true)
  const [saving, setSaving] = useState(false)

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
      custom1: '', custom2: '', custom3: '', custom4: '', custom5: '',
      custom6: '', custom7: '', custom8: '', custom9: '', custom10: '',
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
    } catch {
      setError('Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const openAdd = () => {
    setForm(initialForm)
    setEditingId(null)
    setModalOpen(true)
  }

  const openEdit = async (vendorId) => {
    try {
      const res = await fetch(`/api/vendors?id=${vendorId}`)
      if (!res.ok) throw new Error('Failed to load vendor')
      const data = await res.json()
      const profile = data.profile && typeof data.profile === 'object' ? data.profile : {}
      setForm({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        paymentTermId: data.paymentTermId || '',
        isActive: data.isActive !== false,
        shippingAddress: data.shippingAddress || '',
        profile: { ...initialForm.profile, ...profile }
      })
      setEditingId(vendorId)
      setModalOpen(true)
    } catch {
      alert('Failed to load vendor for editing')
    }
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingId(null)
  }

  const saveVendor = async () => {
    if (!canSave || saving) return
    setSaving(true)
    try {
      const payload = {
        ...form,
        ...(editingId ? { id: editingId } : {}),
        profile: {
          ...form.profile,
          openingBalance: form.profile.openingBalance ? Number(form.profile.openingBalance) : 0
        }
      }
      const res = await fetch('/api/vendors', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Failed to save vendor')
      closeModal()
      setForm(initialForm)
      await fetchAll()
    } catch {
      alert('Saving vendor failed')
    } finally {
      setSaving(false)
    }
  }

  const deleteVendor = async (id, name) => {
    if (!confirm(`Delete vendor "${name}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/vendors?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      await fetchAll()
    } catch {
      alert('Failed to delete vendor')
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = rows
    if (q) {
      list = rows.filter(r =>
        ['name', 'email', 'phone', 'paymentTerm', 'status']
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
      c.key === 'totalOwed' ? `KSh ${Number(r.totalOwed || 0).toLocaleString('en-KE')}` : r[c.key] ?? ''
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

  const setProfileField = (key, value) => setForm(prev => ({ ...prev, profile: { ...prev.profile, [key]: value } }))

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
            <select className='border rounded p-1 text-sm' value={entries} onChange={e => setEntries(e.target.value)}>
              {['All', '10', '25', '50', '100'].map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
            <span className='text-sm text-gray-600'>entries</span>
          </div>

          <div className='flex items-center gap-2'>
            <button onClick={downloadCsv} className='border rounded px-3 py-1 text-sm'>Export CSV</button>
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
              onClick={openAdd}
              className='bg-indigo-600 hover:bg-indigo-700 text-white rounded px-4 py-2 text-sm'
            >
              + Add Vendor
            </button>
          </div>
        </div>

        {loading && <div className='text-sm text-gray-500'>Loading...</div>}
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
                filtered.map((r) => (
                  <tr key={r.id} className='border-b hover:bg-gray-50'>
                    {visibleCols.map(c => (
                      <td key={c.key} className='px-3 py-2'>
                        {c.key === 'action' ? (
                          <div className='flex items-center gap-2'>
                            <button
                              onClick={() => openEdit(r.id)}
                              className='text-indigo-600 hover:text-indigo-800 text-xs font-medium'
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteVendor(r.id, r.name)}
                              className='text-red-600 hover:text-red-800 text-xs font-medium'
                            >
                              Delete
                            </button>
                          </div>
                        ) : c.key === 'status' ? (
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

        <div className='flex items-center justify-end gap-2 mt-3'>
          <span className='text-sm text-gray-500'>Showing {filtered.length} of {rows.length} vendors</span>
        </div>
      </div>

      {/* Add / Edit Vendor Modal */}
      {modalOpen && (
        <div
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            overflowY: 'auto', padding: '2rem 1rem'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '0.75rem', width: '100%', maxWidth: '72rem',
              boxShadow: '0 20px 45px rgba(0,0,0,0.25)',
              display: 'flex', flexDirection: 'column',
              maxHeight: 'calc(100vh - 4rem)'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>{editingId ? 'Edit Vendor' : 'Add Vendor'}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' }}>✕</button>
            </div>

            {/* Scoped styles for form inputs inside modal */}
            <style dangerouslySetInnerHTML={{ __html: `
              [data-vendor-form] input:not([type="radio"]),
              [data-vendor-form] select,
              [data-vendor-form] textarea {
                width: 100%; border: 1px solid #d1d5db; border-radius: 8px;
                padding: 10px 12px; font-size: 14px; line-height: 20px; background: #fff;
                box-sizing: border-box;
              }
              [data-vendor-form] textarea { resize: vertical; }
            `}} />

            {/* Scrollable Body */}
            <div data-vendor-form style={{ overflowY: 'auto', flex: '1 1 auto', padding: '20px', minHeight: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <FormField label='Contact type*'>
                  <select value={form.profile.contactType} onChange={e => setProfileField('contactType', e.target.value)}>
                    <option>Suppliers</option>
                    <option>Customers</option>
                  </select>
                </FormField>

                <FormField label='Individual / Business'>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', marginBottom: 0 }}>
                      <input type='radio' checked={!form.profile.isBusiness} onChange={() => setProfileField('isBusiness', false)} style={{ width: 'auto' }} /> Individual
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', marginBottom: 0 }}>
                      <input type='radio' checked={form.profile.isBusiness} onChange={() => setProfileField('isBusiness', true)} style={{ width: 'auto' }} /> Business
                    </label>
                  </div>
                </FormField>

                <FormField label='Vendor Name*'>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder='Vendor name' />
                </FormField>

                <FormField label='Email'>
                  <input type='email' value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </FormField>

                <FormField label='Contact ID'>
                  <input value={form.profile.contactId} onChange={e => setProfileField('contactId', e.target.value)} placeholder='Leave blank to auto generate' />
                </FormField>

                <FormField label='Mobile*'>
                  <input value={form.profile.mobile} onChange={e => setProfileField('mobile', e.target.value)} placeholder='Mobile' />
                </FormField>

                <FormField label='Alternate contact number'>
                  <input value={form.profile.alternateContact} onChange={e => setProfileField('alternateContact', e.target.value)} placeholder='Alternate contact' />
                </FormField>

                <FormField label='Landline'>
                  <input value={form.profile.landline} onChange={e => setProfileField('landline', e.target.value)} placeholder='Landline' />
                </FormField>

                <FormField label='Assigned to'>
                  <input value={form.profile.assignedTo} onChange={e => setProfileField('assignedTo', e.target.value)} placeholder='Assignee' />
                </FormField>

                <FormField label='Status'>
                  <select value={form.isActive ? 'Active' : 'Inactive'} onChange={e => setForm({ ...form, isActive: e.target.value === 'Active' })}>
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </FormField>

                {/* More Information toggle */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <button
                    onClick={() => setMoreOpen(o => !o)}
                    style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '14px', cursor: 'pointer' }}
                  >
                    More Information {moreOpen ? '\u25B2' : '\u25BC'}
                  </button>
                </div>

                {moreOpen && (
                  <>
                    <FormField label='Tax number'>
                      <input value={form.profile.taxNumber} onChange={e => setProfileField('taxNumber', e.target.value)} placeholder='Tax number' />
                    </FormField>

                    <FormField label='Opening Balance'>
                      <input type='number' value={form.profile.openingBalance} onChange={e => setProfileField('openingBalance', e.target.value)} placeholder='0' />
                    </FormField>

                    <FormField label='Pay term' span={2}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <select value={form.paymentTermId} onChange={e => setForm({ ...form, paymentTermId: e.target.value })}>
                          <option value=''>Please Select</option>
                          {terms.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                        <input value={form.profile.payTermNote} onChange={e => setProfileField('payTermNote', e.target.value)} placeholder='Pay term note' />
                      </div>
                    </FormField>

                    <FormField label='Address line 1'>
                      <input value={form.profile.addressLine1} onChange={e => setProfileField('addressLine1', e.target.value)} />
                    </FormField>
                    <FormField label='Address line 2'>
                      <input value={form.profile.addressLine2} onChange={e => setProfileField('addressLine2', e.target.value)} />
                    </FormField>
                    <FormField label='City'>
                      <input value={form.profile.city} onChange={e => setProfileField('city', e.target.value)} />
                    </FormField>
                    <FormField label='State'>
                      <input value={form.profile.state} onChange={e => setProfileField('state', e.target.value)} />
                    </FormField>
                    <FormField label='Country'>
                      <input value={form.profile.country} onChange={e => setProfileField('country', e.target.value)} />
                    </FormField>
                    <FormField label='Zip Code'>
                      <input value={form.profile.zip} onChange={e => setProfileField('zip', e.target.value)} />
                    </FormField>
                    <FormField label='Landmark'>
                      <input value={form.profile.landmark} onChange={e => setProfileField('landmark', e.target.value)} />
                    </FormField>
                    <FormField label='Street name'>
                      <input value={form.profile.streetName} onChange={e => setProfileField('streetName', e.target.value)} />
                    </FormField>
                    <FormField label='Building number'>
                      <input value={form.profile.buildingNumber} onChange={e => setProfileField('buildingNumber', e.target.value)} />
                    </FormField>
                    <FormField label='Additional number'>
                      <input value={form.profile.additionalNumber} onChange={e => setProfileField('additionalNumber', e.target.value)} />
                    </FormField>

                    {[1, 2, 3, 4, 5].map(i => (
                      <FormField key={i} label={`Custom Field ${i}`}>
                        <input value={form.profile[`custom${i}`] || ''} onChange={e => setProfileField(`custom${i}`, e.target.value)} placeholder={`Custom Field ${i}`} />
                      </FormField>
                    ))}

                    <FormField label='Shipping Address' span={2}>
                      <input value={form.shippingAddress} onChange={e => setForm({ ...form, shippingAddress: e.target.value })} placeholder='Shipping address' />
                    </FormField>

                    <FormField label='Billing Address' span={2}>
                      <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} />
                    </FormField>
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', padding: '16px 20px', borderTop: '1px solid #e5e7eb', flexShrink: 0 }}>
              <button
                onClick={closeModal}
                style={{ border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px 20px', fontSize: '14px', cursor: 'pointer', background: '#fff' }}
              >
                Cancel
              </button>
              <button
                disabled={!canSave || saving}
                onClick={saveVendor}
                style={{
                  borderRadius: '6px', padding: '8px 20px', fontSize: '14px', cursor: canSave && !saving ? 'pointer' : 'not-allowed', border: 'none',
                  background: canSave && !saving ? '#4f46e5' : '#e5e7eb',
                  color: canSave && !saving ? '#fff' : '#9ca3af'
                }}
              >
                {saving ? 'Saving...' : editingId ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FormField({ label, children, span }) {
  return (
    <div style={span === 2 ? { gridColumn: '1 / -1' } : undefined}>
      <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{label}</label>
      {children}
    </div>
  )
}
