import { Loader2, Package, Filter, Grid3x3, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { InspectionRequest } from '@/types/dashboard';

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "outline" },
  assigned: { label: "Assigned", variant: "secondary" },
  in_progress: { label: "In Progress", variant: "default" },
  completed: { label: "Completed", variant: "default" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

const serviceTierLabels: Record<string, string> = {
  inspection: "Inspection Only",
  "inspection-payment": "Inspection + Payment",
  "full-service": "Full Service",
};

type RequestFilter = 'all' | 'pending' | 'active' | 'completed' | 'cancelled';
type ViewMode = 'table' | 'cards';

interface UserRequestsTabProps {
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

export function UserRequestsTab({ 
  requests, 
  filteredRequests,
  loadingRequests,
  requestFilter,
  viewMode,
  searchQuery,
  onFilterChange,
  onViewModeChange,
  onRequestClick,
  onSearchChange
}: UserRequestsTabProps) {
  const renderTableView = (requestsToRender: InspectionRequest[]) => (
    <div className="hidden sm:block overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[100px]">Store</TableHead>
            <TableHead className="min-w-[60px]">Service</TableHead>
            <TableHead className="min-w-[60px]">Amount</TableHead>
            <TableHead className="min-w-[80px]">Status</TableHead>
            <TableHead className="min-w-[60px]">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requestsToRender.map((request) => {
            const status = statusConfig[request.status] || statusConfig.pending;
            
            return (
              <TableRow 
                key={request.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onRequestClick(request)}
              >
                <TableCell className="font-medium p-2 sm:p-3">
                  <div className="truncate text-sm">{request.store_name}</div>
                  <div className="text-xs text-muted-foreground truncate">{request.customer_name}</div>
                </TableCell>
                <TableCell className="p-2 sm:p-3">
                  <div className="text-xs sm:text-sm truncate max-w-[50px] sm:max-w-none">
                    {serviceTierLabels[request.service_tier] || request.service_tier}
                  </div>
                </TableCell>
                <TableCell className="p-2 sm:p-3">
                  <div className="text-sm truncate">MWK {request.service_fee ? request.service_fee.toLocaleString() : '0'}</div>
                </TableCell>
                <TableCell className="p-2 sm:p-3">
                  <Badge variant={status.variant} className="text-xs px-1 sm:px-2 py-1">
                    {status.label || request.status}
                  </Badge>
                </TableCell>
                <TableCell className="p-2 sm:p-3">
                  <div className="text-sm">{new Date(request.created_at).toLocaleDateString()}</div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  const renderCardsView = (requestsToRender: InspectionRequest[]) => (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {requestsToRender.map((request) => {
        const status = statusConfig[request.status] || statusConfig.pending;
        
        return (
          <Card
            key={request.id}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onRequestClick(request)}
          >
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h3 className="font-semibold truncate flex-1 mr-2 text-sm sm:text-base">{request.store_name}</h3>
                <Badge variant={status.variant} className="text-xs px-1 sm:px-2 py-1 flex-shrink-0">
                  {status.label || request.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm mb-3">
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
                <div>
                  <span className="text-muted-foreground">Customer:</span>
                  <div className="truncate">{request.customer_name}</div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mb-3">
                <span className="font-medium">Details:</span> {request.product_details}
              </div>
              <div className="flex justify-between items-center gap-2">
                <div className="text-xs text-muted-foreground truncate flex-1">
                  Contact: {request.whatsapp}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-shrink-0 h-8 sm:h-10 px-3"
                  onClick={() => onRequestClick(request)}
                >
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
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
                  {requestFilter === 'pending' && 'Pending'}
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
                Pending
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
      </div>

      <Card>
        <CardContent className="pt-6">
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
            renderTableView(filteredRequests)
          ) : (
            renderCardsView(filteredRequests)
          )}
        </CardContent>
      </Card>
    </div>
  );
}
