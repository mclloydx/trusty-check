import { Loader2, Package, Filter, Grid3x3, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { InspectionRequest } from '@/types/dashboard';

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
  pending: { label: "Pending", variant: "outline", icon: Loader2 },
  assigned: { label: "Assigned", variant: "secondary", icon: Package },
  in_progress: { label: "In Progress", variant: "default", icon: Package },
  completed: { label: "Completed", variant: "default", icon: Package },
  cancelled: { label: "Cancelled", variant: "destructive", icon: Package },
};

const serviceTierLabels: Record<string, string> = {
  inspection: "Inspection Only",
  "inspection-payment": "Inspection + Payment",
  "full-service": "Full Service",
};

type RequestFilter = 'all' | 'pending' | 'active' | 'completed' | 'cancelled';
type ViewMode = 'table' | 'cards';

interface RequestsTabProps {
  role: string | null;
  requests: InspectionRequest[];
  filteredRequests: InspectionRequest[];
  loadingRequests: boolean;
  requestFilter: RequestFilter;
  viewMode: ViewMode;
  searchQuery: string;
  onFilterChange: (filter: RequestFilter) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onRequestClick: (request: InspectionRequest) => void;
  onSearchChange: (query: string) => void;
}

export function RequestsTab({
  role,
  requests,
  filteredRequests,
  loadingRequests,
  requestFilter,
  viewMode,
  searchQuery,
  onFilterChange,
  onViewModeChange,
  onRequestClick,
  onSearchChange,
}: RequestsTabProps) {
  const renderTableView = () => (
    <div className="space-y-2">
      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[100px]">Customer</TableHead>
              <TableHead className="hidden md:table-cell min-w-[80px]">Store</TableHead>
              <TableHead className="min-w-[60px]">Service</TableHead>
              <TableHead className="hidden sm:table-cell min-w-[60px]">Amount</TableHead>
              <TableHead className="min-w-[80px]">Status</TableHead>
              {role !== 'user' && <TableHead className="hidden lg:table-cell min-w-[80px]">Assigned To</TableHead>}
              <TableHead className="hidden sm:table-cell min-w-[60px]">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.map((request) => {
              const status = statusConfig[request.status] || statusConfig.pending;
              const StatusIcon = status.icon;
              
              return (
                <TableRow 
                  key={request.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onRequestClick(request)}
                >
                  <TableCell className="font-medium p-2 sm:p-3">
                    <div className="max-w-[80px] sm:max-w-none">
                      <div className="truncate text-sm font-medium">{request.customer_name}</div>
                      <div className="text-xs text-muted-foreground hidden sm:block truncate">{request.whatsapp}</div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell p-2 sm:p-3">
                    <div className="truncate text-sm">{request.store_name}</div>
                  </TableCell>
                  <TableCell className="p-2 sm:p-3">
                    <div className="text-xs sm:text-sm truncate max-w-[50px] sm:max-w-none">
                      {serviceTierLabels[request.service_tier] || request.service_tier}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell p-2 sm:p-3">
                    <div className="text-sm truncate">MWK {request.service_fee ? request.service_fee.toLocaleString() : '0'}</div>
                  </TableCell>
                  <TableCell className="p-2 sm:p-3">
                    <Badge variant={status.variant} className="text-xs px-1 sm:px-2 py-1">
                      <StatusIcon className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">{status.label}</span>
                      <span className="sm:hidden">{status.label.charAt(0)}</span>
                    </Badge>
                  </TableCell>
                  {role !== 'user' && (
                    <TableCell className="hidden lg:table-cell p-2 sm:p-3">
                      {request.assigned_agent_id ? (
                        <Badge variant="secondary" className="text-xs">
                          Assigned
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Unassigned
                        </Badge>
                      )}
                    </TableCell>
                  )}
                  <TableCell className="text-sm hidden sm:table-cell p-2 sm:p-3">
                    {new Date(request.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-2">
        {filteredRequests.map((request) => {
          const status = statusConfig[request.status] || statusConfig.pending;
          const StatusIcon = status.icon;
          
          return (
            <div
              key={request.id}
              className="bg-card border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onRequestClick(request)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm truncate flex-1 mr-2">{request.customer_name}</h3>
                <Badge variant={status.variant} className="text-xs px-1 py-1 flex-shrink-0">
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {status.label.charAt(0)}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Store:</span>
                  <div className="truncate">{request.store_name}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Service:</span>
                  <div className="truncate">{serviceTierLabels[request.service_tier] || request.service_tier}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Amount:</span>
                  <div className="truncate">MWK {request.service_fee?.toLocaleString() || '0'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Date:</span>
                  <div className="truncate">{new Date(request.created_at).toLocaleDateString()}</div>
                </div>
                {role !== 'user' && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Status:</span>
                    <div className="truncate">
                      {request.assigned_agent_id ? (
                        <Badge variant="secondary" className="text-xs mr-1">Assigned</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs mr-1">Unassigned</Badge>
                      )}
                      {request.whatsapp}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderCardsView = () => (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {filteredRequests.map((request) => {
        const status = statusConfig[request.status] || statusConfig.pending;
        const StatusIcon = status.icon;
        
        return (
          <Card
            key={request.id}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onRequestClick(request)}
          >
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h3 className="font-semibold truncate flex-1 mr-2 text-sm sm:text-base">{request.customer_name}</h3>
                <Badge variant={status.variant} className="text-xs flex-shrink-0 px-1 sm:px-2 py-1">
                  <StatusIcon className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">{status.label}</span>
                  <span className="sm:hidden">{status.label.charAt(0)}</span>
                </Badge>
              </div>
              <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Store:</span>
                  <span className="truncate max-w-[100px] sm:max-w-[120px]">{request.store_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service:</span>
                  <span className="truncate max-w-[100px] sm:max-w-[120px]">{serviceTierLabels[request.service_tier] || request.service_tier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="truncate">MWK {request.service_fee?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="text-xs">{new Date(request.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  return (
    <Card>
      <CardContent className="pt-4 sm:pt-6">
        <div className="flex gap-2 mb-4 sm:mb-6">
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3 h-3 sm:w-4 sm:h-4" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-7 sm:pl-10 h-8 sm:h-10 text-sm"
              />
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewModeChange(viewMode === 'table' ? 'cards' : 'table')}
            className="flex items-center gap-2 flex-shrink-0 h-8 sm:h-10 px-2 sm:px-3"
          >
            {viewMode === 'table' ? <Grid3x3 className="w-3 h-3 sm:w-4 sm:h-4" /> : <Package className="w-3 h-3 sm:w-4 sm:h-4" />}
            <span className="hidden sm:inline text-xs sm:text-sm">
              {viewMode === 'table' ? 'Cards' : 'Table'}
            </span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2 flex-shrink-0 h-8 sm:h-10 px-2 sm:px-3">
                <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline text-xs sm:text-sm">
                  {requestFilter === 'all' && 'All'}
                  {requestFilter === 'pending' && 'Unassigned'}
                  {requestFilter === 'active' && 'Active'}
                  {requestFilter === 'completed' && 'Completed'}
                  {requestFilter === 'cancelled' && 'Cancelled'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-xs sm:text-sm">
              <DropdownMenuItem onClick={() => onFilterChange('all')}>
                All Requests
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onFilterChange('pending')}>
                Unassigned
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onFilterChange('active')}>
                Active
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onFilterChange('completed')}>
                Completed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onFilterChange('cancelled')}>
                Cancelled
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {loadingRequests ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No requests found</p>
          </div>
        ) : viewMode === 'table' ? (
          renderTableView()
        ) : (
          renderCardsView()
        )}
      </CardContent>
    </Card>
  );
}
