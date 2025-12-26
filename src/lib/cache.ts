// Advanced Caching Strategy for Performance Optimization
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { monitoring } from './monitoring';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  tags?: string[]; // For cache invalidation
}

interface CacheConfig {
  defaultTTL: number;
  maxSize: number;
  enableCompression: boolean;
}

class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map(); // Tag -> Set of cache keys
  public config: CacheConfig;
  private cleanupInterval: NodeJS.Timeout;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      maxSize: 1000,
      enableCompression: true,
      ...config
    };

    // Start periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Clean up every minute
  }

  set<T>(key: string, data: T, ttl?: number, tags?: string[]): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      tags
    };

    // Remove old entry if it exists
    const oldEntry = this.cache.get(key);
    if (oldEntry && oldEntry.tags) {
      this.removeFromTagIndex(key, oldEntry.tags);
    }

    // Add to cache
    this.cache.set(key, entry);

    // Update tag index
    if (tags) {
      this.addToTagIndex(key, tags);
    }

    // Enforce size limit
    this.enforceSizeLimit();
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key);
      return null;
    }

    return entry.data as T;
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      if (entry.tags) {
        this.removeFromTagIndex(key, entry.tags);
      }
      return this.cache.delete(key);
    }
    return false;
  }

  invalidateByTag(tag: string): number {
    const keys = this.tagIndex.get(tag);
    if (!keys) return 0;

    let deletedCount = 0;
    for (const key of keys) {
      if (this.cache.delete(key)) {
        deletedCount++;
      }
    }

    this.tagIndex.delete(tag);
    return deletedCount;
  }

  invalidateByPattern(pattern: RegExp): number {
    let deletedCount = 0;
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        if (this.delete(key)) {
          deletedCount++;
        }
      }
    }
    return deletedCount;
  }

  clear(): void {
    this.cache.clear();
    this.tagIndex.clear();
  }

  private addToTagIndex(key: string, tags: string[]): void {
    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    }
  }

  private removeFromTagIndex(key: string, tags: string[]): void {
    for (const tag of tags) {
      const keys = this.tagIndex.get(tag);
      if (keys) {
        keys.delete(key);
        if (keys.size === 0) {
          this.tagIndex.delete(tag);
        }
      }
    }
  }

  private enforceSizeLimit(): void {
    if (this.cache.size <= this.config.maxSize) return;

    // Sort entries by timestamp (oldest first)
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);

    // Remove oldest entries
    const toRemove = entries.slice(0, this.cache.size - this.config.maxSize);
    for (const [key] of toRemove) {
      this.delete(key);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        toDelete.push(key);
      }
    }

    for (const key of toDelete) {
      this.delete(key);
    }
  }

  // Statistics and monitoring
  getStats() {
    const now = Date.now();
    let expiredCount = 0;
    let totalSize = 0;

    for (const entry of this.cache.values()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredCount++;
      }
      totalSize += JSON.stringify(entry.data).length;
    }

    return {
      size: this.cache.size,
      expiredCount,
      hitRate: this.hitRate,
      totalSize,
      tagCount: this.tagIndex.size
    };
  }

  private hitRate = 0;
  private hits = 0;
  private requests = 0;

  recordHit(): void {
    this.hits++;
    this.requests++;
    this.hitRate = this.hits / this.requests;
  }

  recordMiss(): void {
    this.requests++;
    this.hitRate = this.hits / this.requests;
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// React Query integration for caching
export const cacheService = new CacheService({
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxSize: 500,
  enableCompression: true
});

// Cache keys and tags
export const CACHE_KEYS = {
  USER_PROFILE: (userId: string) => `user_profile:${userId}`,
  USER_PERMISSIONS: (userId: string) => `user_permissions:${userId}`,
  INSPECTION_REQUESTS: (orgId: string, filters?: string) => 
    `inspection_requests:${orgId}${filters ? ':' + filters : ''}`,
  ORGANIZATION_MEMBERS: (orgId: string) => `organization_members:${orgId}`,
  DASHBOARD_STATS: (orgId: string, period: string) => `dashboard_stats:${orgId}:${period}`,
  SYSTEM_CONFIG: 'system_config'
} as const;

export const CACHE_TAGS = {
  USER: 'user',
  ORGANIZATION: 'organization',
  INSPECTION_REQUESTS: 'inspection_requests',
  PERMISSIONS: 'permissions',
  DASHBOARD: 'dashboard',
  SYSTEM: 'system'
} as const;

// Enhanced caching hooks for React
export function useCachedQuery<T>(
  key: string | string[],
  queryFn: () => Promise<T>,
  options: {
    ttl?: number;
    tags?: string[];
    staleTime?: number;
    enabled?: boolean;
  } = {}
) {
  const queryClient = useQueryClient();
  const cacheKey = Array.isArray(key) ? key.join(':') : key;

  return useQuery({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: async () => {
      // Try cache first
      const cachedData = cacheService.get<T>(cacheKey);
      if (cachedData) {
        cacheService.recordHit();
        return cachedData;
      }

      cacheService.recordMiss();
      
      // Fetch data
      const data = await queryFn();
      
      // Cache the result
      cacheService.set(cacheKey, data, options.ttl, options.tags);
      
      return data;
    },
    staleTime: options.staleTime || options.ttl || cacheService.config.defaultTTL,
    enabled: options.enabled !== false,
    onSuccess: (data) => {
      // Update cache on successful fetch
      cacheService.set(cacheKey, data, options.ttl, options.tags);
    }
  });
}

// Cache invalidation utilities
export function invalidateCache(tags?: string[], pattern?: RegExp): void {
  if (tags) {
    for (const tag of tags) {
      cacheService.invalidateByTag(tag);
    }
  }
  
  if (pattern) {
    cacheService.invalidateByPattern(pattern);
  }
  
  // Note: React Query invalidation should be handled by the component
  // using this function, as we don't have access to queryClient here
}

// Predefined cache invalidation functions
export const cacheInvalidation = {
  userRelated: (userId: string) => invalidateCache([CACHE_TAGS.USER], new RegExp(`user_.*:${userId}`)),
  organizationRelated: (orgId: string) => invalidateCache([CACHE_TAGS.ORGANIZATION], new RegExp(`.*:${orgId}`)),
  inspectionRequests: () => invalidateCache([CACHE_TAGS.INSPECTION_REQUESTS]),
  permissions: () => invalidateCache([CACHE_TAGS.PERMISSIONS]),
  dashboard: (orgId: string) => invalidateCache([CACHE_TAGS.DASHBOARD], new RegExp(`dashboard_.*:${orgId}`))
};

// Performance monitoring for cache
export function trackCachePerformance() {
  const stats = cacheService.getStats();
  
  // Record metrics
  monitoring.recordMetric('cache_size', stats.size);
  monitoring.recordMetric('cache_hit_rate', stats.hitRate);
  monitoring.recordMetric('cache_memory_usage', stats.totalSize);
  
  return stats;
}

// React hook for cache statistics
export function useCacheStats() {
  const [stats, setStats] = useState(cacheService.getStats());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(cacheService.getStats());
    }, 10000); // Update every 10 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  return stats;
}

// Cache warming utility
export async function warmCache(userId: string, orgId: string) {
  try {
    // Warm user profile cache
    const profileCacheKey = CACHE_KEYS.USER_PROFILE(userId);
    if (!cacheService.get(profileCacheKey)) {
      // Fetch and cache user profile
      // This would be replaced with actual data fetching
    }
    
    // Warm permissions cache
    const permissionsCacheKey = CACHE_KEYS.USER_PERMISSIONS(userId);
    if (!cacheService.get(permissionsCacheKey)) {
      // Fetch and cache user permissions
    }
    
    // Warm dashboard stats
    const dashboardCacheKey = CACHE_KEYS.DASHBOARD_STATS(orgId, '7d');
    if (!cacheService.get(dashboardCacheKey)) {
      // Fetch and cache dashboard stats
    }
    
  } catch (error) {
    monitoring.captureError(error, { context: 'cache_warming' });
  }
}

// Export for use in other components
export { cacheService as default };
