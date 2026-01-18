import { NextRequest } from 'next/server'
import { parse } from 'csv-parse/sync'
import { wooClient } from '@/lib/woocommerce'
import { saveProduct } from '@/lib/db/products'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return new Response('File missing', { status: 400 })

    const text = await file.text()
    const records: any[] = parse(text, { columns: true, skip_empty_lines: true })

    // Import Node.js modules for HTTPS requests
    const https = require('node:https');
    const dns = require('node:dns');
    const { URL } = require('node:url');

    async function createWooProductNode(body: any) {
      const storeUrl = process.env.WOO_STORE_URL || process.env.NEXT_PUBLIC_WOOCOMMERCE_STORE_URL || process.env.WORDPRESS_BASE_URL;
      const key = process.env.WOOCOMMERCE_CONSUMER_KEY || process.env.NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_KEY;
      const secret = process.env.WOOCOMMERCE_CONSUMER_SECRET || process.env.NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_SECRET;
      if (!storeUrl || !key || !secret) throw new Error('WooCommerce credentials not configured');
      const endpoint = new URL(`${storeUrl.replace(/\/$/, '')}/wp-json/wc/v3/products`);
      const auth = Buffer.from(`${key}:${secret}`).toString('base64');
      const reqBody = Buffer.from(JSON.stringify(body));
      const agent = new https.Agent({ keepAlive: true, maxSockets: 10, timeout: 25000 });
      const address = await new Promise((resolve, reject) => {
        dns.lookup(endpoint.hostname, { family: 4 }, (err, addr) =>
          err || !addr ? reject(err || new Error('DNS failed')) : resolve(addr)
        );
      });
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
          'Content-Length': Buffer.byteLength(reqBody).toString(),
          'User-Agent': 'Natural Options Admin/1.0',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache'
        }
      };
      return await new Promise((resolve, reject) => {
        const req = https.request(options, res => {
          const chunks: Buffer[] = [];
          res.on('data', d => chunks.push(Buffer.isBuffer(d) ? d : Buffer.from(d)));
          res.on('end', () => {
            const text = Buffer.concat(chunks).toString('utf8');
            const status = res.statusCode || 0;
            let parsed: any = {};
            try {
              parsed = text ? JSON.parse(text) : {};
            } catch {
              parsed = { message: text };
            }
            if (status >= 200 && status < 300) return resolve(parsed);
            reject(Object.assign(new Error('WooCommerce create failed'), { status, details: parsed }));
          });
        });
        req.setTimeout(25000, () => req.destroy(new Error('request timeout')));
        req.on('error', err => reject(err));
        req.write(reqBody);
        req.end();
      });
    }

    // Process each record: Create in WooCommerce first, then save locally with wooId
    const results: string[] = [];
    
    for (const rec of records) {
      const name = rec.product_name?.trim();
      if (!name) {
        results.push('❌ Skipped row without product_name');
        continue;
      }

      // Prepare WooCommerce product data
      const wooBody: any = {
        name,
        regular_price: rec.selling_price || '0',
        sku: rec.sku || undefined,
        type: rec.product_type === 'variable' ? 'variable' : 'simple',
        manage_stock: rec.manage_stock?.toLowerCase() === 'yes',
        stock_quantity: rec.opening_stock ? Number(rec.opening_stock) : undefined,
        status: 'publish'
      };

      // Add optional fields
      if (rec.image_url) {
        wooBody.images = [{ src: rec.image_url }];
      }
      if (rec.category) {
        // Note: You may need to map category names to IDs
        wooBody.categories = [{ name: rec.category }];
      }

      try {
        // Step 1: Create in WooCommerce first
        await new Promise(res => setTimeout(res, 1000)); // Rate limiting
        const wooProduct: any = await createWooProductNode(wooBody);
        
        if (!wooProduct || !wooProduct.id) {
          throw new Error('WooCommerce did not return product ID');
        }

        results.push(`✅ Created in WooCommerce: ${name} (ID: ${wooProduct.id})`);

        // Step 2: Save to local database with wooId
        try {
          const toSlug = (s = '') =>
            s.toString().trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
          
          const localProduct = await saveProduct({
            id: wooProduct.id,
            wooId: wooProduct.id,
            name: wooProduct.name,
            slug: wooProduct.slug || toSlug(wooProduct.name),
            description: wooProduct.description || null,
            short_description: wooProduct.short_description || null,
            price: wooProduct.price || wooProduct.regular_price,
            regular_price: wooProduct.regular_price,
            sale_price: wooProduct.sale_price || null,
            stock_status: wooProduct.stock_status || 'instock',
            stock_quantity: wooProduct.stock_quantity || 0,
            sku: wooProduct.sku || null,
            images: wooProduct.images || [],
            categories: wooProduct.categories || [],
            status: wooProduct.status || 'publish'
          });

          results.push(`✅ Saved to local DB: ${name}`);
        } catch (dbErr: any) {
          console.error('Local DB save error:', dbErr);
          results.push(`⚠️ WooCommerce OK but local save failed for ${name}: ${dbErr.message}`);
        }

      } catch (err: any) {
        console.error('Bulk import product error', {
          product: wooBody,
          error: {
            message: err.message,
            details: err.details,
            status: err.status,
            stack: err.stack
          }
        });
        results.push(`❌ Failed to import ${name}: ${err?.details?.message || err.message}`);
      }
    }

    return new Response(results.join('\n'), { status: 200 });
  } catch (err: any) {
    console.error('Bulk import error', err);
    return new Response('Error processing file', { status: 500 });
  }
}

