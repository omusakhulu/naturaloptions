import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

function toNumber(v: any): number {
  if (v == null) return 0
  if (typeof v === 'string') {
    const n = parseFloat(v)
    return Number.isFinite(n) ? n : 0
  }
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const fromStr = searchParams.get('from')
  const toStr = searchParams.get('to')
  const locationId = searchParams.get('locationId')
  const q = (searchParams.get('q') || '').trim()

  const today = new Date()
  const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1)
  const from = fromStr ? new Date(fromStr) : defaultFrom
  const to = toStr ? new Date(toStr) : today

  try {
    const vendorSearchWhere: Prisma.VendorWhereInput | undefined = q
      ? {
          OR: [
            { name: { contains: q, mode: Prisma.QueryMode.insensitive } },
            { email: { contains: q, mode: Prisma.QueryMode.insensitive } }
          ]
        }
      : undefined

    const matchedVendors = q
      ? await prisma.vendor.findMany({ where: vendorSearchWhere, select: { id: true, name: true, email: true } })
      : []
    const vendorIdsFilter = q ? matchedVendors.map(v => v.id) : null

    const billsByVendor = q && vendorIdsFilter?.length === 0
      ? []
      : await prisma.bill.groupBy({
          by: ['vendorId'],
          where: {
            billDate: { gte: from, lte: to },
            ...(vendorIdsFilter ? { vendorId: { in: vendorIdsFilter } } : {})
          },
          _sum: { amount: true, paidAmount: true },
          _count: { _all: true }
        })

    const returnsByVendor = q && vendorIdsFilter?.length === 0
      ? []
      : await prisma.purchaseReturn.groupBy({
          by: ['vendorId'],
          where: {
            date: { gte: from, lte: to },
            ...(vendorIdsFilter ? { vendorId: { in: vendorIdsFilter } } : {})
          },
          _sum: { amount: true },
          _count: { _all: true }
        })

    const vendorIdsFromBills = billsByVendor.map(b => b.vendorId)
    const vendors = vendorIdsFromBills.length
      ? await prisma.vendor.findMany({ where: { id: { in: vendorIdsFromBills } }, select: { id: true, name: true, email: true } })
      : []

    const supplierItems = billsByVendor
      .map(b => {
        const v = vendors.find(x => x.id === b.vendorId)
        const ret = returnsByVendor.find(r => r.vendorId === b.vendorId)
        const totalPurchased = toNumber(b._sum.amount)
        const totalPaid = toNumber(b._sum.paidAmount)
        const balance = totalPurchased - totalPaid
        return {
          vendorId: b.vendorId,
          vendorName: v?.name || 'Vendor',
          vendorEmail: v?.email || '',
          bills: Number(b._count._all || 0),
          purchaseReturns: Number(ret?._count._all || 0),
          totalPurchased,
          totalPaid,
          balance
        }
      })
      .sort((a, b) => b.balance - a.balance)

    const supplierTotals = supplierItems.reduce(
      (s, r) => ({
        vendors: s.vendors + 1,
        bills: s.bills + r.bills,
        totalPurchased: s.totalPurchased + r.totalPurchased,
        totalPaid: s.totalPaid + r.totalPaid,
        balance: s.balance + r.balance
      }),
      { vendors: 0, bills: 0, totalPurchased: 0, totalPaid: 0, balance: 0 }
    )

    const customerSearchWhere: Prisma.POSCustomerWhereInput | undefined = q
      ? {
          OR: [
            { firstName: { contains: q, mode: Prisma.QueryMode.insensitive } },
            { lastName: { contains: q, mode: Prisma.QueryMode.insensitive } },
            { email: { contains: q, mode: Prisma.QueryMode.insensitive } },
            { phone: { contains: q, mode: Prisma.QueryMode.insensitive } },
            { customerNumber: { contains: q, mode: Prisma.QueryMode.insensitive } }
          ]
        }
      : undefined

    const matchedCustomers = q
      ? await prisma.pOSCustomer.findMany({
          where: customerSearchWhere,
          select: { id: true, firstName: true, lastName: true, email: true, phone: true, loyaltyPoints: true, customerNumber: true }
        })
      : []
    const customerIdsFilter = q ? matchedCustomers.map(c => c.id) : null

    const salesByCustomer = q && customerIdsFilter?.length === 0
      ? []
      : await prisma.pOSSale.groupBy({
          by: ['customerId'],
          where: {
            saleDate: { gte: from, lte: to },
            customerId: { not: null },
            ...(customerIdsFilter ? { customerId: { in: customerIdsFilter } } : {}),
            ...(locationId ? { terminal: { locationId } } : {})
          },
          _sum: { totalAmount: true },
          _count: { _all: true }
        })

    const customerIdsFromSales = salesByCustomer.map(s => s.customerId).filter(Boolean) as string[]
    const customers = customerIdsFromSales.length
      ? await prisma.pOSCustomer.findMany({ where: { id: { in: customerIdsFromSales } }, select: { id: true, firstName: true, lastName: true, email: true, phone: true, loyaltyPoints: true, customerNumber: true } })
      : []

    const customerItems = salesByCustomer
      .map(s => {
        const c = customers.find(x => x.id === s.customerId)
        return {
          id: s.customerId as string,
          name: `${c?.firstName || ''} ${c?.lastName || ''}`.trim() || 'Customer',
          email: c?.email || '',
          phone: c?.phone || '',
          customerNumber: (c as any)?.customerNumber || '',
          loyaltyPoints: Number((c as any)?.loyaltyPoints || 0),
          salesCount: Number(s._count._all || 0),
          totalSpent: toNumber(s._sum.totalAmount)
        }
      })
      .sort((a, b) => b.totalSpent - a.totalSpent)

    const customerTotals = customerItems.reduce(
      (s, r) => ({ customers: s.customers + 1, sales: s.sales + r.salesCount, amount: s.amount + r.totalSpent }),
      { customers: 0, sales: 0, amount: 0 }
    )

    return NextResponse.json({
      range: { from, to },
      locationId: locationId || null,
      q,
      suppliers: { items: supplierItems, totals: supplierTotals },
      customers: { items: customerItems, totals: customerTotals }
    })
  } catch {
    return NextResponse.json({
      range: { from, to },
      locationId: locationId || null,
      q,
      suppliers: { items: [], totals: { vendors: 0, bills: 0, totalPurchased: 0, totalPaid: 0, balance: 0 } },
      customers: { items: [], totals: { customers: 0, sales: 0, amount: 0 } }
    })
  }
}
