import React, { useState, useEffect } from 'react';
import { monitoring } from '@/lib/monitoring';

interface LogEntry {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  severity: string;
}

export function LogsTab() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const errorLogs = monitoring.getErrors();
        const performanceLogs = monitoring.getMetrics();
        
        // Calculate average response time from performance metrics
        const apiMetrics = performanceLogs.filter(metric => metric.name === 'api_request_duration');
        const avgResponseTime = apiMetrics.length > 0 
          ? apiMetrics.reduce((sum, metric) => sum + metric.value, 0) / apiMetrics.length 
          : 0;
        
        const combinedLogs = [
          ...errorLogs.map((error, index) => ({
            id: `error-${index}`,
            type: 'error',
            message: error.message,
            timestamp: new Date(error.timestamp).toISOString(),
            severity: 'high'
          })),
          {
            id: 'performance-summary',
            type: 'performance',
            message: `Average API response time: ${avgResponseTime.toFixed(2)}ms`,
            timestamp: new Date().toISOString(),
            severity: 'info'
          }
        ];
        
        setLogs(combinedLogs);
      } catch (error) {
        console.error('Error fetching logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading logs...</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">System Logs</h2>
      
      <div className="space-y-4">
        {logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No logs available
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeverityColor(log.severity)}`}>
                      {log.type}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-900">{log.message}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
