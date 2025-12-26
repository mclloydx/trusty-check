// src/pages/admin/LogsTab.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Search, 
  Download, 
  Filter,
  Eye,
  RotateCcw,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle
} from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source: string;
  context?: any;
}

export function LogsTab() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [logLevel, setLogLevel] = useState('all');
  const [loading, setLoading] = useState(true);

  // Mock data - in a real app, this would come from your logging system
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setLogs([
        {
          id: '1',
          timestamp: '2025-12-26 10:30:15',
          level: 'info',
          message: 'User login successful',
          source: 'auth',
          context: { userId: '123', ip: '192.168.1.1' }
        },
        {
          id: '2',
          timestamp: '2025-12-26 10:29:45',
          level: 'warn',
          message: 'High memory usage detected',
          source: 'system',
          context: { usage: '85%', threshold: '80%' }
        },
        {
          id: '3',
          timestamp: '2025-12-26 10:28:30',
          level: 'error',
          message: 'Database connection failed',
          source: 'database',
          context: { error: 'Connection timeout' }
        },
        {
          id: '4',
          timestamp: '2025-12-26 10:27:20',
          level: 'info',
          message: 'API request completed',
          source: 'api',
          context: { method: 'GET', path: '/api/users', duration: '120ms' }
        },
        {
          id: '5',
          timestamp: '2025-12-26 10:26:10',
          level: 'debug',
          message: 'Cache hit',
          source: 'cache',
          context: { key: 'user:123', hit: true }
        },
        {
          id: '6',
          timestamp: '2025-12-26 10:25:05',
          level: 'error',
          message: 'Payment processing failed',
          source: 'payment',
          context: { transactionId: 'tx_123', error: 'Insufficient funds' }
        },
        {
          id: '7',
          timestamp: '2025-12-26 10:24:50',
          level: 'info',
          message: 'New inspection request created',
          source: 'inspection',
          context: { requestId: 'req_123', userId: '456' }
        },
        {
          id: '8',
          timestamp: '2025-12-26 10:23:40',
          level: 'warn',
          message: 'Slow query detected',
          source: 'database',
          context: { query: 'SELECT * FROM users', duration: '2.5s' }
        }
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (log.context && JSON.stringify(log.context).toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesLevel = logLevel === 'all' || log.level === logLevel;
    
    return matchesSearch && matchesLevel;
  });

  const getLogLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warn': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      case 'debug': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLogLevelVariant = (level: string) => {
    switch (level) {
      case 'error': return 'destructive';
      case 'warn': return 'secondary';
      case 'info': return 'default';
      case 'debug': return 'outline';
      default: return 'default';
    }
  };

  const refreshLogs = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 300);
  };

  const downloadLogs = () => {
    // In a real app, this would download the logs as a file
    console.log('Downloading logs...');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">System Logs</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={refreshLogs}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={downloadLogs}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Log Filters</CardTitle>
          <div className="flex space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <select
                value={logLevel}
                onChange={(e) => setLogLevel(e.target.value)}
                className="pl-8 pr-8 border rounded-md h-10 w-32 bg-background"
              >
                <option value="all">All Levels</option>
                <option value="error">Error</option>
                <option value="warn">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Log Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading logs...</div>
          ) : (
            <div className="h-[600px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Context</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">{log.timestamp}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getLogLevelIcon(log.level)}
                          <Badge variant={getLogLevelVariant(log.level)}>
                            {log.level.toUpperCase()}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{log.message}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.source}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {log.context ? JSON.stringify(log.context) : '-'}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}