'use client'

import Button from '@mui/material/Button'

export default function ExportCsvButton({ title = 'data', headers = [], rows = [] }) {
  const onExport = () => {
    const header = headers.join(',')
    const body = rows.map(r => r.map(v => (typeof v === 'string' ? v.replaceAll(',', ' ') : v)).join(',')).join('\n')
    const csv = [header, body].filter(Boolean).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/\s+/g, '_').toLowerCase()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Button size='small' variant='outlined' onClick={onExport}>Export CSV</Button>
  )
}
