'use client'

import { useState } from 'react'

import Button from '@mui/material/Button'

import EditPackingSlipDialog from '@/components/packing-slips/EditPackingSlipDialog'

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

interface EditPackingSlipDialogWrapperProps {
  packingSlip: PackingSlip | null
}

export default function EditPackingSlipDialogWrapper({ packingSlip }: EditPackingSlipDialogWrapperProps) {
  const [open, setOpen] = useState(false)

  if (!packingSlip) return null

  return (
    <>
      <Button variant='outlined' onClick={() => setOpen(true)} className='print:hidden'>
        Edit
      </Button>
      <EditPackingSlipDialog open={open} onClose={() => setOpen(false)} packingSlip={packingSlip} />
    </>
  )
}
