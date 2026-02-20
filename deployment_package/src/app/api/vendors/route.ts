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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (hasDb) {
    try {
      // Single vendor by id
      if (id) {
        const v = await prisma.vendor.findUnique({
          where: { id },
          include: { paymentTerm: true }
        })
        if (!v) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
        let profile = {}
        try { profile = JSON.parse(v.profile || '{}') } catch {}
        return NextResponse.json({
          id: v.id, name: v.name, email: v.email || '', phone: v.phone || '',
          address: v.address || '', paymentTermId: v.paymentTermId || '',
          isActive: v.isActive, shippingAddress: v.shippingAddress || '', profile
        })
      }

      // List all
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
  if (id) {
    const v = memVendors.find(v => v.id === id)
    if (!v) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    return NextResponse.json(v)
  }
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

export async function PUT(request: Request) {
  const body = await request.json()
  const { id, name, email, phone, address, paymentTermId, isActive, profile, shippingAddress } = body || {}
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  if (hasDb) {
    try {
      const vendor = await prisma.vendor.update({
        where: { id },
        data: {
          name,
          email: email || null,
          phone: phone || null,
          address: address || null,
          paymentTermId: paymentTermId || null,
          isActive: isActive !== false,
          profile: JSON.stringify(profile || {}),
          shippingAddress: shippingAddress || null
        }
      })
      return NextResponse.json(vendor)
    } catch (e: any) {
      return NextResponse.json({ error: e?.message || 'Failed to update vendor' }, { status: 500 })
    }
  }

  const idx = memVendors.findIndex(v => v.id === id)
  if (idx === -1) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
  memVendors[idx] = { ...memVendors[idx], name, email, phone, address, paymentTermId, isActive, profile, shippingAddress }
  return NextResponse.json(memVendors[idx])
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  if (hasDb) {
    try {
      await prisma.vendor.delete({ where: { id } })
      return NextResponse.json({ success: true })
    } catch (e: any) {
      return NextResponse.json({ error: e?.message || 'Failed to delete vendor' }, { status: 500 })
    }
  }

  memVendors = memVendors.filter(v => v.id !== id)
  return NextResponse.json({ success: true })
}
