import { NextRequest } from 'next/server'
import { parse } from 'csv-parse/sync'
import { wooClient } from '@/lib/woocommerce'
import { saveProduct } from '@/lib/db/products'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return new Response('File missing', { status: 400 })

    const text = await file.text()
    const records: any[] = parse(text, { columns: true, skip_empty_lines: true })

    const results: string[] = []

    for (const rec of records) {
      const name = rec.product_name?.trim()
      if (!name) {
        results.push('Skipped row without product_name')
        continue
      }
      const body: any = {
        name,
        regular_price: rec.selling_price || '0',
        sku: rec.sku || undefined,
        type: rec.product_type === 'variable' ? 'variable' : 'simple',
        manage_stock: rec.manage_stock?.toLowerCase() === 'yes',
        stock_quantity: rec.opening_stock ? Number(rec.opening_stock) : undefined
      }
      try {
        const res = await wooClient.post('products', body)
        await saveProduct(res.data) // save to DB
        results.push(`Created ${name}`)
      } catch (err: any) {
        results.push(`Error ${name}: ${err?.response?.data?.message || err.message}`)
      }
    }

    return new Response(results.join('\n'), { status: 200 })
  } catch (err: any) {
    console.error('Bulk import error', err)
    return new Response('Error processing file', { status: 500 })
  }
}
