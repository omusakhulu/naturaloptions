import { NextResponse } from 'next/server'

import { WooCommerceService } from '@/lib/woocommerce/woocommerce-service'

// Returns all available order statuses inferred from WooCommerce totals report.
// Shape: { success, statuses: Array<{ key: string; label: string; total: number }> }
export async function GET() {
  try {
    const woo = WooCommerceService.getInstance()

    // WooCommerce does not expose a dedicated statuses endpoint.
    // The totals report returns an object keyed by status slugs including custom ones.
    const totals = await (woo as any).executeApiRequest('/wp-json/wc/v3/reports/orders/totals', 'GET')

    // The response can be an array of objects with slug & total or a map depending on host.
    // Normalize into { key, label, total }[]
    let statuses: Array<{ key: string; label: string; total: number }> = []

    if (Array.isArray(totals)) {
      statuses = totals
        .map((t: any) => {
          const key = String(t?.slug || t?.status || t?.name || '').trim()

          if (!key) return null

          const total = Number(t?.total ?? t?.count ?? 0)
          const label = key.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

          return { key, label, total: isNaN(total) ? 0 : total } as { key: string; label: string; total: number }
        })
        .filter((v: any): v is { key: string; label: string; total: number } => !!v)
    } else if (totals && typeof totals === 'object') {
      statuses = Object.keys(totals).map(k => {
        const v: any = (totals as any)[k]
        const total = Number(v?.total || v?.count || 0)
        const label = k.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

        return { key: k, label, total: isNaN(total) ? 0 : total }
      })
    }

    return NextResponse.json({ success: true, statuses })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch order statuses' },
      { status: 500 }
    )
  }
}
