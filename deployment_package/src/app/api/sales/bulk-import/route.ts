import { NextResponse } from 'next/server'
import { Decimal } from '@prisma/client/runtime/library'

import { prisma } from '@/lib/prisma'

interface ImportSaleRow {
  productSku: string
  quantity: string | number
  unitPrice?: string | number
  customerEmail?: string
  saleDate?: string
  paymentMethod?: string
  discount?: string | number
  notes?: string
}

export async function POST(request: Request) {
  try {
    const { sales } = await request.json()

    if (!Array.isArray(sales) || sales.length === 0) {
      return NextResponse.json({ error: 'No sales data provided' }, { status: 400 })
    }

    const results = {
      imported: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Process each sale row
    for (let i = 0; i < sales.length; i++) {
      const row: ImportSaleRow = sales[i]
      
      try {
        // Find product by SKU
        const product = await prisma.product.findFirst({
          where: { sku: row.productSku }
        })

        if (!product) {
          results.failed++
          results.errors.push(`Row ${i + 1}: Product SKU "${row.productSku}" not found`)
          continue
        }

        // Find customer if email provided
        let customerId: string | null = null
        if (row.customerEmail) {
          const customer = await prisma.pOSCustomer.findFirst({
            where: { email: row.customerEmail }
          })
          customerId = customer?.id || null
        }

        // Calculate amounts
        const quantity = parseInt(String(row.quantity)) || 1
        const unitPrice = row.unitPrice 
          ? parseFloat(String(row.unitPrice)) 
          : parseFloat(product.price || '0')
        const discountPercent = parseFloat(String(row.discount || 0))
        
        const subtotal = quantity * unitPrice
        const discountAmount = (subtotal * discountPercent) / 100
        const totalAmount = subtotal - discountAmount

        // Generate sale number
        const date = new Date()
        const prefix = `IMP-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
        const count = await prisma.pOSSale.count({
          where: { saleNumber: { startsWith: prefix } }
        })
        const saleNumber = `${prefix}-${String(count + 1).padStart(4, '0')}`

        // Get default terminal
        const terminal = await prisma.pOSTerminal.findFirst({
          where: { isActive: true }
        })

        if (!terminal) {
          results.failed++
          results.errors.push(`Row ${i + 1}: No active POS terminal found`)
          continue
        }

        // Get system user for import
        const systemUser = await prisma.user.findFirst({
          where: { role: 'ADMIN' }
        })

        if (!systemUser) {
          results.failed++
          results.errors.push(`Row ${i + 1}: No admin user found for import`)
          continue
        }

        // Create the sale
        await prisma.pOSSale.create({
          data: {
            saleNumber,
            terminalId: terminal.id,
            employeeId: systemUser.id,
            customerId,
            subtotal: new Decimal(subtotal),
            taxAmount: new Decimal(0),
            discountAmount: new Decimal(discountAmount),
            totalAmount: new Decimal(totalAmount),
            paymentMethod: (row.paymentMethod as any) || 'CASH',
            paymentStatus: 'COMPLETED',
            status: 'COMPLETED',
            notes: row.notes || `Bulk import - Row ${i + 1}`,
            saleDate: row.saleDate ? new Date(row.saleDate) : new Date(),
            saleItems: {
              create: [{
                productId: product.id,
                quantity,
                unitPrice: new Decimal(unitPrice),
                discount: new Decimal(discountAmount),
                total: new Decimal(totalAmount)
              }]
            }
          }
        })

        // Update product stock
        await prisma.product.update({
          where: { id: product.id },
          data: {
            actualStock: { decrement: quantity }
          }
        })

        // Record stock movement
        await prisma.productStockMovement.create({
          data: {
            productId: product.id,
            type: 'SALE',
            quantity: -quantity,
            beforeActual: product.actualStock,
            afterActual: product.actualStock - quantity,
            reference: saleNumber,
            reason: 'Bulk import sale',
            userName: 'system-import'
          }
        })

        results.imported++
      } catch (err: any) {
        results.failed++
        results.errors.push(`Row ${i + 1}: ${err.message}`)
      }
    }

    return NextResponse.json(results)
  } catch (error: any) {
    console.error('Bulk import error:', error)
    return NextResponse.json(
      { error: 'Bulk import failed', details: error.message },
      { status: 500 }
    )
  }
}
