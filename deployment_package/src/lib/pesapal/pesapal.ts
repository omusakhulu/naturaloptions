export type PesapalEnvConfig = {
  baseUrl: string
  consumerKey: string
  consumerSecret: string
  callbackUrl: string
  ipnUrl?: string
  ipnId?: string
  branch?: string
}

type TokenCache = { token: string; expiresAtMs: number }

let tokenCache: TokenCache | null = null
let ipnIdCache: string | null = null

function nowMs() {
  return Date.now()
}

function requireEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing environment variable: ${name}`)
  return value
}

export function getPesapalConfigFromEnv(): PesapalEnvConfig {
  const baseUrl = requireEnv('PESAPAL_BASE_URL').replace(/\/+$/, '')

  return {
    baseUrl,
    consumerKey: requireEnv('PESAPAL_CONSUMER_KEY'),
    consumerSecret: requireEnv('PESAPAL_CONSUMER_SECRET'),
    callbackUrl: requireEnv('PESAPAL_CALLBACK_URL'),
    ipnUrl: process.env.PESAPAL_IPN_URL,
    ipnId: process.env.PESAPAL_IPN_ID,
    branch: process.env.PESAPAL_BRANCH
  }
}

async function fetchJson(url: string, init: RequestInit) {
  const res = await fetch(url, init)
  const text = await res.text()

  let json: any = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { raw: text }
  }

  if (!res.ok) {
    const msg = (json && (json.message || json.error?.message)) || text || `HTTP ${res.status}`
    throw new Error(`Pesapal request failed (${res.status}): ${msg}`)
  }

  if (json?.error?.message) {
    throw new Error(`Pesapal error: ${json.error.message}`)
  }

  return json
}

export async function getAccessToken(cfg: PesapalEnvConfig): Promise<string> {
  if (tokenCache && tokenCache.expiresAtMs > nowMs() + 30_000) {
    return tokenCache.token
  }

  const url = `${cfg.baseUrl}/api/Auth/RequestToken`
  const json = await fetchJson(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      consumer_key: cfg.consumerKey,
      consumer_secret: cfg.consumerSecret
    })
  })

  const token = String(json?.token || '')
  if (!token) throw new Error('Pesapal token missing in response')

  const expiresAtMs = nowMs() + 4.5 * 60_000
  tokenCache = { token, expiresAtMs }

  return token
}

export async function registerIpnIfNeeded(cfg: PesapalEnvConfig): Promise<string> {
  const configured = cfg.ipnId || ipnIdCache
  if (configured) return configured

  if (!cfg.ipnUrl) {
    throw new Error('Missing PESAPAL_IPN_ID or PESAPAL_IPN_URL (required to register IPN)')
  }

  const token = await getAccessToken(cfg)
  const url = `${cfg.baseUrl}/api/URLSetup/RegisterIPN`
  const json = await fetchJson(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      url: cfg.ipnUrl,
      ipn_notification_type: 'POST'
    })
  })

  const ipnId = String(json?.ipn_id || '')
  if (!ipnId) throw new Error('Pesapal IPN id missing in response')

  ipnIdCache = ipnId
  return ipnId
}

export type PesapalBillingAddress = {
  email_address?: string
  phone_number?: string
  country_code?: string
  first_name?: string
  middle_name?: string
  last_name?: string
  line_1?: string
  line_2?: string
  city?: string
  state?: string
  postal_code?: string
  zip_code?: string
}

export type SubmitOrderRequest = {
  id: string
  currency: string
  amount: number
  description: string
  callback_url: string
  notification_id: string
  branch?: string
  billing_address?: PesapalBillingAddress
}

export async function submitOrder(cfg: PesapalEnvConfig, order: Omit<SubmitOrderRequest, 'notification_id' | 'callback_url'> & { billing_address?: PesapalBillingAddress }) {
  const token = await getAccessToken(cfg)
  const notificationId = await registerIpnIfNeeded(cfg)

  const url = `${cfg.baseUrl}/api/Transactions/SubmitOrderRequest`
  const json = await fetchJson(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      ...order,
      callback_url: cfg.callbackUrl,
      notification_id: notificationId,
      branch: order.branch || cfg.branch || 'POS'
    })
  })

  return {
    order_tracking_id: String(json?.order_tracking_id || ''),
    merchant_reference: String(json?.merchant_reference || ''),
    redirect_url: String(json?.redirect_url || ''),
    status: String(json?.status || '')
  }
}

export async function getTransactionStatus(cfg: PesapalEnvConfig, orderTrackingId: string) {
  const token = await getAccessToken(cfg)
  const url = `${cfg.baseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(orderTrackingId)}`

  const json = await fetchJson(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  })

  return json
}
