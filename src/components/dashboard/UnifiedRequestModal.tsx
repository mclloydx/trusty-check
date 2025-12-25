import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  FileText, 
  Mail as MailIcon, 
  RefreshCw, 
  Package, 
  User, 
  Home, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Phone, 
  Users, 
  UserPlus, 
  Bell, 
  Shield, 
  MapPin,
  UserCog,
  Trash2
} from 'lucide-react';
import { InspectionRequest, Agent, UserRole } from '@/types/dashboard';
import { useToast } from '@/hooks/use-toast';
import { downloadReceipt, emailReceipt, requestReceiptReissue } from '@/services/receiptService';

interface UnifiedRequestModalProps {
  selectedRequest: InspectionRequest | null;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  userRole: UserRole;
  currentUserId?: string;
  currentUserEmail?: string;
  agents: Agent[];
  onStatusUpdate: (requestId: string, status: string) => void;
  onAgentAssignment: (requestId: string, agentId: string | null) => void;
  onSelfAssignment: (requestId: string) => void;
  onPaymentProcessing: (requestId: string, amount: string, method: string) => void;
  onFeeUpdate: (requestId: string, feeAmount: string, additionalFees: string, feeNotes: string) => void;
  onPaymentReceived: (requestId: string) => void;
  onRequestComplete: (requestId: string) => void;
  onRequestCancel: (requestId: string) => void;
}

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

