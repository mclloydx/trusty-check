import { Loader2, Package, Users, ClipboardList, CheckCircle, Bell } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InspectionRequest, DashboardStats } from '@/types/dashboard';
import { RequestStatusOverview } from './RequestStatusOverview';

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
  pending: { label: "Pending", variant: "outline", icon: Loader2 },
  assigned: { label: "Assigned", variant: "secondary", icon: Bell },
  in_progress: { label: "In Progress", variant: "default", icon: Package },
  completed: { label: "Completed", variant: "default", icon: CheckCircle },
  cancelled: { label: "Cancelled", variant: "destructive", icon: Bell },
};

interface OverviewTabProps {
  stats: DashboardStats;
  requests: InspectionRequest[];
  loadingRequests: boolean;
  permissions: {
    canViewClients: boolean;
    canViewAllRequests: boolean;
  };
  onRequestClick: (request: InspectionRequest) => void;
}

export function OverviewTab({ 
  stats, 
  requests, 
  loadingRequests, 
  permissions, 
  onRequestClick 
}: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Total Requests</CardDescription>
            <CardTitle className="text-xl sm:text-2xl">{stats.totalRequests}</CardTitle>
          </CardHeader>
          <CardContent>
            <Package className="w-5 h-5 text-blue-500" />
          </CardContent>
        </Card>
        
        {permissions.canViewClients && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Total Clients</CardDescription>
              <CardTitle className="text-xl sm:text-2xl">{stats.totalClients}</CardTitle>
            </CardHeader>
            <CardContent>
              <Users className="w-5 h-5 text-green-500" />
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Active Tasks</CardDescription>
            <CardTitle className="text-xl sm:text-2xl">{stats.activeRequests}</CardTitle>
          </CardHeader>
          <CardContent>
            <ClipboardList className="w-5 h-5 text-orange-500" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Completed</CardDescription>
            <CardTitle className="text-xl sm:text-2xl">{stats.completedRequests}</CardTitle>
          </CardHeader>
          <CardContent>
            <CheckCircle className="w-5 h-5 text-purple-500" />
          </CardContent>
        </Card>
        
        {permissions.canViewAllRequests && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Unassigned</CardDescription>
              <CardTitle className="text-xl sm:text-2xl">{stats.unassignedRequests}</CardTitle>
            </CardHeader>
            <CardContent>
              <Bell className="w-5 h-5 text-red-500" />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Content Grid - Improved for large screens */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Request Status Overview */}
        <RequestStatusOverview
          completedRequests={stats.completedRequests}
          cancelledRequests={stats.cancelledRequests}
          totalRequests={stats.totalRequests}
        />

        {/* Recent Requests Preview */}
        {permissions.canViewAllRequests && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Recent Requests
              </CardTitle>
              <CardDescription>Latest inspection requests</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRequests ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : requests.slice(0, 5).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No requests found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.slice(0, 5).map((request) => {
                    const status = statusConfig[request.status] || statusConfig.pending;
                    const StatusIcon = status.icon;
                    
                    return (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => onRequestClick(request)}
                      >
                        <div className="flex items-center gap-3">
                          <StatusIcon className="w-4 h-4" />
                          <div>
                            <p className="font-medium">{request.customer_name}</p>
                            <p className="text-sm text-muted-foreground">{request.store_name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={status.variant} className="text-xs">
                            {status.label}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
