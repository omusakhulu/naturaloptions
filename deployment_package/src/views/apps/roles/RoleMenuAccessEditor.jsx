'use client'

import { useEffect, useMemo, useState } from 'react'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'

import { useSession } from 'next-auth/react'

import { MENU_ACCESS_ITEMS } from '@/config/menuAccessItems'

const ROLE_OPTIONS = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'ACCOUNTANT', 'CASHIER', 'SALES', 'USER']

const RoleMenuAccessEditor = () => {
  const { data: session, status } = useSession()
  const currentRole = session?.user?.role

  const [selectedRole, setSelectedRole] = useState('USER')
  const [map, setMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const grouped = useMemo(() => {
    const groups = {}

    MENU_ACCESS_ITEMS.forEach(item => {
      const groupName = item.group || 'Other'
      if (!groups[groupName]) groups[groupName] = []
      groups[groupName].push(item)
    })

    return groups
  }, [])

  const allowedKeys = useMemo(() => {
    const value = map?.[selectedRole]

    if (!Array.isArray(value)) return null

    return new Set(value)
  }, [map, selectedRole])

  const isRestrictedMode = allowedKeys !== null

  useEffect(() => {
    const fetchMap = async () => {
      try {
        setLoading(true)
        setError('')
        const res = await fetch('/api/roles/menu-access')

        if (!res.ok) throw new Error('Failed to load menu access')

        const json = await res.json()
        setMap(json?.map || {})
      } catch (e) {
        setError(e?.message || 'Failed to load menu access')
      } finally {
        setLoading(false)
      }
    }

    if (status !== 'loading') {
      fetchMap()
    }
  }, [status])

  const updateRoleKeys = updater => {
    setMap(prev => {
      const prevRoleKeys = Array.isArray(prev?.[selectedRole]) ? prev[selectedRole] : null
      const nextRoleKeys = updater(prevRoleKeys)

      return {
        ...(prev || {}),
        [selectedRole]: nextRoleKeys
      }
    })
  }

  const toggleRestrictedMode = () => {
    updateRoleKeys(prevRoleKeys => {
      if (Array.isArray(prevRoleKeys)) return undefined

      return []
    })
  }

  const toggleKey = key => {
    updateRoleKeys(prevRoleKeys => {
      const base = Array.isArray(prevRoleKeys) ? prevRoleKeys : []
      const set = new Set(base)

      if (set.has(key)) set.delete(key)
      else set.add(key)

      return Array.from(set)
    })
  }

  const toggleGroup = (groupItems, enabled) => {
    updateRoleKeys(prevRoleKeys => {
      const base = Array.isArray(prevRoleKeys) ? prevRoleKeys : []
      const set = new Set(base)

      groupItems.forEach(item => {
        if (enabled) set.add(item.key)
        else set.delete(item.key)
      })

      return Array.from(set)
    })
  }

  const save = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const res = await fetch('/api/roles/menu-access', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ map })
      })

      const json = await res.json().catch(() => ({}))

      if (!res.ok || json?.success === false) {
        throw new Error(json?.error || 'Failed to save')
      }

      setSuccess('Menu access updated')
    } catch (e) {
      setError(e?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const canEdit = currentRole === 'SUPER_ADMIN' || currentRole === 'ADMIN'

  if (!canEdit) {
    return null
  }

  return (
    <Card>
      <CardHeader
        title='Menu Access by Role'
        subheader='Choose which menu items are visible for each role. Super Admin always has access to everything.'
      />
      <CardContent className='flex flex-col gap-4'>
        {loading ? (
          <div className='flex items-center gap-2'>
            <CircularProgress size={18} />
            <Typography variant='body2'>Loading menu access...</Typography>
          </div>
        ) : null}

        {error ? <Alert severity='error'>{error}</Alert> : null}
        {success ? <Alert severity='success'>{success}</Alert> : null}

        <div className='flex flex-col gap-4'>
          <FormControl size='small' className='max-w-[260px]'>
            <InputLabel>Role</InputLabel>
            <Select value={selectedRole} label='Role' onChange={e => setSelectedRole(e.target.value)}>
              {ROLE_OPTIONS.map(r => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={<Checkbox checked={isRestrictedMode} onChange={toggleRestrictedMode} />}
            label='Enable menu restrictions for this role (allowlist)'
          />

          {!isRestrictedMode ? (
            <Alert severity='info'>
              Restrictions are disabled for <strong>{selectedRole}</strong>. This role will see all menu items.
            </Alert>
          ) : null}

          {isRestrictedMode ? (
            <div className='flex flex-col gap-4'>
              {Object.entries(grouped).map(([groupName, items]) => {
                const groupKeys = items.map(i => i.key)
                const selectedCount = groupKeys.filter(k => allowedKeys.has(k)).length
                const allSelected = selectedCount === groupKeys.length && groupKeys.length > 0
                const someSelected = selectedCount > 0 && !allSelected

                return (
                  <div key={groupName} className='flex flex-col gap-2'>
                    <div className='flex items-center justify-between'>
                      <Typography variant='subtitle1'>{groupName}</Typography>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={allSelected}
                            indeterminate={someSelected}
                            onChange={e => toggleGroup(items, e.target.checked)}
                          />
                        }
                        label='All'
                      />
                    </div>
                    <FormGroup className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3'>
                      {items.map(item => (
                        <FormControlLabel
                          key={item.key}
                          control={<Checkbox checked={allowedKeys.has(item.key)} onChange={() => toggleKey(item.key)} />}
                          label={item.label}
                        />
                      ))}
                    </FormGroup>
                    <Divider />
                  </div>
                )
              })}
            </div>
          ) : null}

          <div className='flex gap-3'>
            <Button variant='contained' onClick={save} disabled={saving || loading}>
              {saving ? <CircularProgress size={18} color='inherit' /> : 'Save'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default RoleMenuAccessEditor
