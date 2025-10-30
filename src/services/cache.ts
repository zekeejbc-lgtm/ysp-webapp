/**
 * Frontend Caching Service
 * Provides fast, browser-side caching with automatic expiration
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

/**
 * Cache expiration times (in milliseconds)
 */
export const CACHE_DURATION = {
  USER_PROFILES: 10 * 60 * 1000,    // 10 minutes
  EVENTS: 5 * 60 * 1000,            // 5 minutes
  HOMEPAGE: 30 * 60 * 1000,         // 30 minutes
  ANNOUNCEMENTS: 3 * 60 * 1000,     // 3 minutes
  FEEDBACK: 2 * 60 * 1000,          // 2 minutes
  ATTENDANCE: 5 * 60 * 1000,        // 5 minutes
  SHORT: 1 * 60 * 1000,             // 1 minute
  LONG: 60 * 60 * 1000,             // 1 hour
};

/**
 * Get cached data or fetch fresh data
 * @param key - Unique cache key
 * @param fetchFn - Function to fetch fresh data if cache is stale
 * @param duration - Cache duration in milliseconds
 */
export async function getCached<T>(
  key: string,
  fetchFn: () => Promise<T>,
  duration: number = CACHE_DURATION.SHORT
): Promise<T> {
  try {
    // Check if data exists in cache
    const cached = localStorage.getItem(`cache_${key}`);
    
    if (cached) {
      const entry: CacheEntry<T> = JSON.parse(cached);
      const now = Date.now();
      
      // Check if cache is still valid
      if (now - entry.timestamp < entry.expiresIn) {
        console.log(`[Cache HIT] ${key}`);
        return entry.data;
      } else {
        console.log(`[Cache EXPIRED] ${key}`);
      }
    } else {
      console.log(`[Cache MISS] ${key}`);
    }
    
    // Cache miss or expired - fetch fresh data
    const freshData = await fetchFn();
    
    // Store in cache
    const entry: CacheEntry<T> = {
      data: freshData,
      timestamp: Date.now(),
      expiresIn: duration,
    };
    
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
    } catch (e) {
      // localStorage might be full - clear old cache entries
      console.warn('[Cache] Storage full, clearing old entries');
      clearExpiredCache();
      try {
        localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
      } catch (e2) {
        console.error('[Cache] Failed to store data:', e2);
      }
    }
    
    return freshData;
  } catch (error) {
    console.error(`[Cache ERROR] ${key}:`, error);
    // If caching fails, still try to fetch
    return await fetchFn();
  }
}

/**
 * Invalidate a specific cache entry
 */
export function invalidateCache(key: string): void {
  localStorage.removeItem(`cache_${key}`);
  console.log(`[Cache INVALIDATED] ${key}`);
}

/**
 * Invalidate multiple cache entries matching a pattern
 */
export function invalidateCachePattern(pattern: string): void {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('cache_') && key.includes(pattern)) {
      localStorage.removeItem(key);
      console.log(`[Cache INVALIDATED] ${key}`);
    }
  });
}

/**
 * Clear all expired cache entries
 */
export function clearExpiredCache(): void {
  const keys = Object.keys(localStorage);
  const now = Date.now();
  let cleared = 0;
  
  keys.forEach(key => {
    if (key.startsWith('cache_')) {
      try {
        const entry = JSON.parse(localStorage.getItem(key) || '');
        if (now - entry.timestamp >= entry.expiresIn) {
          localStorage.removeItem(key);
          cleared++;
        }
      } catch (e) {
        // Invalid cache entry, remove it
        localStorage.removeItem(key);
        cleared++;
      }
    }
  });
  
  if (cleared > 0) {
    console.log(`[Cache] Cleared ${cleared} expired entries`);
  }
}

/**
 * Clear all cache entries
 */
export function clearAllCache(): void {
  const keys = Object.keys(localStorage);
  let cleared = 0;
  
  keys.forEach(key => {
    if (key.startsWith('cache_')) {
      localStorage.removeItem(key);
      cleared++;
    }
  });
  
  console.log(`[Cache] Cleared ${cleared} total entries`);
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { totalEntries: number; totalSize: number; entries: any[] } {
  const keys = Object.keys(localStorage);
  const cacheKeys = keys.filter(k => k.startsWith('cache_'));
  let totalSize = 0;
  const entries: any[] = [];
  
  cacheKeys.forEach(key => {
    const value = localStorage.getItem(key) || '';
    const size = new Blob([value]).size;
    totalSize += size;
    
    try {
      const entry = JSON.parse(value);
      const age = Date.now() - entry.timestamp;
      const remaining = entry.expiresIn - age;
      
      entries.push({
        key: key.replace('cache_', ''),
        size: `${(size / 1024).toFixed(2)} KB`,
        age: `${(age / 1000).toFixed(0)}s`,
        remaining: remaining > 0 ? `${(remaining / 1000).toFixed(0)}s` : 'expired',
      });
    } catch (e) {
      entries.push({
        key: key.replace('cache_', ''),
        size: `${(size / 1024).toFixed(2)} KB`,
        age: 'invalid',
        remaining: 'invalid',
      });
    }
  });
  
  return {
    totalEntries: cacheKeys.length,
    totalSize: Math.round(totalSize / 1024), // KB
    entries,
  };
}

// Clear expired cache on load
clearExpiredCache();
