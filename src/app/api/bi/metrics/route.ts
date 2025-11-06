import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { subDays, startOfDay, formatISO } from 'date-fns'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest) {
  if (!process.env.DATABASE_URL) return Response.json({ error: 'DB disabled' }, { status: 200 })

  try {
    const today = startOfDay(new Date())
    const from = subDays(today, 29)

    // aggregate sales in last 30 days
    const daily = await prisma.order.groupBy({
      by: ['dateCreated'],
      where: { dateCreated: { gte: from } },
      _sum: { total: true },
      _count: { _all: true }
    })

    const dailySales = daily.map(d => ({
      date: formatISO(startOfDay(d.dateCreated as Date), { representation: 'date' }),
      total: Number(d._sum.total || 0)
    }))

    const totalSales = dailySales.reduce((a, b) => a + b.total, 0)
    const totalOrders = daily.reduce((a, b) => a + b._count._all, 0)

    return Response.json({ totalSales, totalOrders, dailySales })
  } catch (err: any) {
    console.error('BI metrics error', err)
    return new Response('Error', { status: 500 })
  }
}
