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

function makeEntryNumber() {
  const d = new Date()
  const y = d.getFullYear().toString().slice(-2)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const rand = Math.floor(Math.random() * 900) + 100
  return `JNL${y}${m}${day}/${rand}`
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const after = searchParams.get('after')
  const before = searchParams.get('before')
  const q = searchParams.get('q') || ''
  const where: any = {}
  if (after || before) {
    where.entryDate = {}
    if (after) where.entryDate.gte = new Date(after)
    if (before) where.entryDate.lte = new Date(before)
  }
  if (q) {
    where.OR = [
      { entryNumber: { contains: q, mode: 'insensitive' } },
      { reference: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } }
    ]
  }
  try {
    const items = await prisma.journalEntry.findMany({
      where,
      orderBy: { entryDate: 'desc' },
      select: {
        id: true,
        entryNumber: true,
        reference: true,
        description: true,
        entryDate: true,
        totalDebit: true,
        totalCredit: true,
        creator: { select: { id: true, name: true, email: true } }
      }
    })
    return NextResponse.json({ items })
  } catch (e) {
    return NextResponse.json({ items: [] })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { entryDate, reference, description, lines } = body || {}

    if (!entryDate || !Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json({ error: 'entryDate and at least one line are required' }, { status: 400 })
    }

    const sanitized = (lines as any[])
      .map(l => ({
        accountId: l.accountId,
        description: l.description || null,
        debitAmount: toNumber(l.debit),
        creditAmount: toNumber(l.credit)
      }))
      .filter(l => l.accountId && (l.debitAmount > 0 || l.creditAmount > 0))

    if (sanitized.length === 0) {
      return NextResponse.json({ error: 'Provide at least one non-zero debit or credit line' }, { status: 400 })
    }

    const totalDebit = sanitized.reduce((s, l) => s + l.debitAmount, 0)
    const totalCredit = sanitized.reduce((s, l) => s + l.creditAmount, 0)

    if (Math.round((totalDebit - totalCredit) * 100) !== 0) {
      return NextResponse.json({ error: 'Debits must equal credits' }, { status: 400 })
    }

    const user = await prisma.user.findFirst()
    if (!user) {
      return NextResponse.json({ error: 'No user found to set as creator' }, { status: 400 })
    }

    const created = await prisma.journalEntry.create({
      data: {
        entryNumber: makeEntryNumber(),
        reference: reference || null,
        description: description || '',
        entryDate: new Date(entryDate),
        totalDebit,
        totalCredit,
        createdBy: user.id,
        lineItems: { create: sanitized }
      },
      include: { lineItems: true }
    })

    return NextResponse.json(created)
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to create journal entry' }, { status: 500 })
  }
}
