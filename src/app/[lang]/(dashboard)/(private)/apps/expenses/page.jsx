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
  const [form, setForm] = useState({ reference: '', category: '', amount: 0, account: '', date: '' })

  const fetchRows = async () => {
    const res = await fetch('/api/expenses')
    const json = await res.json()

    setRows(json.items || [])
  }

  useEffect(() => { fetchRows() }, [])

  const onNew = () => { setIdx(-1); setForm({ reference: '', category: '', amount: 0, account: '', date: new Date().toISOString().slice(0,10) }); setOpen(true) }

  const onEdit = i => { setIdx(i); const r = rows[i];

 setForm({ reference: r.reference || '', category: r.category || '', amount: Number(r.amount) || 0, account: r.accountId || '', date: (r.date || '').slice(0,10) }); setOpen(true) }

  const onDelete = async i => { const r = rows[i];

 await fetch(`/api/expenses/${r.id}`, { method: 'DELETE' }); await fetchRows() }

  const onSubmit = async () => {
    const payload = { amount: Number(form.amount), category: form.category, accountId: form.account, date: form.date, note: form.reference }

    if (idx >= 0) {
      const id = rows[idx].id

      await fetch(`/api/expenses/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    } else {
      await fetch('/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    }

    setOpen(false)
    await fetchRows()
  }

  return (
    <Box display='flex' flexDirection='column' gap={4}>
      <Box display='flex' justifyContent='space-between' alignItems='center'>
        <Typography variant='h4'>Expenses</Typography>
        <Button variant='contained' onClick={onNew}>Add Expense</Button>
      </Box>
      <Table size='small'>
        <TableHead>
          <TableRow>
            <TableCell>Reference</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Payment Account</TableCell>
            <TableCell>Date</TableCell>
            <TableCell align='right'>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows?.length ? rows.map((r, i) => (
            <TableRow key={i} hover>
              <TableCell>{r.note || '-'}</TableCell>
              <TableCell>{r.category}</TableCell>
              <TableCell>{Number(r.amount).toLocaleString()}</TableCell>
              <TableCell>{r.accountId}</TableCell>
              <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
              <TableCell align='right'>
                <Button size='small' onClick={() => onEdit(i)}>Edit</Button>
                <Button size='small' color='error' onClick={() => onDelete(i)}>Delete</Button>
              </TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={6}><Typography color='text.secondary'>No expenses yet</Typography></TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>{idx >= 0 ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
        <DialogContent className='flex flex-col gap-4'>
          <TextField label='Reference' value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} />
          <TextField label='Category' value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
          <TextField type='number' label='Amount' value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} />
          <TextField label='Payment Account' value={form.account} onChange={e => setForm({ ...form, account: e.target.value })} />
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
