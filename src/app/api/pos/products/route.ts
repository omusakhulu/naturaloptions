import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Fetch products for POS
    const products = await prisma.product.findMany({
      where: {
        status: 'publish'
        // Temporarily show all products to debug
      },
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        regularPrice: true,
        salePrice: true,
        actualStock: true,
        stockQuantity: true,
        categories: true,
        image: true,
        description: true,
        shortDescription: true
      },
      orderBy: {
        name: 'asc'
      },
      take: 100 // Limit to 100 products for performance
    })

    console.log(`📦 Found ${products.length} products in database`)

    // Parse categories from JSON string
    const formattedProducts = products.map(product => {
      let categories = []
      try {
        const parsed = JSON.parse(product.categories || '[]')
        categories = Array.isArray(parsed) ? parsed : []
      } catch (e) {
        categories = []
      }

      // Get first category as main category
      const mainCategory = categories.length > 0 ? categories[0]?.name?.toLowerCase() : 'uncategorized'

      return {
        id: product.id,
        name: product.name,
        sku: product.sku || 'N/A',
        price: parseFloat(product.salePrice || product.price || product.regularPrice || '0'),
        stock: product.actualStock || product.stockQuantity || 0,
        category: mainCategory,
        categories: categories,
        image: product.image
      }
    })

    console.log(`✅ Returning ${formattedProducts.length} formatted products`)
    
    return NextResponse.json({
      success: true,
      count: formattedProducts.length,
      products: formattedProducts
    })
  } catch (error) {
    console.error('Error fetching POS products:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch products',
        products: []
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
