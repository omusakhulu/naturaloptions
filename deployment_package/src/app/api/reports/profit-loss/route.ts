import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/config/auth'
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
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const fromStr = searchParams.get('from')
  const toStr = searchParams.get('to')

  const today = new Date()
  const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1)
  const from = fromStr ? new Date(fromStr) : defaultFrom
  const to = toStr ? new Date(toStr) : today

  try {
    // Revenue (REVENUE): credit - debit
    const revAgg = await prisma.journalLineItem.groupBy({
      by: ['accountId'],
      where: { journal: { entryDate: { gte: from, lte: to } }, account: { accountType: 'REVENUE' } },
      _sum: { creditAmount: true, debitAmount: true }
    })
    const revenue = revAgg.reduce((s, r) => s + toNumber(r._sum.creditAmount) - toNumber(r._sum.debitAmount), 0)

    // COGS (using flexible accountCategory = 'COGS'): debit - credit
    const cogsAgg = await prisma.journalLineItem.groupBy({
      by: ['accountId'],
      where: { journal: { entryDate: { gte: from, lte: to } }, account: { accountCategory: 'COGS' } },
      _sum: { creditAmount: true, debitAmount: true }
    })
    const cogs = cogsAgg.reduce((s, r) => s + toNumber(r._sum.debitAmount) - toNumber(r._sum.creditAmount), 0)

    // Expenses breakdown by account (EXPENSE): debit - credit
    const expAgg = await prisma.journalLineItem.groupBy({
      by: ['accountId'],
      where: { journal: { entryDate: { gte: from, lte: to } }, account: { accountType: 'EXPENSE' } },
      _sum: { creditAmount: true, debitAmount: true }
    })
    const accountIds = expAgg.map(e => e.accountId)
    const accounts = accountIds.length
      ? await prisma.chartOfAccounts.findMany({ where: { id: { in: accountIds } }, select: { id: true, accountName: true } })
      : []
    const expenseBreakdown = expAgg.map(e => ({
      account: accounts.find(a => a.id === e.accountId)?.accountName || 'Expense',
      amount: toNumber(e._sum.debitAmount) - toNumber(e._sum.creditAmount)
    }))
    const expenses = expenseBreakdown.reduce((s, r) => s + toNumber(r.amount), 0)

    const grossProfit = revenue - cogs
    const netProfit = grossProfit - expenses

    return NextResponse.json({
      range: { from, to },
      totals: { revenue, cogs, grossProfit, expenses, netProfit },
      expenseBreakdown
    })
  } catch (e) {
    return NextResponse.json({ range: { from, to }, totals: { revenue: 0, cogs: 0, grossProfit: 0, expenses: 0, netProfit: 0 }, expenseBreakdown: [] })
  }
}
