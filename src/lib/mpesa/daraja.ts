export type DarajaConfig = {
  baseUrl: string
  consumerKey: string
  consumerSecret: string
  shortcode: string
  passkey: string
  callbackUrl: string
}

let cachedToken: { token: string; expiresAtMs: number } | null = null

function nowMs() {
  return Date.now()
}

function requireEnv(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing environment variable: ${name}`)
  return v
}

export function getDarajaConfigFromEnv(): DarajaConfig {
  return {
    baseUrl: process.env.MPESA_BASE_URL || 'https://sandbox.safaricom.co.ke',
    consumerKey: requireEnv('MPESA_CONSUMER_KEY'),
    consumerSecret: requireEnv('MPESA_CONSUMER_SECRET'),
    shortcode: requireEnv('MPESA_SHORTCODE'),
    passkey: requireEnv('MPESA_PASSKEY'),
    callbackUrl: requireEnv('MPESA_CALLBACK_URL')
  }
}

function formatTimestamp(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    String(date.getFullYear()) +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  )
}

async function fetchJson(url: string, init: RequestInit) {
  console.log(`[daraja] ${init.method} ${url}`)
  // Use node https module directly to avoid undici/fetch quirks with Safaricom
  const { default: https } = await import('https')
  const { default: http } = await import('http')
  const parsedUrl = new URL(url)
  const mod = parsedUrl.protocol === 'https:' ? https : http
  const headers: Record<string, string> = { 'User-Agent': 'safaricom-daraja/1.0' }
  if (init.headers) {
    const h = init.headers as Record<string, string>
    for (const [k, v] of Object.entries(h)) headers[k] = v
  }

  return new Promise<any>((resolve, reject) => {
    const req = mod.request(url, {
      method: init.method || 'GET',
      headers
    }, (res: any) => {
      let data = ''
      res.on('data', (chunk: any) => { data += chunk })
      res.on('end', () => {
        let json: any = null
        try { json = data ? JSON.parse(data) : null } catch { json = { raw: data } }
        if (res.statusCode >= 400) {
          console.error(`[daraja] ${res.statusCode} response:`, data)
          const msg = json?.errorMessage || json?.error_description || json?.raw || res.statusMessage
          reject(new Error(`Daraja request failed (${res.statusCode}): ${msg}`))
        } else {
          resolve(json)
        }
      })
    })
    req.on('error', reject)
    if (init.body) req.write(init.body)
    req.end()
  })
}

export async function getAccessToken(cfg: DarajaConfig): Promise<string> {
  if (cachedToken && cachedToken.expiresAtMs > nowMs() + 10_000) {
    console.log('[daraja] Using cached token')
    return cachedToken.token
  }

  console.log(`[daraja] Fetching new token. Key starts: ${cfg.consumerKey.slice(0, 6)}... baseUrl: ${cfg.baseUrl}`)
  const basic = Buffer.from(`${cfg.consumerKey}:${cfg.consumerSecret}`).toString('base64')
  const url = `${cfg.baseUrl}/oauth/v1/generate?grant_type=client_credentials`

  const json = await fetchJson(url, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${basic}`
    }
  })

  const token = String(json?.access_token || '')
  const expiresInSec = parseInt(String(json?.expires_in || '3599'), 10) || 3599

  if (!token) throw new Error('Daraja returned no access_token')

  cachedToken = {
    token,
    expiresAtMs: nowMs() + expiresInSec * 1000
  }

  return token
}

export type StkPushRequest = {
  phone: string
  amount: number
  accountReference: string
  transactionDesc: string
}

export async function stkPush(cfg: DarajaConfig, req: StkPushRequest) {
  const token = await getAccessToken(cfg)
  const timestamp = formatTimestamp()
  const password = Buffer.from(`${cfg.shortcode}${cfg.passkey}${timestamp}`).toString('base64')

  console.log(`[daraja] stkPush shortcode=${cfg.shortcode} timestamp=${timestamp} phone=${req.phone} amount=${req.amount}`)
  const url = `${cfg.baseUrl}/mpesa/stkpush/v1/processrequest`

  return fetchJson(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      BusinessShortCode: cfg.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(req.amount),
      PartyA: req.phone,
      PartyB: cfg.shortcode,
      PhoneNumber: req.phone,
      CallBackURL: cfg.callbackUrl,
      AccountReference: req.accountReference,
      TransactionDesc: req.transactionDesc
    })
  })
}

export async function stkQuery(cfg: DarajaConfig, checkoutRequestId: string) {
  const token = await getAccessToken(cfg)
  const timestamp = formatTimestamp()
  const password = Buffer.from(`${cfg.shortcode}${cfg.passkey}${timestamp}`).toString('base64')

  const url = `${cfg.baseUrl}/mpesa/stkpushquery/v1/query`

  return fetchJson(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      BusinessShortCode: cfg.shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    })
  })
}
