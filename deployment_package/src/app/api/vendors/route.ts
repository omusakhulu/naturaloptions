import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

const hasDb = !!process.env.DATABASE_URL
let memVendors: any[] = []

function calcTotals(bills: any[]) {
  let totalOwed = 0
  let count = 0
  for (const b of bills || []) {
    const amount = Number(b.amount ?? 0)
    const paid = Number(b.paidAmount ?? 0)
    const status = String(b.status || '').toUpperCase()
    // Count all bills; consider owed only if not fully paid
    count += 1
    const owed = Math.max(0, amount - paid)
    if (status !== 'PAID') totalOwed += owed
  }
  return { billsCount: count, totalOwed }
}

export async function GET() {
  if (hasDb) {
    try {
      const vendors = await prisma.vendor.findMany({
        include: { bills: true, paymentTerm: true },
        orderBy: { name: 'asc' }
      })
      const items = vendors.map(v => {
        const { billsCount, totalOwed } = calcTotals(v.bills)
        return {
          id: v.id,
          name: v.name,
          email: v.email || '',
          phone: v.phone || '',
          status: v.isActive !== false ? 'Active' : 'Inactive',
          paymentTerm: v.paymentTerm?.name || '',
          billsCount,
          totalOwed
        }
      })
      return NextResponse.json({ items })
    } catch {}
  }
  // Fallback
  const items = memVendors.map(v => ({
    ...v,
    billsCount: 0,
    totalOwed: 0
  }))
  return NextResponse.json({ items })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { name, email, phone, address, paymentTermId, isActive = true, profile = {}, shippingAddress } = body || {}
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  if (hasDb) {
    try {
      const vendor = await prisma.vendor.create({
        data: { name, email, phone, address, paymentTermId: paymentTermId || null, isActive, profile: JSON.stringify(profile || {}), shippingAddress }
      })
      return NextResponse.json(vendor)
    } catch (e: any) {
      return NextResponse.json({ error: e?.message || 'Failed to create vendor' }, { status: 500 })
    }
  }

  const v = { id: String(Date.now()), name, email, phone, address, isActive, paymentTermId, profile, shippingAddress }
  memVendors.unshift(v)
  return NextResponse.json(v)
}
