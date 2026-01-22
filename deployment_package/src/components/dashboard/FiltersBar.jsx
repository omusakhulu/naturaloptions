'use client'

import { useEffect, useMemo, useState } from 'react'

import { useParams, useRouter, useSearchParams } from 'next/navigation'

import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'

export default function FiltersBar() {
  const { lang } = useParams()
  const router = useRouter()
  const sp = useSearchParams()

  const [employee, setEmployee] = useState(sp.get('employee') || '')
  const [location, setLocation] = useState(sp.get('location') || '')

  const base = `/${lang}/apps/ecommerce/dashboard`

  const buildHref = () => {
    const params = new URLSearchParams(sp.toString())

    if (employee) params.set('employee', employee)
    else params.delete('employee')
    if (location) params.set('location', location)
    else params.delete('location')

return `${base}?${params.toString()}`
  }

  useEffect(() => {
    // Sync state on URL change
    setEmployee(sp.get('employee') || '')
    setLocation(sp.get('location') || '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp])

  return (
    <Box className='flex gap-2 items-center'>
      <TextField size='small' label='Store Location' value={location} onChange={e => setLocation(e.target.value)} />
      <TextField size='small' label='Employee' value={employee} onChange={e => setEmployee(e.target.value)} />
      <Button size='small' variant='outlined' onClick={() => router.replace(buildHref())}>Apply</Button>
    </Box>
  )
}
