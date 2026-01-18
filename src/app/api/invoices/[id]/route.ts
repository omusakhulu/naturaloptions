import { NextRequest, NextResponse } from 'next/server'

import { softDeleteInvoice } from '@/lib/db/invoices'

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 })

    const deleted = await softDeleteInvoice(id)
    if (!deleted) return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 })

    return NextResponse.json({ success: true, invoice: deleted })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to delete invoice' }, { status: 500 })
  }
}
