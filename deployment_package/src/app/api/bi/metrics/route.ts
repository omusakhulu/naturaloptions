import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { subDays, startOfDay, formatISO } from 'date-fns'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest) {
  if (!process.env.DATABASE_URL) return Response.json({ totalSales: 0, totalOrders: 0, dailySales: [] }, { status: 200 })

  try {
    const today = startOfDay(new Date())
    const from = subDays(today, 29)

    // Fetch orders and aggregate in JS since 'total' is stored as string
    const orders = await prisma.order.findMany({
      where: { dateCreated: { gte: from } },
      select: { dateCreated: true, total: true }
    })

    const byDay = new Map<string, number>()
    for (const o of orders) {
      const day = formatISO(startOfDay(o.dateCreated as Date), { representation: 'date' })
      const val = parseFloat((o.total as unknown as string) || '0') || 0
      byDay.set(day, (byDay.get(day) || 0) + val)
    }

    const dailySales = Array.from(byDay.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, total]) => ({ date, total }))

    const totalSales = orders.reduce((sum, o) => sum + (parseFloat((o.total as unknown as string) || '0') || 0), 0)
    const totalOrders = orders.length

    return Response.json({ totalSales, totalOrders, dailySales })
  } catch (err: any) {
    console.error('BI metrics error', err)
    return new Response('Error', { status: 500 })
  }
}
