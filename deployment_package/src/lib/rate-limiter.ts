type RateLimitEntry = {
  count: number
  resetTime: number
}

const limiters = new Map<string, Map<string, RateLimitEntry>>()

interface RateLimitConfig {
  windowMs?: number
  maxRequests?: number
}

export function rateLimit(
  key: string,
  identifier: string,
  config: RateLimitConfig = {}
): { limited: boolean; remaining: number; resetIn: number } {
  const { windowMs = 60_000, maxRequests = 10 } = config
  const now = Date.now()

  if (!limiters.has(key)) {
    limiters.set(key, new Map())
  }

  const store = limiters.get(key)!
  const entry = store.get(identifier)

  if (!entry || now > entry.resetTime) {
    store.set(identifier, { count: 1, resetTime: now + windowMs })

    return { limited: false, remaining: maxRequests - 1, resetIn: windowMs }
  }

  entry.count++

  if (entry.count > maxRequests) {
    return { limited: true, remaining: 0, resetIn: entry.resetTime - now }
  }

  return { limited: false, remaining: maxRequests - entry.count, resetIn: entry.resetTime - now }
}

// Cleanup old entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()

    for (const [, store] of limiters) {
      for (const [id, entry] of store) {
        if (now > entry.resetTime) {
          store.delete(id)
        }
      }
    }
  }, 5 * 60_000).unref?.()
}
