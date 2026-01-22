import { NextRequest, NextResponse } from 'next/server'

import { getInvoiceByOrderId, updateInvoiceStatusByOrderId } from '@/lib/db/invoices'

const ALLOWED: Array<'draft' | 'sent' | 'partially_paid' | 'paid'> = ['draft', 'sent', 'partially_paid', 'paid']

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const idNum = Number(id)
    if (!idNum) return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 })

    const invoice = await getInvoiceByOrderId(idNum)
    if (!invoice) return NextResponse.json({ success: true, invoice: null })

    return NextResponse.json({
      success: true,
      invoice: {
        id: invoice.id,
        wooOrderId: invoice.wooOrderId,
        status: invoice.status,
        orderStatus: (invoice as any).orderStatus ?? null,
        invoiceStatus: (invoice as any).invoiceStatus ?? invoice.status
      }
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to fetch invoice' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const idNum = Number(id)
    if (!idNum) return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 })

    const body = await req.json().catch(() => ({}))
    const nextStatus = body?.invoiceStatus as string
    if (!ALLOWED.includes(nextStatus as any)) {
      return NextResponse.json(
        { success: false, error: `Invalid invoiceStatus. Allowed: ${ALLOWED.join(', ')}` },
        { status: 400 }
      )
    }

    const updated = await updateInvoiceStatusByOrderId(idNum, nextStatus as any)
    if (!updated) return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 })

    return NextResponse.json({ success: true, invoice: updated })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to update invoice status' }, { status: 500 })
  }
}
