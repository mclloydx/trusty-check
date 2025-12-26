// src/pages/admin/OverviewTab.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Users, AlertCircle, Database } from "lucide-react";

interface OverviewTabProps {
  metrics: any;
  onRefresh?: () => void;
}

export function OverviewTab({ metrics, onRefresh }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">System Overview</h2>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">+0% from last hour</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors (24h)</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.errors?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">System errors</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.cacheStats?.hitRate || 0}%
            </div>
            <p className="text-xs text-muted-foreground">Cache efficiency</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <span className="h-4 w-4 text-muted-foreground">⏱️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.performance?.avgResponseTime || 0}ms
            </div>
            <p className="text-xs text-muted-foreground">API response time</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 overflow-y-auto">
              {metrics?.errors && metrics.errors.length > 0 ? (
                <ul className="space-y-2">
                  {metrics.errors.slice(0, 10).map((error: any, index: number) => (
                    <li key={index} className="text-sm p-2 bg-red-50 rounded">
                      <div className="font-medium">{error.message}</div>
                      <div className="text-xs text-gray-500">{error.timestamp}</div>
                      <div className="text-xs">{error.context}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No recent errors</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 overflow-y-auto">
              {metrics?.performance && Object.keys(metrics.performance).length > 0 ? (
                <ul className="space-y-2">
                  {Object.entries(metrics.performance).map(([key, value]: [string, any], index: number) => (
                    <li key={index} className="text-sm p-2 bg-blue-50 rounded">
                      <div className="font-medium">{key}</div>
                      <div className="text-xs">{JSON.stringify(value)}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No performance metrics available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}