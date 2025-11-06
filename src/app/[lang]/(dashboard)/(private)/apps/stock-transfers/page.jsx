"use client"

import { useEffect, useMemo, useState } from 'react'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'

export default function Page() {
  const [rows, setRows] = useState([])
  const [open, setOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState(-1)
  const [form, setForm] = useState({ reference: '', from: '', to: '', status: 'Draft', date: '' })

  const fetchRows = async () => {
    const res = await fetch('/api/stock-transfers')
    const json = await res.json()

    setRows(json.items || [])
  }

  useEffect(() => { fetchRows() }, [])

  const onNew = () => {
    setEditingIndex(-1)
    setForm({ reference: '', from: '', to: '', status: 'Draft', date: new Date().toISOString().slice(0,10) })
    setOpen(true)
  }

  const onEdit = idx => {
    setEditingIndex(idx)
    const r = rows[idx]

    setForm({ reference: r.reference || '', from: r.from || '', to: r.to || '', status: r.status || 'Draft', date: (r.date || '').slice(0,10) })
    setOpen(true)
  }

  const onDelete = async idx => {
    const r = rows[idx]

    await fetch(`/api/stock-transfers/${r.id}`, { method: 'DELETE' })
    await fetchRows()
  }

  const onSubmit = async () => {
    const payload = { reference: form.reference, from: form.from, to: form.to, status: form.status, date: form.date }

    if (editingIndex >= 0) {
      const id = rows[editingIndex].id

      await fetch(`/api/stock-transfers/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    } else {
      await fetch('/api/stock-transfers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    }

    setOpen(false)
    await fetchRows()
  }

  return (
    <Box display='flex' flexDirection='column' gap={4}>
      <Box display='flex' justifyContent='space-between' alignItems='center'>
        <Typography variant='h4'>Stock Transfers</Typography>
        <Button variant='contained' onClick={onNew}>New Transfer</Button>
      </Box>
      <Table size='small'>
        <TableHead>
          <TableRow>
            <TableCell>Reference</TableCell>
            <TableCell>From</TableCell>
            <TableCell>To</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Date</TableCell>
            <TableCell align='right'>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6}><Typography color='text.secondary'>No transfers yet</Typography></TableCell>
            </TableRow>
          ) : (
            rows.map((r, idx) => (
              <TableRow key={idx} hover>
                <TableCell>{r.reference}</TableCell>
                <TableCell>{r.from}</TableCell>
                <TableCell>{r.to}</TableCell>
                <TableCell>{r.status}</TableCell>
                <TableCell>{r.date}</TableCell>
                <TableCell align='right'>
                  <Button size='small' onClick={() => onEdit(idx)}>Edit</Button>
                  <Button size='small' color='error' onClick={() => onDelete(idx)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>{editingIndex >= 0 ? 'Edit Transfer' : 'New Transfer'}</DialogTitle>
        <DialogContent className='flex flex-col gap-4'>
          <TextField label='Reference' value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} />
          <TextField label='From' value={form.from} onChange={e => setForm({ ...form, from: e.target.value })} />
          <TextField label='To' value={form.to} onChange={e => setForm({ ...form, to: e.target.value })} />
          <TextField label='Status' value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} />
          <TextField type='date' label='Date' InputLabelProps={{ shrink: true }} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant='contained' onClick={onSubmit}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
