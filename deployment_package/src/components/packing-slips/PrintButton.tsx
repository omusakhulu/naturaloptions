'use client'

import Button from '@mui/material/Button'

export default function PrintButton() {
  const onPrint = () => {
    if (typeof window !== 'undefined') window.print()
  }

  return (
    <Button variant='contained' color='primary' onClick={onPrint} startIcon={<i className='tabler-printer' />}>
      Print
    </Button>
  )
}
