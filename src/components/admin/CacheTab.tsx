import React, { useState, useEffect } from 'react';
import { cacheService } from '@/lib/cache';

interface CacheStats {
  hitRate: number;
  totalKeys: number;
  memoryUsage: string;
  evictions: number;
  ttl?: string;
  maxSize?: string;
  strategy?: string;
  size?: number;
  expiredCount?: number;
  totalSize?: number;
  tagCount?: number;
}

export function CacheTab() {
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCacheStats = async () => {
      try {
        const stats = cacheService.getStats();
        // Map the actual cache service response to our interface
        const mappedStats: CacheStats = {
          hitRate: stats.hitRate || 0,
          totalKeys: stats.size || 0,
          memoryUsage: `${stats.totalSize || 0} bytes`,
          evictions: stats.expiredCount || 0,
          size: stats.size,
          expiredCount: stats.expiredCount,
          totalSize: stats.totalSize,
          tagCount: stats.tagCount,
        };
        setCacheStats(mappedStats);
      } catch (error) {
        console.error('Error fetching cache stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCacheStats();
  }, []);

  const handleClearCache = async () => {
    try {
      const stats = cacheService.getStats();
      const mappedStats: CacheStats = {
        hitRate: stats.hitRate || 0,
        totalKeys: stats.size || 0,
        memoryUsage: `${stats.totalSize || 0} bytes`,
        evictions: stats.expiredCount || 0,
        size: stats.size,
        expiredCount: stats.expiredCount,
        totalSize: stats.totalSize,
        tagCount: stats.tagCount,
      };
      setCacheStats(mappedStats);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading cache statistics...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Cache Management</h2>
        <button
          onClick={handleClearCache}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear Cache
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Hit Rate</h3>
          <div className="text-2xl font-bold text-green-600">
            {cacheStats?.hitRate || 0}%
          </div>
          <p className="text-sm text-gray-600">Cache Hit Rate</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Total Keys</h3>
          <div className="text-2xl font-bold text-blue-600">
            {cacheStats?.totalKeys || 0}
          </div>
          <p className="text-sm text-gray-600">Cached Items</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Memory Usage</h3>
          <div className="text-2xl font-bold text-purple-600">
            {cacheStats?.memoryUsage || 'N/A'}
          </div>
          <p className="text-sm text-gray-600">Memory Used</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Evictions</h3>
          <div className="text-2xl font-bold text-orange-600">
            {cacheStats?.evictions || 0}
          </div>
          <p className="text-sm text-gray-600">Items Evicted</p>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-4">Cache Configuration</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">TTL:</span>
            <span className="font-medium">{cacheStats?.ttl || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Max Size:</span>
            <span className="font-medium">{cacheStats?.maxSize || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Strategy:</span>
            <span className="font-medium">{cacheStats?.strategy || 'LRU'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
