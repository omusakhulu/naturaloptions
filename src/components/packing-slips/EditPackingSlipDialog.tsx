'use client'

import { useState, useEffect } from 'react'

import { useRouter } from 'next/navigation'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'

interface User {
  id: string
  fullName: string
  email: string
}

interface PackingSlip {
  wooOrderId: number
  status: string
  boothNumber?: string | null
  assignedUserId?: string | null
  notes?: string | null
  assignedUser?: {
    id: string
    name: string
    email: string
  } | null
}

interface EditPackingSlipDialogProps {
  open: boolean
  onClose: () => void
  packingSlip: PackingSlip
}

const STATUS_OPTIONS = [
  { value: 'awaiting_collection', label: 'Awaiting Collection' },
  { value: 'en_route', label: 'En Route' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'collected', label: 'Collected' }
]

export default function EditPackingSlipDialog({ open, onClose, packingSlip }: EditPackingSlipDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    status: packingSlip.status || 'awaiting_collection',
    boothNumber: packingSlip.boothNumber || '',
    assignedUserId: packingSlip.assignedUserId || '',
    notes: packingSlip.notes || ''
  })

  useEffect(() => {
    if (open) {
      fetchUsers()
      setFormData({
        status: packingSlip.status || 'awaiting_collection',
        boothNumber: packingSlip.boothNumber || '',
        assignedUserId: packingSlip.assignedUserId || '',
        notes: packingSlip.notes || ''
      })
    }
  }, [open, packingSlip])

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true)
      const res = await fetch('/api/users')

      if (!res.ok) throw new Error('Failed to fetch users')
      const data = await res.json()

      setUsers(data)
    } catch (err) {
      console.error('Error fetching users:', err)
      setError('Failed to load users')
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/packing-slips/${packingSlip.wooOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: formData.status,
          boothNumber: formData.boothNumber || null,
          assignedUserId: formData.assignedUserId || null,
          notes: formData.notes || null
        })
      })

      if (!res.ok) throw new Error('Failed to update packing slip')

      router.refresh()
      onClose()
    } catch (err) {
      console.error('Error updating packing slip:', err)
      setError('Failed to update packing slip')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Edit Packing Slip</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity='error' className='mb-4'>
              {error}
            </Alert>
          )}

          <div className='flex flex-col gap-4 mt-4'>
            <TextField
              select
              label='Status'
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
              fullWidth
              required
            >
              {STATUS_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label='Booth Number'
              value={formData.boothNumber}
              onChange={e => setFormData({ ...formData, boothNumber: e.target.value })}
              fullWidth
              placeholder='e.g., B-101'
            />

            <TextField
              select
              label='Assign to User'
              value={formData.assignedUserId}
              onChange={e => setFormData({ ...formData, assignedUserId: e.target.value })}
              fullWidth
              disabled={loadingUsers}
            >
              <MenuItem value=''>
                <em>None</em>
              </MenuItem>
              {users.map(user => (
                <MenuItem key={user.id} value={user.id}>
                  {user.fullName} ({user.email})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label='Notes'
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              fullWidth
              multiline
              rows={3}
              placeholder='Add any special instructions...'
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type='submit' variant='contained' disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
