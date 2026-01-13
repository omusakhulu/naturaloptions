import { NextResponse } from 'next/server'
import { Decimal } from '@prisma/client/runtime/library'
import { getServerSession } from 'next-auth'

import prisma from '@/lib/prisma'
import { authOptions } from '@/config/auth'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const after = searchParams.get('after')
    const before = searchParams.get('before')
    const vendorId = searchParams.get('vendorId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = {}

    if (after || before) {
      where.date = {}
      if (after) where.date.gte = new Date(after)
      if (before) where.date.lte = new Date(before)
    }

    if (vendorId) {
      where.vendorId = vendorId
    }

    const [items, total, agg] = await Promise.all([
      prisma.purchaseReturn.findMany({
        where,
        orderBy: { date: 'desc' },
        include: { vendor: true },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.purchaseReturn.count({ where }),
      prisma.purchaseReturn.aggregate({ where, _sum: { amount: true } })
    ])

    return NextResponse.json({
      items,
      total: agg._sum.amount || 0,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error('Error fetching purchase returns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch purchase returns', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const {
      vendorId,
      amount,
      date,
      reason,
      items,
      warehouseId,
      purchaseOrderId,
      adjustInventory = true,
      createJournalEntry = true,
      userId: bodyUserId
    } = body || {}

    // Determine user ID: session user > body user > first admin > first user
    let finalUserId = session?.user?.id || bodyUserId

    if (!finalUserId) {
      const firstAdmin = await prisma.user.findFirst({
        where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } }
      })
      finalUserId = firstAdmin?.id
    }

    if (!finalUserId) {
      const firstUser = await prisma.user.findFirst()
      finalUserId = firstUser?.id
    }

    if (!finalUserId) {
      return NextResponse.json({ error: 'No valid user found for the operation' }, { status: 400 })
    }

    if (!vendorId || amount == null || !date) {
      return NextResponse.json({ error: 'vendorId, amount, date are required' }, { status: 400 })
    }

    // Use transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the purchase return record
      const purchaseReturn = await tx.purchaseReturn.create({
        data: {
          vendorId,
          amount: new Decimal(amount),
          date: new Date(date),
          reason
        },
        include: { vendor: true }
      })

      // 2. Adjust inventory if items are provided and adjustInventory is true
      if (adjustInventory && items && Array.isArray(items) && items.length > 0 && warehouseId) {
        for (const item of items) {
          // Find the inventory item
          const inventoryItem = await tx.inventoryItem.findFirst({
            where: {
              warehouseId,
              sku: item.sku
            }
          })

          if (inventoryItem) {
            // Reduce inventory quantity (returned to vendor)
            const newQuantity = Math.max(0, inventoryItem.quantity - item.quantity)
            
            await tx.inventoryItem.update({
              where: { id: inventoryItem.id },
              data: { quantity: newQuantity }
            })

            // Record stock movement
            await tx.stockMovement.create({
              data: {
                warehouseId,
                inventoryId: inventoryItem.id,
                type: 'return',
                quantity: -item.quantity,
                referenceNumber: `PR-${purchaseReturn.id}`,
                notes: `Purchase return to vendor: ${reason || 'No reason provided'}`,
                performedBy: finalUserId
              }
            })
          }
        }
      }

      // 3. Create journal entry for financial adjustment if enabled
      if (createJournalEntry) {
        // Find accounts for the journal entry
        const apAccount = await tx.chartOfAccounts.findFirst({
          where: { accountType: 'LIABILITY', accountName: { contains: 'Payable', mode: 'insensitive' } }
        })
        
        const inventoryAccount = await tx.chartOfAccounts.findFirst({
          where: { accountType: 'ASSET', accountName: { contains: 'Inventory', mode: 'insensitive' } }
        })

        if (apAccount && inventoryAccount) {
          const entryNumber = `JE-PR-${Date.now()}`
          
          await tx.journalEntry.create({
            data: {
              entryNumber,
              reference: `PR-${purchaseReturn.id}`,
              description: `Purchase return - ${purchaseReturn.vendor.name}`,
              entryDate: new Date(date),
              totalDebit: new Decimal(amount),
              totalCredit: new Decimal(amount),
              status: 'POSTED',
              createdBy: finalUserId,
              lineItems: {
                create: [
                  {
                    accountId: apAccount.id,
                    description: 'Reduce accounts payable',
                    debitAmount: new Decimal(amount),
                    creditAmount: new Decimal(0)
                  },
                  {
                    accountId: inventoryAccount.id,
                    description: 'Reduce inventory value',
                    debitAmount: new Decimal(0),
                    creditAmount: new Decimal(amount)
                  }
                ]
              }
            }
          })
        }
      }

      // 4. Update vendor balance if there's a related bill
      if (purchaseOrderId) {
        const relatedBill = await tx.bill.findFirst({
          where: { vendorId, reference: { contains: purchaseOrderId } }
        })

        if (relatedBill) {
          const currentPaid = relatedBill.paidAmount || new Decimal(0)
          const newPaid = new Decimal(currentPaid.toString()).add(new Decimal(amount))
          
          await tx.bill.update({
            where: { id: relatedBill.id },
            data: {
              paidAmount: newPaid,
              status: newPaid.gte(relatedBill.amount) ? 'PAID' : 'PARTIALLY_PAID'
            }
          })
        }
      }

      return purchaseReturn
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('Error creating purchase return:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to create purchase return', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}
