import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const isActiveParam = searchParams.get('isActive')

  const where: any = {}
  if (isActiveParam != null) where.isActive = isActiveParam === 'true'

  try {
    const rows = await prisma.location.findMany({
      where,
      select: { id: true, name: true, isActive: true },
      orderBy: { name: 'asc' }
    })
    const items = rows.map(r => ({ id: r.id, name: r.name, isActive: r.isActive }))
    return NextResponse.json({ items })
  } catch (e) {
    return NextResponse.json({ items: [] })
  }
}
