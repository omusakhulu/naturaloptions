'use client'

import { useEffect, useState } from 'react'

import Autocomplete from '@mui/material/Autocomplete'
import CircularProgress from '@mui/material/CircularProgress'
import TextField from '@mui/material/TextField'

import Box from '@mui/material/Box'
import MenuItem from '@mui/material/MenuItem'

export interface CustomerOption {
  id?: string
  wooId?: number
  email?: string
  firstName?: string
  lastName?: string
  billingAddress?: string | null
  shippingAddress?: string | null
}

function parseBilling(addr?: string | null): any {
  if (!addr) return {}

  try {
    return JSON.parse(addr)
  } catch {
    return {}
  }
}

function labelFor(option: CustomerOption) {
  const billing = parseBilling(option.billingAddress)
  const name = [option.firstName, option.lastName].filter(Boolean).join(' ').trim()
  const phone = billing?.phone || ''
  const company = billing?.company || ''
  const parts = [name || 'Unknown', option.email, phone, company].filter(Boolean)

  return parts.join(' — ')
}

export default function CustomerAutocomplete({
  onSelect,
  onAddNew,
  className,
  sx,
  dropdownWidth
}: {
  onSelect: (c: any) => void
  onAddNew: () => void
  className?: string
  sx?: any
  dropdownWidth?: number
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState<CustomerOption[]>([])
  const [value, setValue] = useState<CustomerOption | null>(null)

  useEffect(() => {
    let active = true
    const controller = new AbortController()

    const load = async () => {
      setLoading(true)

      try {
        const url = query ? `/api/customers/search?q=${encodeURIComponent(query)}` : '/api/customers/search'
        const res = await fetch(url, { cache: 'no-store', signal: controller.signal })
        const json = await res.json()

        if (active && res.ok && json?.success) {
          setOptions(Array.isArray(json.customers) ? json.customers : [])
        }
      } catch {
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
      controller.abort()
    }
  }, [query])

  return (
    <Autocomplete
      fullWidth
      size="small"
      className={className}
      sx={sx}
      slotProps={{
        paper: { sx: { width: dropdownWidth || 'auto' } },
        popper: { sx: { width: dropdownWidth || 'auto' } }
      }}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={options}
      value={value}
      onChange={(e, newVal) => {
        setValue(newVal)
        if (newVal) onSelect(newVal)
      }}
      onInputChange={(e, val) => setQuery(val)}
      getOptionLabel={(opt) => labelFor(opt as CustomerOption)}
      isOptionEqualToValue={(opt, val) => (opt as any).id === (val as any)?.id}
      loading={loading}
      renderOption={(props, option) => (
        <li {...props} key={(option as any).id || (option as any).wooId || labelFor(option as any)}>
          {labelFor(option as any)}
        </li>
      )}
      renderInput={(params) => (
        <TextField {...params} size="small" fullWidth placeholder="Search customers..." />
      )}
      ListboxProps={{ style: { maxHeight: 320 } }}
    />
  )
}
