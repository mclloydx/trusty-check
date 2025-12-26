import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface RequestStatusOverviewProps {
  completedRequests: number;
  cancelledRequests: number;
  totalRequests: number;
}

interface LegendEntry {
  value: unknown;
  id?: string;
  type?: string;
  color?: string;
  payload?: {
    strokeDasharray?: string | number;
    value?: number;
  };
  dataKey?: string | number | ((obj: any) => any);
}

export function RequestStatusOverview({ 
  completedRequests, 
  cancelledRequests, 
  totalRequests 
}: RequestStatusOverviewProps) {
  const completedPercentage = totalRequests > 0 ? (completedRequests / totalRequests) * 100 : 100;
  const cancelledPercentage = totalRequests > 0 ? (cancelledRequests / totalRequests) * 100 : 0;

  const data = [
    { name: 'Completed', value: completedRequests, color: '#10b981' },
    { name: 'Cancelled', value: cancelledRequests, color: '#ef4444' }
  ];

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent
  }: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent === 0) return null;

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-sm font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Request Status Overview</CardTitle>
        <CardDescription>
          Distribution of completed and cancelled requests
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80 flex items-center justify-center">
          {totalRequests === 0 ? (
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium mb-2">No requests yet</p>
              <p className="text-sm">Request status will appear here once requests are made</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  innerRadius={40}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${value} requests`, 'Count']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value: string, entry: LegendEntry) => (
                    <span style={{ color: entry.color || '#000' }}>
                      {value} ({entry.payload?.value || 0})
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{completedRequests}</div>
            <div className="text-sm text-muted-foreground">Completed ({completedPercentage.toFixed(1)}%)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{cancelledRequests}</div>
            <div className="text-sm text-muted-foreground">Cancelled ({cancelledPercentage.toFixed(1)}%)</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
