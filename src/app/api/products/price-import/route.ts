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
      const sku = rec.sku?.toString().trim()
      const newPrice = String(rec.new_price || rec.price || rec.current_price)
      if ((!id && !sku) || !newPrice) continue

      // Find product by wooId or SKU
      let product = null
      if (id) {
        product = await prisma.product.findUnique({ where: { wooId: id } })
      }
      if (!product && sku) {
        product = await prisma.product.findFirst({ where: { sku } })
      }
      if (!product) continue

      // Only update if price changed
      if (String(product.price) === newPrice) continue

      // Update WooCommerce if wooId exists
      if (product.wooId) {
        try {
          await wooClient.put(`products/${product.wooId}`, { regular_price: newPrice })
        } catch (err) {
          console.warn('Woo update failed', product.wooId, err)
        }
      }

      // Update DB as well
      if (process.env.DATABASE_URL) {
        await prisma.product.update({ where: { id: product.id }, data: { price: newPrice, regularPrice: newPrice } })
      }
    }

    return new Response('Prices updated', { status: 200 })
  } catch (err: any) {
    console.error('Price import failed', err)
    return new Response('Error processing file', { status: 500 })
  }
}
