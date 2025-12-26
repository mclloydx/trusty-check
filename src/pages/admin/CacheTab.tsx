// src/pages/admin/CacheTab.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  HardDrive, 
  Zap, 
  RotateCcw, 
  Trash2, 
  Eye, 
  Plus, 
  TrendingUp, 
  TrendingDown,
  Database
} from "lucide-react";

interface CacheEntry {
  key: string;
  value: string;
  size: string;
  ttl: string;
  hits: number;
  lastAccessed: string;
}

interface CacheStats {
  totalKeys: number;
  memoryUsage: string;
  hitRate: number;
  totalHits: number;
  totalMisses: number;
  evictionCount: number;
}

export function CacheTab() {
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [cacheEntries, setCacheEntries] = useState<CacheEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<CacheEntry | null>(null);

  // Mock data - in a real app, this would come from your cache system
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setCacheStats({
        totalKeys: 124,
        memoryUsage: '24.5 MB',
        hitRate: 92.4,
        totalHits: 12450,
        totalMisses: 1020,
        evictionCount: 5
      });

      setCacheEntries([
        {
          key: 'user:123',
          value: '{"id": "123", "name": "John Doe", "role": "user"}',
          size: '2.1 KB',
          ttl: '30m',
          hits: 42,
          lastAccessed: '2025-12-26 10:30:15'
        },
        {
          key: 'inspection:req_456',
          value: '{"id": "req_456", "status": "pending", "userId": "789"}',
          size: '1.8 KB',
          ttl: '1h',
          hits: 28,
          lastAccessed: '2025-12-26 10:29:45'
        },
        {
          key: 'config:app',
          value: '{"version": "1.2.3", "features": ["feature1", "feature2"]}',
          size: '856 B',
          ttl: '24h',
          hits: 156,
          lastAccessed: '2025-12-26 10:28:30'
        },
        {
          key: 'stats:dashboard',
          value: '{"users": 1245, "requests": 234, "revenue": 12450}',
          size: '1.2 KB',
          ttl: '5m',
          hits: 89,
          lastAccessed: '2025-12-26 10:27:20'
        },
        {
          key: 'cache:metrics',
          value: '{"hitRate": 92.4, "totalKeys": 124}',
          size: '342 B',
          ttl: '10m',
          hits: 75,
          lastAccessed: '2025-12-26 10:26:10'
        }
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const refreshCacheData = () => {
    setLoading(true);
    setTimeout(() => {
      // Simulate updated cache data
      setLoading(false);
    }, 300);
  };

  const clearCache = () => {
    console.log('Clearing entire cache...');
    // In a real app, this would clear the cache
  };

  const clearKey = (key: string) => {
    console.log(`Clearing cache key: ${key}`);
    // In a real app, this would remove the specific key from cache
    setCacheEntries(cacheEntries.filter(entry => entry.key !== key));
  };

  const viewEntry = (entry: CacheEntry) => {
    setSelectedEntry(entry);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Cache Management</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={refreshCacheData}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="destructive" onClick={clearCache}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Cache Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Keys</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cacheStats?.totalKeys || 0}</div>
            <p className="text-xs text-muted-foreground">Items in cache</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cacheStats?.memoryUsage || '0 MB'}</div>
            <p className="text-xs text-muted-foreground">Of total capacity</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hit Rate</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cacheStats?.hitRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Cache efficiency</p>
          </CardContent>
        </Card>
      </div>

      {/* Cache Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading cache data...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>TTL</TableHead>
                  <TableHead>Hits</TableHead>
                  <TableHead>Last Accessed</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cacheEntries.map((entry, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-sm">{entry.key}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{entry.size}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{entry.ttl}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {entry.hits > 50 ? (
                          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-yellow-500 mr-1" />
                        )}
                        {entry.hits}
                      </div>
                    </TableCell>
                    <TableCell>{entry.lastAccessed}</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => viewEntry(entry)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          onClick={() => clearKey(entry.key)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Entry Dialog */}
      {selectedEntry && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Cache Entry: {selectedEntry.key}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedEntry(null)}
              >
                Close
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Value:</h4>
                <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                  {selectedEntry.value}
                </pre>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">Size:</h4>
                  <p>{selectedEntry.size}</p>
                </div>
                <div>
                  <h4 className="font-medium">TTL:</h4>
                  <p>{selectedEntry.ttl}</p>
                </div>
                <div>
                  <h4 className="font-medium">Hits:</h4>
                  <p>{selectedEntry.hits}</p>
                </div>
                <div>
                  <h4 className="font-medium">Last Accessed:</h4>
                  <p>{selectedEntry.lastAccessed}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}