import { NextRequest } from 'next/server'
import { getAllProducts } from '@/lib/db/products'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest) {
  try {
    const products = await getAllProducts()

    const headers = ['wooId', 'sku', 'name', 'current_price']
    const rows = products.map(p => [p.wooId, p.sku || '', p.name, p.price || ''])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="product_prices.csv"'
      }
    })
  } catch (err: any) {
    console.error('Price export failed', err)
    return new Response('Error generating CSV', { status: 500 })
  }
}
