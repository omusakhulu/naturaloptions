import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  const items = await prisma.paymentAccount.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json({ items })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { name, type, balance = 0, status = 'Active' } = body || {}
  if (!name || !type) return NextResponse.json({ error: 'name and type are required' }, { status: 400 })
  const item = await prisma.paymentAccount.create({ data: { name, type, balance, status } })
  return NextResponse.json(item)
}
