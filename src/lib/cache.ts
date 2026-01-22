/**
 * Simple in-memory cache for API responses
 * Reduces database queries and improves response times
 */

interface CacheEntry {
  data: any
  timestamp: number
  ttl: number
}

class MemoryCache {
  private cache: Map<string, CacheEntry>
  private maxSize: number
  private checkInterval: NodeJS.Timeout | null

  constructor(maxSize = 1000) {
    this.cache = new Map()
    this.maxSize = maxSize
    this.checkInterval = null
    this.startCleanup()
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanup() {
    // Clean up expired entries every 5 minutes
    this.checkInterval = setInterval(() => {
      this.cleanExpired()
    }, 5 * 60 * 1000)
  }

  /**
   * Clean expired entries from cache
   */
  private cleanExpired() {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Get item from cache
   */
  get(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * Set item in cache with TTL (in milliseconds)
   */
  set(key: string, data: any, ttl: number = 60000) {
    // If cache is full, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  /**
   * Clear specific key or all cache
   */
  clear(key?: string) {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    }
  }

  /**
   * Cleanup on shutdown
   */
  shutdown() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    this.cache.clear()
  }
}

// Create singleton instance
const cache = new MemoryCache()

// Handle graceful shutdown
if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => cache.shutdown())
  process.on('SIGINT', () => cache.shutdown())
}

export default cache

// Helper functions for common cache patterns
export const cacheWrapper = async <T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = 60000
): Promise<T> => {
  // Check cache first
  const cached = cache.get(key)
  if (cached !== null) {
    return cached as T
  }

  // Fetch and cache
  const data = await fetchFn()
  cache.set(key, data, ttl)
  return data
}

// Cache TTL presets (in milliseconds)
export const CacheTTL = {
  SHORT: 30 * 1000,      // 30 seconds
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 30 * 60 * 1000,  // 30 minutes
  HOUR: 60 * 60 * 1000,  // 1 hour
  DAY: 24 * 60 * 60 * 1000 // 1 day
}
