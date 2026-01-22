"use client"

import { useEffect, useState } from 'react'

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

export default function Page() {
  const [rows, setRows] = useState([])
  const [open, setOpen] = useState(false)
  const [idx, setIdx] = useState(-1)
  const [form, setForm] = useState({ name: '', type: '', balance: 0, status: 'Active', updated: '' })

  const fetchRows = async () => {
    const res = await fetch('/api/payment-accounts')
    const json = await res.json()

    setRows(json.items || [])
  }

  useEffect(() => { fetchRows() }, [])

  const onNew = () => { setIdx(-1); setForm({ name: '', type: '', balance: 0, status: 'Active', updated: new Date().toISOString().slice(0,10) }); setOpen(true) }

  const onEdit = i => { setIdx(i); const r = rows[i];

 setForm({ name: r.name, type: r.type, balance: Number(r.balance)||0, status: r.status||'Active', updated: (r.updatedAt||'').slice(0,10) }); setOpen(true) }

  const onDelete = async i => { const r = rows[i];

 await fetch(`/api/payment-accounts/${r.id}`, { method: 'DELETE' }); await fetchRows() }

  const onSubmit = async () => {
    const payload = { name: form.name, type: form.type, balance: Number(form.balance), status: form.status }

    if (idx >= 0) {
      const id = rows[idx].id

      await fetch(`/api/payment-accounts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    } else {
      await fetch('/api/payment-accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    }

    setOpen(false)
    await fetchRows()
  }

  return (
    <Box width='100%' display='flex' flexDirection='column' gap={4}>
      <Box display='flex' justifyContent='space-between' alignItems='center'>
        <Typography variant='h4'>Payment Accounts</Typography>
        <Button variant='contained' onClick={onNew}>New Account</Button>
      </Box>
      <Table size='small'>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Balance</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Updated</TableCell>
            <TableCell align='right'>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows?.length ? rows.map((r, i) => (
            <TableRow key={i} hover>
              <TableCell>{r.name}</TableCell>
              <TableCell>{r.type}</TableCell>
              <TableCell>{Number(r.balance).toLocaleString()}</TableCell>
              <TableCell>{r.status}</TableCell>
              <TableCell>{r.updated}</TableCell>
              <TableCell align='right'>
                <Button size='small' onClick={() => onEdit(i)}>Edit</Button>
                <Button size='small' color='error' onClick={() => onDelete(i)}>Delete</Button>
              </TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={6}><Typography color='text.secondary'>No accounts yet</Typography></TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>{idx >= 0 ? 'Edit Account' : 'New Account'}</DialogTitle>
        <DialogContent className='flex flex-col gap-4'>
          <TextField label='Name' value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <TextField label='Type' value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} />
          <TextField type='number' label='Balance' value={form.balance} onChange={e => setForm({ ...form, balance: Number(e.target.value) })} />
          <TextField label='Status' value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} />
          <TextField type='date' label='Updated' InputLabelProps={{ shrink: true }} value={form.updated} onChange={e => setForm({ ...form, updated: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant='contained' onClick={onSubmit}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
