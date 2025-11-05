type CacheEntry = {
  data: any
  expiresAt: number
}

const cacheStore = new Map<string, CacheEntry>()

/**
 * Simple in-memory cache implementation
 */
const cache = {
  /**
   * Get a value from the cache
   */
  get<T = any>(key: string): T | null {
    const entry = cacheStore.get(key)
    if (!entry) return null
    
    // Check if cache entry has expired
    if (Date.now() > entry.expiresAt) {
      cacheStore.delete(key)
      return null
    }
    
    return entry.data as T
  },
  
  /**
   * Set a value in the cache
   */
  set(key: string, data: any, ttl: number = 5 * 60 * 1000): void {
    const entry: CacheEntry = {
      data,
      expiresAt: Date.now() + ttl
    }
    cacheStore.set(key, entry)
  },
  
  /**
   * Delete a value from the cache
   */
  delete(key: string): void {
    cacheStore.delete(key)
  },
  
  /**
   * Clear the entire cache
   */
  clear(): void {
    cacheStore.clear()
  }
}

export default cache
