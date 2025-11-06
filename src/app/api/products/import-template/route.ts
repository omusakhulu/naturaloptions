export const runtime = 'nodejs'

const headers = [
  'product_name',
  'brand',
  'unit',
  'category',
  'sub_category',
  'sku',
  'barcode_type',
  'manage_stock(Yes/No)',
  'alert_quantity',
  'expiration_period_days',
  'selling_price',
  'tax_percent',
  'product_type(simple/variable)',
  'variation_attributes(comma_separated)',
  'opening_stock',
  'location',
  'image_url'
]

export async function GET() {
  const csv = headers.join(',') + '\n'
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="products_import_template.csv"'
    }
  })
}
