import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

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
  const after = searchParams.get('after')
  const before = searchParams.get('before')

  try {
    const whereLines: any = {}
    if (after || before) {
      whereLines.journal = { entryDate: {} as any }
      if (after) whereLines.journal.entryDate.gte = new Date(after)
      if (before) whereLines.journal.entryDate.lte = new Date(before)
    }

    const lines = await prisma.journalLineItem.findMany({
      where: whereLines,
      select: { accountId: true, debitAmount: true, creditAmount: true }
    })

    const mapAgg: Record<string, { debit: number; credit: number }> = {}
    for (const l of lines) {
      const key = l.accountId
      if (!mapAgg[key]) mapAgg[key] = { debit: 0, credit: 0 }
      mapAgg[key].debit += toNumber(l.debitAmount)
      mapAgg[key].credit += toNumber(l.creditAmount)
    }

    const ids = Object.keys(mapAgg)
    const accounts = await prisma.chartOfAccounts.findMany({ where: { id: { in: ids } } })
    const map: Record<string, any> = {}
    for (const a of accounts) map[a.id] = a

    const items = ids.map(id => {
      const acc = map[id]
      const { debit, credit } = mapAgg[id]
      return {
        accountId: id,
        accountCode: acc?.accountCode || '',
        accountName: acc?.accountName || id,
        accountType: acc?.accountType || '',
        debit,
        credit,
        balance: debit - credit
      }
    }).sort((a, b) => a.accountName.localeCompare(b.accountName))

    const totals = items.reduce((s, r) => ({
      debit: s.debit + r.debit,
      credit: s.credit + r.credit
    }), { debit: 0, credit: 0 })

    return NextResponse.json({ items, totals, difference: totals.debit - totals.credit })
  } catch (e) {
    return NextResponse.json({ items: [], totals: { debit: 0, credit: 0 }, difference: 0 })
  }
}
