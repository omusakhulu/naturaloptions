import { NextRequest } from 'next/server'
import { parse } from 'csv-parse/sync'
import { prisma } from '@/lib/prisma'
import { wooClient } from '@/lib/woocommerce'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return new Response('File missing', { status: 400 })

    const text = await file.text()
    const records: any[] = parse(text, { columns: true, skip_empty_lines: true })

    // Iterate records and update
    for (const rec of records) {
      const id = Number(rec.wooId)
      const newPrice = String(rec.new_price || rec.price || rec.current_price)
      if (isNaN(id) || !newPrice) continue

      // Update WooCommerce
      try {
        await wooClient.put(`products/${id}`, { regular_price: newPrice })
      } catch (err) {
        console.warn('Woo update failed', id, err)
      }

      // Update DB as well
      if (process.env.DATABASE_URL) {
        await prisma.product.update({ where: { wooId: id }, data: { price: newPrice, regularPrice: newPrice } })
      }
    }

    return new Response('Prices updated', { status: 200 })
  } catch (err: any) {
    console.error('Price import failed', err)
    return new Response('Error processing file', { status: 500 })
  }
}
