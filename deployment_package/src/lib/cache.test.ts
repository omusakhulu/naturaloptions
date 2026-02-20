import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import cache, { cacheWrapper, CacheTTL } from '@/lib/cache'

beforeEach(() => {
  cache.clear()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

// ---------------------------------------------------------------------------
// cache.get / cache.set basics
// ---------------------------------------------------------------------------
describe('cache.get', () => {
  it('returns null for a missing key', () => {
    expect(cache.get('nonexistent')).toBeNull()
  })
})

describe('cache.set and cache.get', () => {
  it('stores and retrieves data', () => {
    cache.set('key1', { hello: 'world' }, 60000)
    expect(cache.get('key1')).toEqual({ hello: 'world' })
  })

  it('stores primitive values', () => {
    cache.set('num', 42, 60000)
    expect(cache.get('num')).toBe(42)
  })

  it('stores string values', () => {
    cache.set('str', 'test-value', 60000)
    expect(cache.get('str')).toBe('test-value')
  })
})

// ---------------------------------------------------------------------------
// TTL expiration
// ---------------------------------------------------------------------------
describe('TTL expiration', () => {
  it('returns data before TTL expires', () => {
    cache.set('ttl-key', 'fresh', 5000)

    vi.advanceTimersByTime(4999)
    expect(cache.get('ttl-key')).toBe('fresh')
  })

  it('returns null after TTL expires', () => {
    cache.set('ttl-key', 'stale', 5000)

    vi.advanceTimersByTime(5001)
    expect(cache.get('ttl-key')).toBeNull()
  })

  it('returns null exactly at TTL boundary (> check)', () => {
    cache.set('boundary', 'data', 1000)

    // The implementation checks: now - timestamp > ttl
    // At exactly 1000ms: 1000 > 1000 is false, so still valid
    vi.advanceTimersByTime(1000)
    expect(cache.get('boundary')).toBe('data')

    // At 1001ms: 1001 > 1000 is true, so expired
    vi.advanceTimersByTime(1)
    expect(cache.get('boundary')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// cache.clear
// ---------------------------------------------------------------------------
describe('cache.clear', () => {
  it('removes a specific key', () => {
    cache.set('a', 1, 60000)
    cache.set('b', 2, 60000)

    cache.clear('a')

    expect(cache.get('a')).toBeNull()
    expect(cache.get('b')).toBe(2)
  })

  it('removes all keys when called without arguments', () => {
    cache.set('x', 10, 60000)
    cache.set('y', 20, 60000)
    cache.set('z', 30, 60000)

    cache.clear()

    expect(cache.get('x')).toBeNull()
    expect(cache.get('y')).toBeNull()
    expect(cache.get('z')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// cache.getStats
// ---------------------------------------------------------------------------
describe('cache.getStats', () => {
  it('returns size and maxSize', () => {
    const stats = cache.getStats()

    expect(stats).toHaveProperty('size')
    expect(stats).toHaveProperty('maxSize')
    expect(typeof stats.size).toBe('number')
    expect(typeof stats.maxSize).toBe('number')
  })

  it('reports correct size after adding items', () => {
    cache.set('s1', 'v1', 60000)
    cache.set('s2', 'v2', 60000)

    expect(cache.getStats().size).toBe(2)
  })

  it('reports 0 after clear', () => {
    cache.set('s1', 'v1', 60000)
    cache.clear()

    expect(cache.getStats().size).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Max size eviction
// ---------------------------------------------------------------------------
describe('max size eviction', () => {
  it('evicts the oldest entry when cache exceeds maxSize', () => {
    // The default singleton has maxSize=1000.
    // We work with the singleton so we fill it to capacity and check eviction.
    const maxSize = cache.getStats().maxSize

    // Fill cache to capacity
    for (let i = 0; i < maxSize; i++) {
      cache.set(`fill-${i}`, i, 60000)
    }

    expect(cache.getStats().size).toBe(maxSize)

    // The first key inserted was 'fill-0'
    expect(cache.get('fill-0')).toBe(0)

    // Adding one more should evict the oldest (fill-0)
    cache.set('overflow', 'new', 60000)

    expect(cache.getStats().size).toBe(maxSize)

    // fill-0 was the first key, so it should be evicted
    expect(cache.get('fill-0')).toBeNull()
    expect(cache.get('overflow')).toBe('new')
  })
})

// ---------------------------------------------------------------------------
// cacheWrapper
// ---------------------------------------------------------------------------
describe('cacheWrapper', () => {
  it('returns cached data on second call without calling fetchFn again', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ data: 'fetched' })

    const first = await cacheWrapper('wrapper-key', fetchFn, 60000)
    const second = await cacheWrapper('wrapper-key', fetchFn, 60000)

    expect(first).toEqual({ data: 'fetched' })
    expect(second).toEqual({ data: 'fetched' })
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  it('calls fetchFn only once for the same key', async () => {
    const fetchFn = vi.fn().mockResolvedValue('result')

    await cacheWrapper('once-key', fetchFn, 60000)
    await cacheWrapper('once-key', fetchFn, 60000)
    await cacheWrapper('once-key', fetchFn, 60000)

    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  it('calls fetchFn again after TTL expires', async () => {
    const fetchFn = vi.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second')

    const first = await cacheWrapper('expire-key', fetchFn, 5000)

    expect(first).toBe('first')

    vi.advanceTimersByTime(5001)

    const second = await cacheWrapper('expire-key', fetchFn, 5000)

    expect(second).toBe('second')
    expect(fetchFn).toHaveBeenCalledTimes(2)
  })

  it('stores result from fetchFn in cache', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ id: 1 })

    await cacheWrapper('store-key', fetchFn, 60000)

    // Verify it is in the raw cache
    expect(cache.get('store-key')).toEqual({ id: 1 })
  })
})

// ---------------------------------------------------------------------------
// CacheTTL constants
// ---------------------------------------------------------------------------
describe('CacheTTL', () => {
  it('SHORT is 30 seconds (30000ms)', () => {
    expect(CacheTTL.SHORT).toBe(30000)
  })

  it('MEDIUM is 5 minutes (300000ms)', () => {
    expect(CacheTTL.MEDIUM).toBe(300000)
  })

  it('LONG is 30 minutes (1800000ms)', () => {
    expect(CacheTTL.LONG).toBe(1800000)
  })

  it('HOUR is 1 hour (3600000ms)', () => {
    expect(CacheTTL.HOUR).toBe(3600000)
  })

  it('DAY is 24 hours (86400000ms)', () => {
    expect(CacheTTL.DAY).toBe(86400000)
  })
})
