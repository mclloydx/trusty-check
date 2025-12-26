import { Loader2, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InspectionRequest } from '@/types/dashboard';

const serviceTierLabels: Record<string, string> = {
  inspection: "Inspection Only",
  "inspection-payment": "Inspection + Payment",
  "full-service": "Full Service",
};

interface AvailableRequestsTabProps {
  requests: InspectionRequest[];
  loadingRequests: boolean;
  onAssignSelf: (requestId: string) => void;
}

export function AvailableRequestsTab({ 
  requests, 
  loadingRequests, 
  onAssignSelf 
}: AvailableRequestsTabProps) {
  const availableRequests = requests.filter(r => !r.assigned_agent_id);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          {loadingRequests ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : availableRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No available requests</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-4">
              {availableRequests.map(request => (
                <div key={request.id} className="bg-card border rounded-lg p-3 sm:p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold truncate flex-1 mr-2 text-sm sm:text-base">{request.customer_name}</h3>
                    <Badge variant="outline" className="text-xs px-1 sm:px-2 py-1 flex-shrink-0">Available</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm mb-3">
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
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <div className="text-xs text-muted-foreground truncate flex-1">
                      {request.whatsapp}
                    </div>
                    <Button 
                      size="sm" 
                      className="flex-shrink-0 h-8 sm:h-10 px-3"
                      onClick={() => onAssignSelf(request.id)}
                    >
                      Assign to Me
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
