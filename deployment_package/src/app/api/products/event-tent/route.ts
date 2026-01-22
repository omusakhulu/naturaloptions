import { NextRequest, NextResponse } from 'next/server'

import { WooCommerceService } from '@/lib/woocommerce/woocommerce-service'

/**
 * POST /api/products/event-tent
 * Create a new Event Tent rental product with dynamic size variations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      name = 'Event Tent',
      description,
      shortDescription,
      basePrice,
      pricePerSquareMeter,
      sizes, // Array of {length, width, price?, stockQuantity?}
      rentalMetadata,
      linkedProducts,
      categories,
      images,
      sku
    } = body

    // Validate required fields
    if (!basePrice && !pricePerSquareMeter) {
      return NextResponse.json({ error: 'Either basePrice or pricePerSquareMeter is required' }, { status: 400 })
    }

    // Initialize WooCommerce Service
    const wooService = WooCommerceService.getInstance()

    // Prepare product data structure
    const productData: any = {
      name: name,
      type: 'variable', // Variable product for sizes
      status: 'publish',
      description:
        description || 'A versatile tent suitable for various events, available in multiple customizable sizes.',
      short_description: shortDescription || 'Customizable event tent rental',
      sku: sku || `EVENT-TENT-${Date.now()}`,
      manage_stock: true,
      categories: categories || [
        { id: 15 } // Default category, you can adjust
      ],
      images: images || [],
      meta_data: [
        // Custom rental metadata
        {
          key: '_rental_product',
          value: 'yes'
        },
        {
          key: '_rental_duration_unit',
          value: rentalMetadata?.rental_duration_unit || 'day'
        },
        {
          key: '_minimum_rental_duration',
          value: rentalMetadata?.minimum_rental_duration || 1
        },
        {
          key: '_setup_time_required',
          value: rentalMetadata?.setup_time_required || '2 hours'
        },
        {
          key: '_teardown_time_required',
          value: rentalMetadata?.teardown_time_required || '2 hours'
        },
        {
          key: '_capacity_standing',
          value: rentalMetadata?.capacity_standing || 'Variable by size'
        },
        {
          key: '_capacity_seated',
          value: rentalMetadata?.capacity_seated || 'Variable by size'
        },
        {
          key: '_base_price',
          value: basePrice?.toString() || '0'
        },
        {
          key: '_price_per_square_meter',
          value: pricePerSquareMeter?.toString() || '0'
        },
        {
          key: '_linked_products',
          value: JSON.stringify(linkedProducts || [])
        }
      ],
      attributes: [
        {
          id: 0, // Custom attribute
          name: 'Size',
          position: 0,
          visible: true,
          variation: true,
          options: [] // Will be populated with size options
        }
      ]
    }

    // Generate size variations
    const sizeOptions: string[] = []
    const variations: any[] = []

    if (sizes && Array.isArray(sizes)) {
      for (const size of sizes) {
        const { length, width, price, stockQuantity } = size
        const sizeLabel = `${length}m x ${width}m`

        sizeOptions.push(sizeLabel)

        // Calculate price if not provided
        let variationPrice = price

        if (!variationPrice && pricePerSquareMeter) {
          const area = length * width

          variationPrice = basePrice
            ? Number(basePrice) + area * Number(pricePerSquareMeter)
            : area * Number(pricePerSquareMeter)
        } else if (!variationPrice) {
          variationPrice = basePrice || 0
        }

        // Calculate capacity
        const area = length * width
        const capacityStanding = Math.floor(area * 1.5) // ~1.5 people per sq meter standing
        const capacitySeated = Math.floor(area * 0.8) // ~0.8 people per sq meter seated

        variations.push({
          attributes: [
            {
              name: 'Size',
              option: sizeLabel
            }
          ],
          regular_price: variationPrice.toString(),
          manage_stock: true,
          stock_quantity: stockQuantity || 10,
          sku: `${productData.sku}-${length}X${width}`,
          meta_data: [
            {
              key: '_tent_length',
              value: length.toString()
            },
            {
              key: '_tent_width',
              value: width.toString()
            },
            {
              key: '_tent_area',
              value: area.toString()
            },
            {
              key: '_capacity_standing',
              value: capacityStanding.toString()
            },
            {
              key: '_capacity_seated',
              value: capacitySeated.toString()
            }
          ]
        })
      }
    }

    // Update size options in attributes
    productData.attributes[0].options = sizeOptions

    // Create the main product
    console.log('Creating Event Tent product in WooCommerce...')
    const createdProduct = await wooService.createProduct(productData)

    console.log('✅ Event Tent product created:', createdProduct.id)

    // Create variations if we have sizes
    if (variations.length > 0) {
      console.log(`Creating ${variations.length} size variations...`)
      const createdVariations = []

      for (const variation of variations) {
        try {
          const variationResponse = await fetch(
            `${process.env.WOO_STORE_URL}/wp-json/wc/v3/products/${createdProduct.id}/variations`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization:
                  'Basic ' +
                  Buffer.from(`${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_CONSUMER_SECRET}`).toString('base64')
              },
              body: JSON.stringify(variation)
            }
          )

          if (variationResponse.ok) {
            const createdVariation = await variationResponse.json()

            createdVariations.push(createdVariation)
            console.log(`✅ Created variation: ${variation.attributes[0].option}`)
          }
        } catch (error) {
          console.error(`Error creating variation:`, error)
        }
      }

      return NextResponse.json({
        success: true,
        product: createdProduct,
        variations: createdVariations,
        message: `Event Tent product created with ${createdVariations.length} size variations`
      })
    }

    return NextResponse.json({
      success: true,
      product: createdProduct,
      message: 'Event Tent product created successfully'
    })
  } catch (error: any) {
    console.error('Error creating Event Tent product:', error)

    return NextResponse.json(
      {
        error: 'Failed to create Event Tent product',
        details: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/products/event-tent
 * Get all Event Tent products
 */
export async function GET(request: NextRequest) {
  try {
    const wooService = WooCommerceService.getInstance()

    // Search for Event Tent products
    const products = await wooService.listProducts(1, 100)

    return NextResponse.json({
      success: true,
      products,
      count: products.length
    })
  } catch (error: any) {
    console.error('Error fetching Event Tent products:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch Event Tent products',
        details: error.message
      },
      { status: 500 }
    )
  }
}
