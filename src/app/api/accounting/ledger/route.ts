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
  const accountId = searchParams.get('accountId') || undefined
  const after = searchParams.get('after')
  const before = searchParams.get('before')

  try {
    // If no accountId given, pick first active account
    let account = null as any
    if (accountId) {
      account = await prisma.chartOfAccounts.findUnique({ where: { id: accountId } })
    } else {
      account = await prisma.chartOfAccounts.findFirst({ where: { isActive: true }, orderBy: { accountCode: 'asc' } })
    }

    if (!account) return NextResponse.json({ account: null, openingBalance: 0, items: [], totals: { debit: 0, credit: 0 }, closingBalance: 0 })

    const whereLines: any = { accountId: account.id }
    const whereOpening: any = { accountId: account.id }

    if (after || before) {
      whereLines.journal = { entryDate: {} as any }
      if (after) whereLines.journal.entryDate.gte = new Date(after)
      if (before) whereLines.journal.entryDate.lte = new Date(before)

      // Opening balance is sum of all entries strictly before 'after'
      if (after) {
        whereOpening.journal = { entryDate: { lt: new Date(after) } }
      }
    }

    const [openingAgg, rows] = await Promise.all([
      prisma.journalLineItem.findMany({
        where: whereOpening,
        select: { debitAmount: true, creditAmount: true, journal: { select: { entryDate: true } } }
      }),
      prisma.journalLineItem.findMany({
        where: whereLines,
        orderBy: [{ journal: { entryDate: 'asc' } }, { id: 'asc' }],
        select: {
          id: true,
          debitAmount: true,
          creditAmount: true,
          description: true,
          journal: { select: { id: true, entryNumber: true, entryDate: true, description: true } }
        }
      })
    ])

    const openingBalance = openingAgg.reduce((s, r) => s + toNumber(r.debitAmount) - toNumber(r.creditAmount), 0)

    let running = openingBalance
    const items = rows.map(r => {
      const debit = toNumber(r.debitAmount)
      const credit = toNumber(r.creditAmount)
      running += debit - credit
      return {
        id: r.id,
        date: r.journal.entryDate,
        entryNumber: r.journal.entryNumber,
        memo: r.description || r.journal.description || '',
        debit,
        credit,
        running
      }
    })

    const totals = items.reduce((s, it) => ({ debit: s.debit + it.debit, credit: s.credit + it.credit }), { debit: 0, credit: 0 })
    const closingBalance = running

    return NextResponse.json({ account, openingBalance, items, totals, closingBalance })
  } catch (e) {
    return NextResponse.json({ account: null, openingBalance: 0, items: [], totals: { debit: 0, credit: 0 }, closingBalance: 0 })
  }
}
