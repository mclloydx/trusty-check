import React from 'react';

interface SystemMetrics {
  performance: {
    responseTime: number;
  };
  errors: Array<{
    message: string;
    timestamp?: string;
  }>;
  cacheStats: {
    hitRate: number;
  };
}

interface OverviewTabProps {
  metrics: SystemMetrics | null;
  onRefresh: () => void;
}

export function OverviewTab({ metrics, onRefresh }: OverviewTabProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">System Overview</h2>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Performance</h3>
          <div className="text-2xl font-bold text-blue-600">
            {metrics?.performance?.responseTime || 'N/A'}ms
          </div>
          <p className="text-sm text-gray-600">Average Response Time</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Errors</h3>
          <div className="text-2xl font-bold text-red-600">
            {metrics?.errors?.length || 0}
          </div>
          <p className="text-sm text-gray-600">Total Errors</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Cache Hit Rate</h3>
          <div className="text-2xl font-bold text-green-600">
            {metrics?.cacheStats?.hitRate || 'N/A'}%
          </div>
          <p className="text-sm text-gray-600">Cache Performance</p>
        </div>
      </div>
    </div>
  );
}
