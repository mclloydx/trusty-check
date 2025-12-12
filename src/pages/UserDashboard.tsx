import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import {
  User,
  LogOut,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Save,
  Home,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Bell,
  Download
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface InspectionRequest {
  id: string;
  store_name: string;
  product_details: string;
  service_tier: string;
  service_fee: number;
  status: string;
  created_at: string;
  payment_received: boolean | null;
  payment_method: string | null;
  receipt_number: string | null;
  customer_name: string;
  whatsapp: string;
  customer_address: string | null;
  store_location: string;
  tracking_id: string | null;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
  pending: { label: "Pending", variant: "outline", icon: Clock },
  assigned: { label: "Assigned", variant: "secondary", icon: AlertCircle },
  in_progress: { label: "In Progress", variant: "default", icon: Package },
  completed: { label: "Completed", variant: "default", icon: CheckCircle },
  cancelled: { label: "Cancelled", variant: "destructive", icon: XCircle },
};

const serviceTierLabels: Record<string, string> = {
  inspection: "Inspection Only",
  "inspection-payment": "Inspection + Payment",
  "full-service": "Full Service",
};

export default function UserDashboard() {
  const { user, role, loading, signOut, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [requests, setRequests] = useState<InspectionRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
  });

  // Authentication is now handled by ProtectedRoute component
  // This effect can be removed as it's redundant

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        address: profile.address || '',
      });
    }
  }, [profile]);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('inspection_requests')
        .select('id, store_name, product_details, service_tier, service_fee, status, created_at, payment_received, payment_method, receipt_number, customer_name, whatsapp, customer_address, store_location, tracking_id')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully",
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const downloadReceipt = (request: InspectionRequest) => {
    const doc = new jsPDF();

    // Stazama branding
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('STAZAMA', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Professional Inspection Services', 105, 30, { align: 'center' });
    doc.text('Quality Assurance & Trust Verification', 105, 35, { align: 'center' });

    // Receipt header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT RECEIPT', 105, 50, { align: 'center' });

    // Receipt details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let yPos = 70;

    doc.text(`Receipt Number: ${request.receipt_number}`, 20, yPos);
    yPos += 10;
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, yPos);
    yPos += 10;
    doc.text(`Time: ${new Date().toLocaleTimeString()}`, 20, yPos);
    yPos += 20;

    // Customer details
    doc.setFont('helvetica', 'bold');
    doc.text('CUSTOMER DETAILS', 20, yPos);
    yPos += 10;
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${request.customer_name}`, 20, yPos);
    yPos += 8;
    doc.text(`Phone: ${request.whatsapp}`, 20, yPos);
    yPos += 8;
    if (request.customer_address) {
      doc.text(`Address: ${request.customer_address}`, 20, yPos);
      yPos += 8;
    }
    yPos += 10;

    // Service details
    doc.setFont('helvetica', 'bold');
    doc.text('SERVICE DETAILS', 20, yPos);
    yPos += 10;
    doc.setFont('helvetica', 'normal');
    doc.text(`Store: ${request.store_name}`, 20, yPos);
    yPos += 8;
    doc.text(`Location: ${request.store_location}`, 20, yPos);
    yPos += 8;
    doc.text(`Service: ${serviceTierLabels[request.service_tier] || request.service_tier}`, 20, yPos);
    yPos += 8;
    doc.text(`Product: ${request.product_details}`, 20, yPos, { maxWidth: 170 });
    yPos += 15;

    // Payment details
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT DETAILS', 20, yPos);
    yPos += 10;
    doc.setFont('helvetica', 'normal');
    doc.text(`Amount: MWK ${request.service_fee.toLocaleString()}`, 20, yPos);
    yPos += 8;
    doc.text(`Payment Method: ${request.payment_method || 'N/A'}`, 20, yPos);
    yPos += 8;
    doc.text(`Status: ${request.payment_received ? 'PAID' : 'PENDING'}`, 20, yPos);
    yPos += 15;

    // Agent details (not shown for users for privacy)

    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Thank you for choosing Stazama for your inspection needs.', 105, yPos, { align: 'center' });
    yPos += 5;
    doc.text('This receipt serves as proof of payment and service completion.', 105, yPos, { align: 'center' });
    yPos += 5;
    doc.text('For any inquiries, please contact us at support@stazama.com', 105, yPos, { align: 'center' });

    // Save the PDF
    doc.save(`stazama-receipt-${request.receipt_number}.pdf`);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Notification system
  useEffect(() => {
    // Set up real-time subscription for user's requests
    const channel = supabase
      .channel('user-request-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'inspection_requests',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          toast({
            title: "Request Submitted",
            description: "Your inspection request has been received",
            duration: 5000,
          });
          
          // Refresh requests list
          fetchRequests();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'inspection_requests',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          // Notify about status changes
          const oldStatus = payload.old.status;
          const newStatus = payload.new.status;
          
          if (oldStatus !== newStatus) {
            const statusLabel = statusConfig[newStatus]?.label || newStatus;
            toast({
              title: "Request Status Updated",
              description: `Your request status changed to: ${statusLabel}`,
              duration: 5000,
            });
          }
          
          // Refresh requests list
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                <img src="/images/Dark.svg" alt="Stazama Logo" className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <span className="font-bold text-lg sm:text-xl">My Dashboard</span>
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="gap-2">
                <Home className="w-4 h-4" />
                Home
              </Button>
            </Link>
            <Link to="/" className="sm:hidden">
              <Button variant="ghost" size="icon">
                <Home className="w-4 h-4" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Welcome Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">
              Welcome, {profile?.full_name || 'User'}!
            </CardTitle>
            <CardDescription>
              Manage your account and view your inspection requests
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Inspection Requests */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  My Inspection Requests
                </CardTitle>
                <CardDescription>
                  Track the status of your inspection requests
                </CardDescription>
              </div>
              <Link to="/#request">
                <Button>New Request</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loadingRequests ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No inspection requests yet</p>
                <Link to="/#request" className="text-primary hover:underline">
                  Create your first request
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => {
                  const status = statusConfig[request.status] || statusConfig.pending;
                  const StatusIcon = status.icon;
                  return (
                    <div
                      key={request.id}
                      className="p-3 sm:p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h4 className="font-medium truncate max-w-[150px] sm:max-w-[200px]">{request.store_name}</h4>
                            <Badge variant={status.variant} className="gap-1 text-xs">
                              <StatusIcon className="w-3 h-3" />
                              <span className="hidden xs:inline">{status.label}</span>
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {request.product_details}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-3">
                            <span className="truncate max-w-[120px]">{serviceTierLabels[request.service_tier] || request.service_tier}</span>
                            <span>•</span>
                            <span>MWK {request.service_fee.toLocaleString()}</span>
                            <span>•</span>
                            <span>{new Date(request.created_at).toLocaleDateString()}</span>
                          </div>
                          {request.tracking_id && (
                            <div className="text-xs text-muted-foreground mb-2">
                              Tracking ID: <span className="font-mono font-semibold">{request.tracking_id}</span>
                            </div>
                          )}
                          {/* Payment Status */}
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            {request.payment_received ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="default" className="gap-1 text-xs">
                                  <CheckCircle className="w-3 h-3" />
                                  <span className="hidden xs:inline">Payment Received</span>
                                  <span className="xs:hidden">Paid</span>
                                </Badge>
                                {request.receipt_number && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => downloadReceipt(request)}
                                    className="text-xs h-6 px-2"
                                  >
                                    <Download className="w-3 h-3 mr-1 xs:mr-0 xs:hidden" />
                                    <span className="hidden xs:inline">Download Receipt</span>
                                    <span className="xs:hidden">Receipt</span>
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                Payment Pending
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <User className="w-5 h-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your personal details
                </CardDescription>
              </div>
              {!isEditing ? (
                <Button variant="outline" onClick={() => setIsEditing(true)} className="w-full sm:w-auto">
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setIsEditing(false);
                      if (profile) {
                        setFormData({
                          full_name: profile.full_name || '',
                          phone: profile.phone || '',
                          address: profile.address || '',
                        });
                      }
                    }}
                    className="flex-1 sm:flex-none"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving} className="flex-1 sm:flex-none">
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                Email
              </Label>
              <Input 
                value={profile?.email || user?.email || ''} 
                disabled 
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                Full Name
              </Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                disabled={!isEditing}
                placeholder="Enter your full name"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                Phone Number
              </Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isEditing}
                placeholder="Enter your phone number"
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                Address
              </Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                disabled={!isEditing}
                placeholder="Enter your address"
              />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