export function UnifiedRequestModal({
  selectedRequest,
  isModalOpen,
  setIsModalOpen,
  userRole,
  currentUserId,
  currentUserEmail,
  agents,
  onStatusUpdate,
  onAgentAssignment,
  onSelfAssignment,
  onPaymentProcessing,
  onFeeUpdate,
  onPaymentReceived,
  onRequestComplete,
  onRequestCancel
}: UnifiedRequestModalProps) {
  const { toast } = useToast();
  
  // Form states
  const [newStatus, setNewStatus] = useState<string>('');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [feeAmount, setFeeAmount] = useState<string>('');
  const [additionalFees, setAdditionalFees] = useState<string>('');
  const [feeNotes, setFeeNotes] = useState<string>('');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  
  // UI states
  const [activeTab, setActiveTab] = useState<'details' | 'actions' | 'payment'>('details');
  const [isEditingFees, setIsEditingFees] = useState(false);

  // Initialize form when modal opens
  useEffect(() => {
    if (selectedRequest && isModalOpen) {
      setNewStatus(selectedRequest.status || '');
      setSelectedAgentId(selectedRequest.assigned_agent_id || '');
      setFeeAmount(selectedRequest.service_fee?.toString() || '');
      setAdditionalFees('0');
      setFeeNotes(selectedRequest.fee_notes || '');
      setPaidAmount('');
      setPaymentMethod('cash');
      setIsEditingFees(false);
      setActiveTab('details');
    }
  }, [selectedRequest, isModalOpen]);

  // Role-based permissions
  const permissions = {
    canViewAllRequests: userRole === 'admin' || userRole === 'agent',
    canAssignAgents: userRole === 'admin',
    canUpdateStatus: userRole === 'admin' || userRole === 'agent',
    canProcessPayments: userRole === 'admin',
    canManageFees: userRole === 'admin',
    canAssignSelf: userRole === 'agent' && !selectedRequest?.assigned_agent_id,
    canViewCustomerDetails: true,
    canDownloadReceipts: selectedRequest?.status === 'completed' && selectedRequest?.receipt_number
  };

  const isAssignedToCurrentUser = selectedRequest?.assigned_agent_id === currentUserId;

  // Action handlers
  const handleStatusUpdate = () => {
    if (!newStatus || !selectedRequest) return;
    onStatusUpdate(selectedRequest.id, newStatus);
  };

  const handleAgentAssignment = () => {
    if (!selectedRequest) return;
    onAgentAssignment(selectedRequest.id, selectedAgentId || null);
  };

  const handleSelfAssignment = () => {
    if (!selectedRequest) return;
    onSelfAssignment(selectedRequest.id);
  };

  const handlePaymentProcessing = () => {
    if (!selectedRequest || !paidAmount) return;
    onPaymentProcessing(selectedRequest.id, paidAmount, paymentMethod);
  };

  const handleFeeSubmit = () => {
    if (!selectedRequest || !feeAmount) return;
    onFeeUpdate(selectedRequest.id, feeAmount, additionalFees, feeNotes);
    setIsEditingFees(false);
  };

  const handlePaymentReceived = () => {
    if (!selectedRequest) return;
    onPaymentReceived(selectedRequest.id);
  };

  const handleRequestComplete = () => {
    if (!selectedRequest) return;
    onRequestComplete(selectedRequest.id);
  };

  const handleRequestCancel = () => {
    if (!selectedRequest) return;
    onRequestCancel(selectedRequest.id);
  };

  // Receipt handlers
  const handleDownloadReceipt = async (format: 'pdf' | 'json' = 'pdf') => {
    try {
      if (!selectedRequest?.receipt_number) {
        toast({ title: "Error", description: "No receipt available", variant: "destructive" });
        return;
      }
      const result = await downloadReceipt(selectedRequest, format);
      if (result.success) {
        toast({ title: "Success", description: `Receipt downloaded. Code: ${result.verificationCode}` });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to download receipt", variant: "destructive" });
    }
  };

  const handleEmailReceipt = async () => {
    try {
      if (!selectedRequest?.receipt_number) return;
      const email = userRole === 'user' ? currentUserEmail : 'customer@example.com';
      const result = await emailReceipt(selectedRequest, email || '');
      toast({ title: "Info", description: result.message });
    } catch (error) {
      toast({ title: "Error", description: "Failed to email receipt", variant: "destructive" });
    }
  };

  const handleReissueReceipt = async () => {
    try {
      if (!selectedRequest?.id) return;
      const result = await requestReceiptReissue(selectedRequest.id);
      if (result.success) {
        toast({ title: "Success", description: `Receipt reissued. Code: ${result.newVerificationCode}` });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to reissue receipt", variant: "destructive" });
    }
  };

  const calculateTotalAmount = () => {
    const baseFee = parseFloat(feeAmount) || 0;
    const extraFees = parseFloat(additionalFees) || 0;
    return (baseFee + extraFees).toFixed(2);
  };

  if (!selectedRequest) return null;

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {userRole === 'admin' && <Shield className="w-5 h-5" />}
            {userRole === 'agent' && <Users className="w-5 h-5" />}
            {userRole === 'user' && <Package className="w-5 h-5" />}
            Request Management - {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
          </DialogTitle>
          <DialogDescription>
            {userRole === 'admin' && "Full control over request details and actions"}
            {userRole === 'agent' && "Manage assigned requests and collaborate with team"}
            {userRole === 'user' && "View your request details and download receipts"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Role-based Quick Actions */}
          <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
            <Button
              size="sm"
              variant={activeTab === 'details' ? "default" : "outline"}
              onClick={() => setActiveTab('details')}
            >
              <FileText className="w-4 h-4 mr-2" />
              Details
            </Button>
            
            {(permissions.canUpdateStatus || permissions.canAssignAgents) && (
              <Button
                size="sm"
                variant={activeTab === 'actions' ? "default" : "outline"}
                onClick={() => setActiveTab('actions')}
              >
                <Bell className="w-4 h-4 mr-2" />
                Actions
              </Button>
            )}
            
            {(permissions.canProcessPayments || permissions.canManageFees) && (
              <Button
                size="sm"
                variant={activeTab === 'payment' ? "default" : "outline"}
                onClick={() => setActiveTab('payment')}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Payment
              </Button>
            )}
            
            {permissions.canAssignSelf && (
              <Button size="sm" onClick={handleSelfAssignment} className="bg-green-600 hover:bg-green-700">
                <UserPlus className="w-4 h-4 mr-2" />
                Assign to Me
              </Button>
            )}
          </div>

          {/* Details Tab - Universal for all roles */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span>{selectedRequest.customer_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone:</span>
                      <span>{selectedRequest.whatsapp}</span>
                    </div>
                    {selectedRequest.customer_address && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Address:</span>
                        <span>{selectedRequest.customer_address}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span>{currentUserEmail || 'Not available'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Request ID:</span>
                      <span className="font-mono">{selectedRequest.tracking_id || selectedRequest.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span>{new Date(selectedRequest.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Service Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Store:</span>
                      <span>{selectedRequest.store_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location:</span>
                      <span>{selectedRequest.store_location}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service:</span>
                      <span>{serviceTierLabels[selectedRequest.service_tier] || selectedRequest.service_tier}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={statusConfig[selectedRequest.status]?.variant || "outline"}>
                        {statusConfig[selectedRequest.status]?.label || selectedRequest.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Product Details
                </h3>
                <p className="text-sm bg-muted/30 p-3 rounded whitespace-pre-wrap">
                  {selectedRequest.product_details}
                </p>
              </div>
            </div>
          )}

          {/* Actions Tab - Admin & Agent */}
          {activeTab === 'actions' && (permissions.canUpdateStatus || permissions.canAssignAgents) && (
            <div className="space-y-4">
              {permissions.canUpdateStatus && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Status Management
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Update Status</Label>
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="assigned">Assigned</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={handleStatusUpdate} size="sm" className="w-full">
                        Update Status
                      </Button>
                    </div>
                    
                    {permissions.canAssignAgents && (
                      <div className="space-y-2">
                        <Label>Assign Agent</Label>
                        <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select agent" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Unassigned</SelectItem>
                            {agents.map((agent) => (
                              <SelectItem key={agent.id} value={agent.id}>
                                {agent.full_name || agent.email || 'Unknown Agent'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button onClick={handleAgentAssignment} size="sm" className="w-full">
                          Assign Agent
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {userRole === 'agent' && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Agent Actions
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handlePaymentReceived}
                      disabled={!isAssignedToCurrentUser}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Payment
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRequestComplete}
                      disabled={!isAssignedToCurrentUser}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Complete
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleRequestCancel}
                      disabled={!isAssignedToCurrentUser}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Payment Tab - Admin */}
          {activeTab === 'payment' && permissions.canManageFees && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <UserCog className="w-4 h-4" />
                  Fee Management
                </h3>
                
                {isEditingFees ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Base Fee (MWK)</Label>
                        <Input
                          type="number"
                          value={feeAmount}
                          onChange={(e) => setFeeAmount(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Additional Fees (MWK)</Label>
                        <Input
                          type="number"
                          value={additionalFees}
                          onChange={(e) => setAdditionalFees(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Total Amount</Label>
                        <div className="p-2 bg-muted rounded font-semibold">
                          MWK {calculateTotalAmount()}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Fee Notes</Label>
                      <Input
                        value={feeNotes}
                        onChange={(e) => setFeeNotes(e.target.value)}
                        placeholder="Add notes about fee changes..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleFeeSubmit} size="sm">Save Fees</Button>
                      <Button variant="outline" onClick={() => setIsEditingFees(false)} size="sm">Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Current Fee:</span>
                      <span className="font-semibold">MWK {selectedRequest.service_fee?.toLocaleString() || '0'}</span>
                    </div>
                    {selectedRequest.fee_notes && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Notes:</span>
                        <span className="text-sm">{selectedRequest.fee_notes}</span>
                      </div>
                    )}
                    <Button variant="outline" onClick={() => setIsEditingFees(true)} size="sm">
                      <UserCog className="w-4 h-4 mr-2" />
                      Edit Fees
                    </Button>
                  </div>
                )}
              </div>

              {permissions.canProcessPayments && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Payment Processing
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Amount Received (MWK)</Label>
                      <Input
                        type="number"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Method</Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="mobile">Mobile Money</SelectItem>
                          <SelectItem value="bank">Bank Transfer</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handlePaymentProcessing} size="sm" className="w-full">
                        Mark Payment Received
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Receipt Actions - Available for completed requests */}
          {permissions.canViewCustomerDetails && selectedRequest.receipt_number && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Receipt Actions
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Button size="sm" variant="outline" onClick={() => handleDownloadReceipt('pdf')}>
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDownloadReceipt('json')}>
                  <Download className="w-4 h-4 mr-2" />
                  JSON
                </Button>
                <Button size="sm" variant="outline" onClick={handleEmailReceipt}>
                  <MailIcon className="w-4 h-4 mr-2" />
                  Email
                </Button>
                <Button size="sm" variant="outline" onClick={handleReissueReceipt}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reissue
                </Button>
              </div>
              {selectedRequest.receipt_verification_code && (
                <div className="mt-3 p-2 bg-muted rounded text-sm">
                  <span className="text-muted-foreground">Verification Code: </span>
                  <span className="font-mono font-semibold">{selectedRequest.receipt_verification_code}</span>
                </div>
              )}
            </div>
          )}

          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Status
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Current:</span>
                  <Badge variant={statusConfig[selectedRequest.status]?.variant || "outline"} className="text-xs">
                    {statusConfig[selectedRequest.status]?.label || selectedRequest.status}
                  </Badge>
                </div>
                {selectedRequest.assigned_agent_id && (
                  <div className="flex justify-between">
                    <span>Assigned:</span>
                    <span>{isAssignedToCurrentUser ? 'You' : 'Other Agent'}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Payment
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span>{selectedRequest.payment_received ? 'Received' : 'Pending'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Method:</span>
                  <span>{selectedRequest.payment_method || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span>MWK {selectedRequest.service_fee?.toLocaleString() || '0'}</span>
                </div>
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Receipt
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Number:</span>
                  <span className="font-mono">{selectedRequest.receipt_number || 'Not issued'}</span>
                </div>
                {selectedRequest.receipt_verification_code && (
                  <div className="flex justify-between">
                    <span>Verification:</span>
                    <span className="font-mono text-xs">{selectedRequest.receipt_verification_code}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
