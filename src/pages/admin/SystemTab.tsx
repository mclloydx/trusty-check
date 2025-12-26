// src/pages/admin/SystemTab.tsx
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
  Cpu, 
  Activity, 
  Zap,
  Database,
  Server,
  Settings,
  RefreshCw,
  Play,
  Pause,
  RotateCcw
} from "lucide-react";

interface SystemMetric {
  name: string;
  value: string | number;
  status: 'good' | 'warning' | 'critical';
  description: string;
}

interface SystemTabProps {
  metrics?: any;
}

export function SystemTab({ metrics }: SystemTabProps = {}) {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([
    { name: 'Web Server', status: 'running', uptime: '99.9%', pid: 1234 },
    { name: 'Database', status: 'running', uptime: '99.8%', pid: 1235 },
    { name: 'Cache', status: 'running', uptime: '99.9%', pid: 1236 },
    { name: 'Monitoring', status: 'running', uptime: '99.7%', pid: 1237 },
    { name: 'Queue', status: 'running', uptime: '99.9%', pid: 1238 },
  ]);

  // Load system metrics
  useEffect(() => {
    if (metrics && metrics.performance) {
      // Use metrics from props if available
      const formattedMetrics: SystemMetric[] = Object.entries(metrics.performance).map(([key, value]) => ({
        name: key,
        value: typeof value === 'object' ? JSON.stringify(value) : String(value),
        status: 'good', // Default status, could be determined based on value
        description: key,
      }));
      setSystemMetrics(formattedMetrics);
      setLoading(false);
    } else {
      // Simulate loading system metrics
      setTimeout(() => {
        setSystemMetrics([
          { name: 'CPU Usage', value: '42%', status: 'good', description: 'Current CPU utilization' },
          { name: 'Memory Usage', value: '65%', status: 'good', description: 'Current memory utilization' },
          { name: 'Disk Usage', value: '78%', status: 'warning', description: 'Current disk space usage' },
          { name: 'Network I/O', value: '1.2GB/s', status: 'good', description: 'Current network throughput' },
          { name: 'Active Connections', value: 124, status: 'good', description: 'Current active connections' },
          { name: 'Load Average', value: '0.75', status: 'good', description: 'System load average (1 min)' },
          { name: 'Database Connections', value: 23, status: 'good', description: 'Current DB connections' },
          { name: 'Cache Hit Rate', value: '92%', status: 'good', description: 'Cache efficiency' },
        ]);
        setLoading(false);
      }, 500);
    }
  }, [metrics]);

  const refreshMetrics = () => {
    setLoading(true);
    setTimeout(() => {
      // Simulate updated metrics
      setSystemMetrics([
        { name: 'CPU Usage', value: Math.floor(Math.random() * 100) + '%', status: 'good', description: 'Current CPU utilization' },
        { name: 'Memory Usage', value: Math.floor(Math.random() * 100) + '%', status: 'good', description: 'Current memory utilization' },
        { name: 'Disk Usage', value: Math.floor(Math.random() * 100) + '%', status: 'warning', description: 'Current disk space usage' },
        { name: 'Network I/O', value: (Math.random() * 2).toFixed(1) + 'GB/s', status: 'good', description: 'Current network throughput' },
        { name: 'Active Connections', value: Math.floor(Math.random() * 200), status: 'good', description: 'Current active connections' },
        { name: 'Load Average', value: (Math.random() * 2).toFixed(2), status: 'good', description: 'System load average (1 min)' },
        { name: 'Database Connections', value: Math.floor(Math.random() * 50), status: 'good', description: 'Current DB connections' },
        { name: 'Cache Hit Rate', value: Math.floor(Math.random() * 100) + '%', status: 'good', description: 'Cache efficiency' },
      ]);
      setLoading(false);
    }, 300);
  };

  const controlService = (serviceName: string, action: string) => {
    console.log(`Controlling service ${serviceName} with action ${action}`);
    // In a real app, this would make an API call to control the service
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">System Status</h2>
        <Button onClick={refreshMetrics} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42%</div>
            <p className="text-xs text-muted-foreground">Current utilization</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">65%</div>
            <p className="text-xs text-muted-foreground">Used of total memory</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disk</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground">Used of total disk</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.9%</div>
            <p className="text-xs text-muted-foreground">System availability</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading metrics...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {systemMetrics.map((metric, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{metric.name}</TableCell>
                    <TableCell>{metric.value}</TableCell>
                    <TableCell>
                      <Badge variant={
                        metric.status === 'good' ? 'default' : 
                        metric.status === 'warning' ? 'secondary' : 'destructive'
                      }>
                        {metric.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{metric.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Services</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uptime</TableHead>
                <TableHead>PID</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      {service.name.includes('Database') && <Database className="h-4 w-4" />}
                      {service.name.includes('Cache') && <HardDrive className="h-4 w-4" />}
                      {service.name.includes('Web') && <Server className="h-4 w-4" />}
                      {service.name.includes('Monitoring') && <Activity className="h-4 w-4" />}
                      {service.name.includes('Queue') && <Zap className="h-4 w-4" />}
                      <span>{service.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={service.status === 'running' ? 'default' : 'destructive'}>
                      {service.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{service.uptime}</TableCell>
                  <TableCell>{service.pid}</TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => controlService(service.name, 'restart')}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => controlService(service.name, 'stop')}
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => controlService(service.name, 'start')}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}