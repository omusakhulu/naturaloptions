import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const TEMPLATE_CSV = `product_sku,location,quantity,unit_cost,expiry_date,batch_number,warranty_name
SKU001,Main Store,100,50.00,2027-12-31,BATCH-001,1 Year Warranty
SKU002,Warehouse A,50,120.00,,BATCH-002,
`

export async function GET() {
  return new NextResponse(TEMPLATE_CSV, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="opening-stock-template.csv"'
    }
  })
}
