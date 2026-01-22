import { NextRequest } from 'next/server'
import { getAllProducts } from '@/lib/db/products'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest) {
  try {
    const products = await getAllProducts()

    const headers = ['wooId', 'sku', 'name', 'current_price']
    const rows = products.map(p => [p.wooId, p.sku || '', p.name, p.price || ''])

    function escapeCsv(val: any) {
  if (val == null) return ''
  const str = String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

const csv = [headers.join(','), ...rows.map(r => r.map(escapeCsv).join(','))].join('\n')

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
