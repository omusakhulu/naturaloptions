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

    const agg: Record<string, { debit: number; credit: number; balance: number }> = {}
    for (const l of lines) {
      const key = l.accountId
      if (!agg[key]) agg[key] = { debit: 0, credit: 0, balance: 0 }
      const d = toNumber(l.debitAmount)
      const c = toNumber(l.creditAmount)
      agg[key].debit += d
      agg[key].credit += c
      agg[key].balance += d - c
    }

    const accounts = await prisma.chartOfAccounts.findMany({
      select: { id: true, accountCode: true, accountName: true, accountType: true, parentId: true, isActive: true }
    })

    const map: Record<string, any> = {}
    const roots: any[] = []

    for (const a of accounts) {
      map[a.id] = {
        id: a.id,
        code: a.accountCode,
        name: a.accountName,
        type: a.accountType,
        parentId: a.parentId || null,
        isActive: a.isActive,
        debit: agg[a.id]?.debit || 0,
        credit: agg[a.id]?.credit || 0,
        balance: agg[a.id]?.balance || 0,
        children: [] as any[]
      }
    }

    for (const id in map) {
      const node = map[id]
      if (node.parentId && map[node.parentId]) {
        map[node.parentId].children.push(node)
      } else {
        roots.push(node)
      }
    }

    const sortTree = (nodes: any[]) => {
      nodes.sort((a, b) => (a.code || '').localeCompare(b.code || ''))
      for (const n of nodes) sortTree(n.children)
    }
    sortTree(roots)

    const totals = Object.values(map).reduce(
      (s: any, n: any) => ({ debit: s.debit + n.debit, credit: s.credit + n.credit }),
      { debit: 0, credit: 0 }
    )

    return NextResponse.json({ tree: roots, totals, difference: totals.debit - totals.credit })
  } catch (e) {
    return NextResponse.json({ tree: [], totals: { debit: 0, credit: 0 }, difference: 0 })
  }
}
