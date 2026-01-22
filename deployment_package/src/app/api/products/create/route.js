import https from 'node:https'
import dns from 'node:dns'
import { URL } from 'node:url'

import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function POST(request) {
  try {
    const data = await request.json()

    // Validate required fields
    if (!data.name || data.regular_price === undefined) {
      return NextResponse.json({ success: false, error: 'Name and price are required' }, { status: 400 })
    }

    // 1. Create product in WooCommerce (IPv4 + keep-alive https request)
    const wooProductData = {
      name: data.name,
      type: data.type || 'simple',
      regular_price: data.regular_price.toString(),
      description: data.description || '',
      short_description: data.short_description || '',
      status: 'publish', // Default to publish
      stock_quantity: parseInt(data.stock_quantity) || 0,
      stock_status: data.stock_status || 'instock',
      manage_stock: data.manage_stock !== undefined ? data.manage_stock : true,
      sku: data.sku || '',
      categories: data.categories || [],
      sale_price: data.sale_price ? String(data.sale_price) : '',
      catalog_visibility: data.catalog_visibility || 'visible'
    }

    // For variable products, WooCommerce expects stock to be managed at the variation level.
    // Disable parent manage_stock and omit stock_quantity to prevent parent showing Out of Stock.
    if (wooProductData.type === 'variable') {
      wooProductData.manage_stock = false
      delete wooProductData.stock_quantity
    }

    if (Array.isArray(data.images) && data.images.length) {
      // Preserve order: first is featured; include positions for clarity
      wooProductData.images = data.images.map((img, idx) => ({ ...img, position: idx }))
    }

    if (Array.isArray(data.attributes) && data.attributes.length) {
      wooProductData.attributes = data.attributes
    }

    console.log('Creating WooCommerce product with data:', wooProductData)

    const storeUrl =
      process.env.WOO_STORE_URL || process.env.NEXT_PUBLIC_WOOCOMMERCE_STORE_URL || process.env.WORDPRESS_BASE_URL

    const key = process.env.WOOCOMMERCE_CONSUMER_KEY || process.env.NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_KEY
    const secret = process.env.WOOCOMMERCE_CONSUMER_SECRET || process.env.NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_SECRET

    if (!storeUrl || !key || !secret) {
      return NextResponse.json({ success: false, error: 'WooCommerce credentials not configured' }, { status: 500 })
    }

    const endpoint = new URL(`${storeUrl.replace(/\/$/, '')}/wp-json/wc/v3/products`)
    const auth = Buffer.from(`${key}:${secret}`).toString('base64')
    const body = Buffer.from(JSON.stringify(wooProductData))

    const agent = new https.Agent({ keepAlive: true, maxSockets: 10, timeout: 25000 })

    const address = await new Promise((resolve, reject) => {
      dns.lookup(endpoint.hostname, { family: 4 }, (err, addr) =>
        err || !addr ? reject(err || new Error('DNS failed')) : resolve(addr)
      )
    })

    const options = {
      host: address,
      servername: endpoint.hostname,
      port: endpoint.port ? Number(endpoint.port) : 443,
      method: 'POST',
      path: endpoint.pathname + endpoint.search,
      agent,
      headers: {
        Host: endpoint.hostname,
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Content-Length': Buffer.byteLength(body).toString(),
        'User-Agent': 'Natural Options Admin/1.0',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache'
      }
    }

    const wooProduct = await new Promise((resolve, reject) => {
      const req = https.request(options, res => {
        const chunks = []

        res.on('data', d => chunks.push(Buffer.isBuffer(d) ? d : Buffer.from(d)))
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8')
          const status = res.statusCode || 0
          let parsed = {}

          try {
            parsed = text ? JSON.parse(text) : {}
          } catch {
            parsed = { message: text }
          }

          if (status >= 200 && status < 300) return resolve(parsed)
          console.error('[Woo Create] Error', { status, details: parsed })
          reject(Object.assign(new Error('WooCommerce create failed'), { status, details: parsed }))
        })
      })

      req.setTimeout(25000, () => req.destroy(new Error('request timeout')))
      req.on('error', err => reject(err))
      req.write(body)
      req.end()
    })

    // If images were requested but Woo returned none, set them explicitly now (after creation)
    if (Array.isArray(data.images) && data.images.length && (!wooProduct.images || !wooProduct.images.length)) {
      try {
        const updateBody = Buffer.from(
          JSON.stringify({ images: data.images.map((img, idx) => ({ ...img, position: idx })) })
        )

        const updateOptions = {
          host: address,
          servername: endpoint.hostname,
          port: endpoint.port ? Number(endpoint.port) : 443,
          method: 'PUT',
          path: `${endpoint.pathname}/${wooProduct.id}`,
          agent,
          headers: {
            Host: endpoint.hostname,
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'Content-Length': Buffer.byteLength(updateBody).toString(),
            'User-Agent': 'Natural Options Admin/1.0',
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache'
          }
        }

        await new Promise(resolve => {
          const req = https.request(updateOptions, res => {
            const chunks = []

            res.on('data', d => chunks.push(Buffer.isBuffer(d) ? d : Buffer.from(d)))
            res.on('end', () => {
              const status = res.statusCode || 0

              if (status < 200 || status >= 300) {
                console.error('[Woo Update Images] Error', { status, body: Buffer.concat(chunks).toString('utf8') })
              }

              resolve(true)
            })
          })

          req.setTimeout(25000, () => req.destroy(new Error('request timeout')))
          req.on('error', err => console.error('[Woo Update Images] Network error', err))
          req.write(updateBody)
          req.end()
        })
      } catch (e) {
        console.error('[Woo Update Images] Failed', e)
      }
    }

    // 2. Save to local database
    try {
      const toSlug = (s = '') =>
        s
          .toString()
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')

      const localProduct = await prisma.product.create({
        data: {
          wooId: Number(wooProduct.id),
          name: wooProduct.name,
          slug: wooProduct.slug || toSlug(wooProduct.name || data.name || ''),
          price: (wooProduct.price ?? data.regular_price ?? '0').toString(),
          regularPrice: (wooProduct.regular_price ?? data.regular_price ?? '0').toString(),
          salePrice: wooProduct.sale_price != null ? String(wooProduct.sale_price) : null,
          description: wooProduct.description || data.description || '',
          shortDescription: wooProduct.short_description || data.short_description || '',
          status: wooProduct.status || 'publish',
          sku: wooProduct.sku || data.sku || '',
          stockQuantity: parseInt(wooProduct.stock_quantity || data.stock_quantity || 0),
          stockStatus: wooProduct.stock_status || data.stock_status || 'instock'
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          wooProductId: wooProduct.id,
          localProductId: localProduct.id,
          product: localProduct
        }
      })
    } catch (dbError) {
      console.error('Database error:', dbError)

      // Try to delete the WooCommerce product if database save fails
      if (wooProduct.id) {
        try {
          await fetch(
            `${process.env.NEXT_PUBLIC_WOOCOMMERCE_STORE_URL}/wp-json/wc/v3/products/${wooProduct.id}?force=true`,
            {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Basic ${Buffer.from(
                  `${process.env.NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_KEY}:${process.env.NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_SECRET}`
                ).toString('base64')}`
              }
            }
          )
        } catch (deleteError) {
          console.error('Failed to clean up WooCommerce product:', deleteError)
        }
      }

      throw new Error(`Database error: ${dbError.message}`)
    }
  } catch (error) {
    console.error('Error in product creation:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      details: error.details || {}
    })

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create product',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: error.status || 500 }
    )
  }
}
