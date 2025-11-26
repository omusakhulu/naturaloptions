import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Fetch all published products and extract unique categories
    const products = await prisma.product.findMany({
      where: {
        status: 'publish'
      },
      select: {
        categories: true
      }
    })

    console.log(`📦 Found ${products.length} published products for category extraction`)

    // Extract and deduplicate categories, count products per category
    const categoryMap = new Map<string, any>()

    products.forEach(product => {
      try {
        const categories = JSON.parse(product.categories || '[]')
        if (Array.isArray(categories)) {
          categories.forEach((cat: any) => {
            if (cat?.name) {
              const catName = cat.name.toLowerCase()
              if (!categoryMap.has(catName)) {
                categoryMap.set(catName, {
                  id: cat.id || catName,
                  name: cat.name,
                  slug: cat.slug || catName,
                  count: 1
                })
              } else {
                // Increment product count for this category
                const existing = categoryMap.get(catName)
                existing.count++
              }
            }
          })
        }
      } catch (e) {
        // Skip invalid JSON
      }
    })

    // Only return categories that have products
    const categories = Array.from(categoryMap.values())
      .filter(cat => cat.count > 0)
      .sort((a, b) => a.name.localeCompare(b.name))

    console.log(`✅ Returning ${categories.length} categories with products`)

    return NextResponse.json({
      success: true,
      count: categories.length,
      categories: categories
    })
  } catch (error) {
    console.error('Error fetching POS categories:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch categories',
        categories: []
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
