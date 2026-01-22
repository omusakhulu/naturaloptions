import { NextRequest } from 'next/server'
import { wooClient } from '@/lib/woocommerce'

export const runtime = 'nodejs'

async function fetchAllVariableProducts() {
  const perPage = 100
  let page = 1
  const all: any[] = []
  while (true) {
    const res = await wooClient.get('products', { type: 'variable', per_page: perPage, page })
    const data = res.data || []
    if (!data.length) break
    all.push(...data)
    if (data.length < perPage) break
    page += 1
  }
  return all
}

export async function GET() {
  try {
    const variableProducts = await fetchAllVariableProducts()

    const variations: any[] = []
    for (const prod of variableProducts) {
      try {
        const res = await wooClient.get(`products/${prod.id}/variations`, { per_page: 100 })
        const vars = res.data || []
        vars.forEach((v: any) =>
          variations.push({
            id: v.id,
            parentId: prod.id,
            product: prod.name,
            sku: v.sku,
            price: v.price,
            stock_status: v.stock_status,
            stock_quantity: v.stock_quantity
          })
        )
      } catch (err) {
        console.warn('Variation fetch failed', prod.id, err)
      }
    }

    return Response.json(variations)
  } catch (err) {
    console.error('Variation list error', err)
    return new Response('Error', { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const parentId = searchParams.get('parentId')
  if (!id || !parentId) return new Response('Missing id', { status: 400 })
  try {
    await wooClient.delete(`products/${parentId}/variations/${id}`, { force: true })
    return new Response('Deleted', { status: 200 })
  } catch (err) {
    console.error('Delete variation error', err)
    return new Response('Error', { status: 500 })
  }
}
