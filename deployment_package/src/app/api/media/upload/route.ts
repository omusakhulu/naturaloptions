import https from 'node:https'
import dns from 'node:dns'
import { URL } from 'node:url'

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const WP_BASE_URL = process.env.WP_BASE_URL || process.env.WORDPRESS_BASE_URL
const WP_USERNAME = process.env.WP_USERNAME
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD

export async function POST(req: NextRequest) {
  try {
    if (!WP_BASE_URL || !WP_USERNAME || !WP_APP_PASSWORD) {
      return NextResponse.json({ error: 'WordPress credentials not configured' }, { status: 500 })
    }

    const contentType = req.headers.get('content-type') || ''

    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Content-Type must be multipart/form-data' }, { status: 400 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Missing file field in form data' }, { status: 400 })
    }

    const filename = (formData.get('filename') as string) || file.name || 'upload.bin'

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Some WP app passwords include spaces; keep exactly as provided
    const auth = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64')

    const wpUrl = new URL(`${WP_BASE_URL.replace(/\/$/, '')}/wp-json/wp/v2/media`)

    // Build multipart body manually
    const boundary = '----omnishop-' + Math.random().toString(16).slice(2)

    const preamble = Buffer.from(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
        `Content-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`
    )

    const closing = Buffer.from(`\r\n--${boundary}--\r\n`)
    const body = Buffer.concat([preamble, buffer, closing])

    // IPv4 lookup and keep-alive agent
    const agent = new https.Agent({ keepAlive: true, maxSockets: 10, timeout: 25000 })

    const resolvedAddress: string = await new Promise((resolve, reject) => {
      dns.lookup(wpUrl.hostname, { family: 4 }, (err, address) => {
        if (err || !address) return reject(err || new Error('DNS lookup failed'))
        resolve(address)
      })
    })

    const options: https.RequestOptions = {
      host: resolvedAddress,
      servername: wpUrl.hostname, // SNI for TLS
      port: wpUrl.port ? Number(wpUrl.port) : 443,
      method: 'POST',
      path: wpUrl.pathname + wpUrl.search,
      agent,
      headers: {
        Host: wpUrl.hostname,
        Authorization: `Basic ${auth}`,
        Accept: 'application/json',
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(body).toString()
      }
    }

    const data = await new Promise<any>((resolve, reject) => {
      const req = https.request(options, res => {
        const chunks: Buffer[] = []

        res.on('data', d => chunks.push(Buffer.isBuffer(d) ? d : Buffer.from(d)))
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8')
          const status = res.statusCode || 0
          let parsed: any = {}

          try {
            parsed = text ? JSON.parse(text) : {}
          } catch {
            parsed = { message: text }
          }

          if (status >= 200 && status < 300) {
            resolve(parsed)
          } else {
            console.error('[Media Upload] WP error', { status, details: parsed })
            reject(Object.assign(new Error('Upload failed'), { status, details: parsed }))
          }
        })
      })

      req.setTimeout(25000, () => {
        req.destroy(new Error('request timeout'))
      })
      req.on('error', err => reject(err))
      req.write(body)
      req.end()
    })

    return NextResponse.json(
      {
        success: true,
        media: {
          id: data.id,
          url: data.source_url || data.guid?.rendered,
          filename: data.media_details?.file || filename,
          alt_text: data.alt_text || ''
        }
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error in media upload API:', error)

    return NextResponse.json({ error: 'server_error', message: error?.message || String(error) }, { status: 500 })
  }
}
