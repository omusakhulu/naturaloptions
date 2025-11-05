class Cache {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Set a value in the cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
   */
  set(key, value, ttl = 5 * 60 * 1000) {
    this.cache.set(key, {
      data: value,
      expiresAt: Date.now() + ttl
    });
  }

  /**
   * Get a value from the cache
   * @param {string} key - Cache key
   * @returns {any|null} Cached value or null if not found or expired
   */
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      
      return null;
    }
    
    return item.data;
  }

  /**
   * Delete a value from the cache
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all expired cache entries
   */
  cleanup() {
    const now = Date.now();
    
    for (const [key, { expiresAt }] of this.cache.entries()) {
      if (now > expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Create a singleton instance
export const cache = new Cache();

// Clean up expired cache entries every 5 minutes
setInterval(() => cache.cleanup(), 5 * 60 * 1000);

export default cache;
