'use client'

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

const STORAGE_KEY = 'beauty_stock_adjustments'

export default function Page() {
  const [rows, setRows] = useState([])
  const [open, setOpen] = useState(false)
  const [idx, setIdx] = useState(-1)
  const [form, setForm] = useState({ reference: '', location: '', reason: '', items: 0, date: '' })

  useEffect(() => {
    try { setRows(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch {}
  }, [])

  const save = next => { setRows(next); try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {} }
  const onNew = () => { setIdx(-1); setForm({ reference: '', location: '', reason: '', items: 0, date: new Date().toISOString().slice(0,10) }); setOpen(true) }
  const onEdit = i => { setIdx(i); setForm(rows[i]); setOpen(true) }
  const onDelete = i => save(rows.filter((_, k) => k !== i))

  const onSubmit = () => { const next = [...rows];

 if (idx >= 0) next[idx] = form; else next.unshift(form); save(next); setOpen(false) }

  return (
    <Box display='flex' flexDirection='column' gap={4}>
      <Box display='flex' justifyContent='space-between' alignItems='center'>
        <Typography variant='h4'>Stock Adjustment</Typography>
        <Button variant='contained' onClick={onNew}>New Adjustment</Button>
      </Box>
      <Table size='small'>
        <TableHead>
          <TableRow>
            <TableCell>Reference</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>Reason</TableCell>
            <TableCell>Items</TableCell>
            <TableCell>Date</TableCell>
            <TableCell align='right'>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows?.length ? rows.map((r, i) => (
            <TableRow key={i} hover>
              <TableCell>{r.reference}</TableCell>
              <TableCell>{r.location}</TableCell>
              <TableCell>{r.reason}</TableCell>
              <TableCell>{r.items}</TableCell>
              <TableCell>{r.date}</TableCell>
              <TableCell align='right'>
                <Button size='small' onClick={() => onEdit(i)}>Edit</Button>
                <Button size='small' color='error' onClick={() => onDelete(i)}>Delete</Button>
              </TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={6}><Typography color='text.secondary'>No adjustments yet</Typography></TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>{idx >= 0 ? 'Edit Adjustment' : 'New Adjustment'}</DialogTitle>
        <DialogContent className='flex flex-col gap-4'>
          <TextField label='Reference' value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} />
          <TextField label='Location' value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
          <TextField label='Reason' value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
          <TextField type='number' label='Items' value={form.items} onChange={e => setForm({ ...form, items: Number(e.target.value) })} />
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
