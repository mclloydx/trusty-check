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
  Download,
  Edit as EditIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Show warning if supabase is not available
if (!supabase) {
  console.warn('Supabase client is not available. Dashboard features will be disabled.');
}

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

export default function UserDashboard() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<InspectionRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
  });

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
    // Skip if supabase is not available
    if (!supabase) {
      console.warn('Supabase client not available, skipping requests fetch');
      setLoadingRequests(false);
      return;
    }

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
      toast({
        title: "Error",
        description: "Failed to load your requests",
        variant: "destructive",
      });
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    // Skip if supabase is not available
    if (!supabase) {
      console.warn('Supabase client not available, skipping save');
      return;
    }

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
    // Skip if supabase is not available
    if (!supabase) {
      return;
    }

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

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You need to be logged in to view this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              <span className="font-bold text-xl">Stazama</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="hidden sm:flex">
              <User className="w-3 h-3 mr-1" />
              {profile?.full_name || user.email}
            </Badge>
            <Button variant="outline" onClick={handleSignOut} size="sm" className="text-xs sm:text-sm">
              <LogOut className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">My Dashboard</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Manage your profile and inspection requests</p>
        </div>

        {/* Profile Section */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  My Profile
                </span>
                {!isEditing && (
                  <Button variant="outline" onClick={() => setIsEditing(true)} size="sm">
                    <EditIcon className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
              </CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={formData.full_name}
                        onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
                      {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Save
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setIsEditing(false);
                      if (profile) {
                        setFormData({
                          full_name: profile.full_name || '',
                          phone: profile.phone || '',
                          address: profile.address || '',
                        });
                      }
                    }} className="w-full sm:w-auto">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{profile?.full_name || 'Not set'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{profile?.phone || 'Not set'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{profile?.address || 'Not set'}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Requests Section */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2">
                <Package className="w-5 h-5" />
                My Inspection Requests
              </CardTitle>
              <CardDescription>View and manage your inspection requests</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRequests ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Loading requests...</span>
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No requests yet</h3>
                  <p className="text-muted-foreground mb-4 text-sm">You haven't submitted any inspection requests.</p>
                  <Button onClick={() => navigate('/request-inspection')} size="sm">
                    Submit Request
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map((request) => (
                    <Card key={request.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h3 className="font-semibold text-base">{request.store_name}</h3>
                              <Badge variant={statusConfig[request.status]?.variant || "outline"} className="text-xs">
                                {statusConfig[request.status]?.label || request.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {request.product_details}
                            </p>
                            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                              <span>Service: {serviceTierLabels[request.service_tier] || request.service_tier}</span>
                              <span>Fee: MWK {request.service_fee.toLocaleString()}</span>
                              <span>{new Date(request.created_at).toLocaleDateString()}</span>
                              {request.tracking_id && (
                                <span className="font-mono">ID: {request.tracking_id}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-row sm:flex-col gap-2 sm:items-end">
                            {request.status === 'completed' && request.receipt_number && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => downloadReceipt(request)}
                                className="flex items-center gap-1 text-xs"
                              >
                                <Download className="w-3 h-3" />
                                <span className="hidden xs:inline">Receipt</span>
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => navigate(`/track?trackingId=${request.tracking_id}`)}
                              disabled={!request.tracking_id}
                              className="text-xs"
                            >
                              <span className="hidden xs:inline">Track</span>
                              <span className="xs:hidden">T</span>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}