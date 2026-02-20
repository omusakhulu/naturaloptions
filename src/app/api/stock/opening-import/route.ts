import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { prisma } from '@/lib/prisma'
import { authOptions } from '@/config/auth'

export const runtime = 'nodejs'

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]

    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }

  result.push(current.trim())

  return result
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json('No file uploaded', { status: 400 })
    }

    const text = await file.text()
    const lines = text.split(/\r?\n/).filter(l => l.trim())

    if (lines.length < 2) {
      return NextResponse.json('CSV must have a header row and at least one data row', { status: 400 })
    }

    const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'))
    const skuIdx = headers.indexOf('product_sku')
    const locIdx = headers.indexOf('location')
    const qtyIdx = headers.indexOf('quantity')
    const costIdx = headers.indexOf('unit_cost')
    const expiryIdx = headers.indexOf('expiry_date')
    const batchIdx = headers.indexOf('batch_number')
    const warrantyIdx = headers.indexOf('warranty_name')

    if (skuIdx === -1 || locIdx === -1 || qtyIdx === -1) {
      return NextResponse.json('CSV must have columns: product_sku, location, quantity', { status: 400 })
    }

    let imported = 0
    let failed = 0
    const errors: string[] = []

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i])
      const sku = cols[skuIdx] || ''
      const locationName = cols[locIdx] || ''
      const quantityStr = cols[qtyIdx] || ''
      const unitCost = costIdx >= 0 ? cols[costIdx] : ''
      const expiryDate = expiryIdx >= 0 ? cols[expiryIdx] : ''
      const batchNumber = batchIdx >= 0 ? cols[batchIdx] : ''
      const warrantyName = warrantyIdx >= 0 ? cols[warrantyIdx] : ''

      if (!sku || !locationName || !quantityStr) {
        failed++
        errors.push(`Row ${i + 1}: Missing required field (sku, location, or quantity)`)
        continue
      }

      const quantity = parseInt(quantityStr, 10)

      if (isNaN(quantity) || quantity <= 0) {
        failed++
        errors.push(`Row ${i + 1}: Invalid quantity "${quantityStr}"`)
        continue
      }

      try {
        // Find product by SKU
        const product = await prisma.product.findFirst({ where: { sku } })

        if (!product) {
          failed++
          errors.push(`Row ${i + 1}: Product with SKU "${sku}" not found`)
          continue
        }

        // Find or create location
        let location = await prisma.location.findFirst({
          where: { name: { equals: locationName, mode: 'insensitive' } }
        })

        if (!location) {
          location = await prisma.location.create({
            data: { name: locationName, isActive: true }
          })
        }

        // Run stock update in a transaction
        await prisma.$transaction(async (tx) => {
          const beforeActual = product.actualStock
          const afterActual = beforeActual + quantity

          // Update product actual stock
          await tx.product.update({
            where: { id: product.id },
            data: { actualStock: afterActual, updatedAt: new Date() }
          })

          // Upsert inventory location
          const existing = await tx.inventoryLocation.findUnique({
            where: { productId_locationId: { productId: product.id, locationId: location!.id } }
          })

          if (existing) {
            await tx.inventoryLocation.update({
              where: { productId_locationId: { productId: product.id, locationId: location!.id } },
              data: { quantity: existing.quantity + quantity, lastUpdated: new Date() }
            })
          } else {
            await tx.inventoryLocation.create({
              data: {
                productId: product.id,
                locationId: location!.id,
                quantity,
                lastUpdated: new Date()
              }
            })
          }

          // Create stock movement
          await tx.productStockMovement.create({
            data: {
              productId: product.id,
              type: 'PURCHASE',
              quantity,
              beforeActual,
              afterActual,
              beforeWebsite: product.websiteStock,
              afterWebsite: product.websiteStock,
              reference: batchNumber ? `OPENING-${batchNumber}` : `OPENING-${Date.now()}`,
              locationId: location!.id,
              reason: 'Opening stock import',
              notes: unitCost ? `Unit cost: ${unitCost}` : undefined,
              userId: session.user.id,
              userName: session.user.name || session.user.email
            }
          })

          // Handle warranty assignment
          if (warrantyName) {
            const warranty = await tx.warranty.findFirst({
              where: { name: { equals: warrantyName, mode: 'insensitive' } }
            })

            if (warranty) {
              const warrantyExpiry = expiryDate ? new Date(expiryDate) : undefined

              await tx.productWarranty.upsert({
                where: {
                  productId_warrantyId_batchNumber: {
                    productId: product.id,
                    warrantyId: warranty.id,
                    batchNumber: batchNumber || ''
                  }
                },
                create: {
                  productId: product.id,
                  warrantyId: warranty.id,
                  expiryDate: warrantyExpiry,
                  batchNumber: batchNumber || ''
                },
                update: {
                  expiryDate: warrantyExpiry
                }
              })
            }
          }
        })

        imported++
      } catch (rowErr: any) {
        failed++
        errors.push(`Row ${i + 1}: ${rowErr.message}`)
      }
    }

    const summary = [
      `Import complete: ${imported} imported, ${failed} failed out of ${lines.length - 1} rows.`,
      ...errors
    ].join('\n')

    return NextResponse.json(summary)
  } catch (error: any) {
    console.error('Opening stock import error:', error)

    return NextResponse.json(
      `Import failed: ${error.message}`,
      { status: 500 }
    )
  }
}
