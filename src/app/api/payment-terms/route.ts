import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

const hasDb = !!process.env.DATABASE_URL
let memTerms: any[] = [
  { id: 'pt_net_30', name: 'Net 30', days: 30, description: 'Payment due in 30 days' },
  { id: 'pt_net_15', name: 'Net 15', days: 15, description: 'Payment due in 15 days' }
]

export async function GET() {
  if (hasDb) {
    try {
      const terms = await prisma.paymentTerm.findMany({ orderBy: { days: 'asc' } })
      return NextResponse.json({ items: terms })
    } catch {}
  }
  return NextResponse.json({ items: memTerms })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { name, days, description } = body || {}
  if (!name || typeof days !== 'number') return NextResponse.json({ error: 'name and numeric days are required' }, { status: 400 })

  if (hasDb) {
    try {
      const term = await prisma.paymentTerm.create({ data: { name, days, description } })
      return NextResponse.json(term)
    } catch (e: any) {
      return NextResponse.json({ error: e?.message || 'Failed to create payment term' }, { status: 500 })
    }
  }

  const t = { id: String(Date.now()), name, days, description }
  memTerms.push(t)
  memTerms.sort((a, b) => a.days - b.days)
  return NextResponse.json(t)
}
