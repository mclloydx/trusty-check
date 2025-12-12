import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import { 
  Users, 
  Briefcase, 
  LogOut, 
  Loader2,
  ClipboardList,
  Calendar,
  Phone,
  Mail,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserPlus,
  Bell,
  User,
  Trash2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Client {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  created_at: string | null;
}

interface InspectionRequest {
  id: string;
  customer_name: string;
  whatsapp: string;
  customer_address: string | null;
  store_name: string;
  store_location: string;
  product_details: string;
  service_tier: string;
  service_fee: number;
  delivery_notes: string | null;
  status: string;
  assigned_agent_id: string | null;
  created_at: string;
  payment_received: boolean | null;
  payment_method: string | null;
  receipt_number: string | null;
}

interface Agent {
  id: string;
  full_name: string | null;
  email: string | null;
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

export default function AgentDashboard() {
  const { user, role, loading, signOut, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [requests, setRequests] = useState<InspectionRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeTab, setActiveTab] = useState<'clients' | 'requests'>('requests');
  const [requestFilter, setRequestFilter] = useState<'all' | 'pending' | 'active' | 'completed' | 'cancelled'>('all');

  // Filter requests based on selected filter - Moved to correct position to fix hook order
  const filteredRequests = useMemo(() => {
    if (requestFilter === 'all') return requests;
    
    return requests.filter(request => {
      switch (requestFilter) {
        case 'pending':
          return !request.assigned_agent_id;
        case 'active':
          return request.assigned_agent_id && (request.status === 'assigned' || request.status === 'in_progress');
        case 'completed':
          return request.status === 'completed';
        case 'cancelled':
          return request.status === 'cancelled';
        default:
          return true;
      }
    });
  }, [requests, requestFilter]);

  useEffect(() => {
    if (!loading && (!user || (role !== 'agent' && role !== 'admin'))) {
      navigate('/dashboard');
    }
  }, [user, role, loading, navigate]);

  useEffect(() => {
    if (user && (role === 'agent' || role === 'admin')) {
      if (activeTab === 'clients') {
        fetchClients();
      } else {
        fetchRequests();
        fetchAgents(); // Fetch agents when loading requests
      }
    }
  }, [user, role, activeTab]);

  const fetchClients = async () => {
    setLoadingClients(true);
    try {
      // Agents can view profiles with role 'user'
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'user');

      if (rolesError) throw rolesError;

      if (userRoles && userRoles.length > 0) {
        const userIds = userRoles.map(r => r.user_id);
        
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds)
          .order('created_at', { ascending: false });

        if (profilesError) throw profilesError;
        setClients(profiles || []);
      } else {
        setClients([]);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Error",
        description: "Failed to load clients",
        variant: "destructive",
      });
    } finally {
      setLoadingClients(false);
    }
  };

  const fetchAgents = async () => {
    try {
      // Fetch all agents
      const { data: agentRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'agent');

      if (rolesError) throw rolesError;

      if (agentRoles && agentRoles.length > 0) {
        const agentIds = agentRoles.map(r => r.user_id);
        
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', agentIds);

        if (profilesError) throw profilesError;
        setAgents(profiles || []);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      // Fetch all requests - assigned and unassigned
      const { data, error } = await supabase
        .from('inspection_requests')
        .select(`
          id,
          customer_name,
          whatsapp,
          customer_address,
          store_name,
          store_location,
          product_details,
          service_tier,
          service_fee,
          delivery_notes,
          status,
          assigned_agent_id,
          created_at,
          payment_received,
          payment_method,
          receipt_number
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error",
        description: "Failed to load requests",
        variant: "destructive",
      });
    } finally {
      setLoadingRequests(false);
    }
  };

  // New function to allow agent to assign themselves to a request
  const assignSelfToRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('inspection_requests')
        .update({ 
          assigned_agent_id: user?.id,
          status: 'assigned'
        })
        .eq('id', requestId);

      if (error) throw error;

      // Update local state
      setRequests(requests.map(r => 
        r.id === requestId ? { ...r, assigned_agent_id: user?.id, status: 'assigned' } : r
      ));

      toast({
        title: "Success",
        description: "You have been assigned to this request",
      });
    } catch (error) {
      console.error('Error assigning self to request:', error);
      toast({
        title: "Error",
        description: "Failed to assign yourself to this request",
        variant: "destructive",
      });
    }
  };

  const updateRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      // Check if request is already completed
      const request = requests.find(r => r.id === requestId);
      if (request?.status === 'completed') {
        toast({
          title: "Request Already Completed",
          description: "This request has already been completed and cannot be updated.",
          variant: "destructive",
        });
        return;
      }

      // Check if trying to mark as completed without payment
      if (newStatus === 'completed' && request?.service_tier !== 'inspection' && !request?.payment_received) {
        toast({
          title: "Payment Not Verified",
          description: "Please verify payment before marking request as completed.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('inspection_requests')
        .update({ status: newStatus as 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' })
        .eq('id', requestId);

      if (error) throw error;

      setRequests(requests.map(r => 
        r.id === requestId ? { ...r, status: newStatus } : r
      ));

      toast({
        title: "Status updated",
        description: "Request status has been updated successfully",
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update request status",
        variant: "destructive",
      });
    }
  };

  const updateRequestPayment = async (requestId: string, isPaid: boolean) => {
    try {
      const { error } = await supabase
        .from('inspection_requests')
        .update({ 
          payment_received: isPaid,
          receipt_number: isPaid ? `RCT-${Date.now()}` : null
        })
        .eq('id', requestId);

      if (error) throw error;

      // Update local state
      setRequests(requests.map(r => 
        r.id === requestId ? { 
          ...r, 
          payment_received: isPaid,
          receipt_number: isPaid ? `RCT-${Date.now()}` : null
        } : r
      ));

      toast({
        title: "Payment updated",
        description: `Request marked as ${isPaid ? 'paid' : 'unpaid'} successfully`,
      });
    } catch (error) {
      console.error('Error updating payment:', error);
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive",
      });
    }
  };

  const downloadReceipt = (request: InspectionRequest, agent: Agent | null = null) => {
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

    // Agent details
    if (agent) {
      doc.setFont('helvetica', 'bold');
      doc.text('PROCESSED BY', 20, yPos);
      yPos += 10;
      doc.setFont('helvetica', 'normal');
      doc.text(`Agent: ${agent.full_name || 'N/A'}`, 20, yPos);
      yPos += 8;
      doc.text(`Email: ${agent.email || 'N/A'}`, 20, yPos);
      yPos += 15;
    }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = {
    totalClients: clients.length,
    pendingTasks: requests.filter(r => r.status === 'assigned' || r.status === 'in_progress').length,
    appointmentsToday: 0,
    completedRequests: requests.filter(r => r.status === 'completed').length,
    unassignedRequests: requests.filter(r => !r.assigned_agent_id).length,
    totalRequests: requests.length,
    cancelledRequests: requests.filter(r => r.status === 'cancelled').length,
    activeRequests: requests.filter(r => r.assigned_agent_id && (r.status === 'assigned' || r.status === 'in_progress')).length,
  };

  // New function to get agent name by ID
  const getAgentName = (agentId: string | null) => {
    if (!agentId) return 'Unassigned';
    const agent = agents.find(a => a.id === agentId);
    return agent ? (agent.full_name || agent.email || 'Unknown Agent') : 'Unknown Agent';
  };

  // Notification system
  useEffect(() => {
    // Only set up notifications if we're on the requests tab
    if (activeTab !== 'requests') return;
    
    // Set up real-time subscription for new requests
    const channel = supabase
      .channel('request-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'inspection_requests',
        },
        (payload) => {
          toast({
            title: "New Request",
            description: `New inspection request from ${payload.new.customer_name}`,
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
        },
        (payload) => {
          // Check if the request was assigned to current user
          if (payload.new.assigned_agent_id === user?.id && payload.old.assigned_agent_id !== user?.id) {
            toast({
              title: "Request Assigned",
              description: `You have been assigned to inspect ${payload.new.customer_name}'s store`,
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
  }, [user?.id, activeTab]);

  // New function to allow admin or agent to reassign a request
  const assignAgentToRequest = async (requestId: string, agentId: string | null) => {
    try {
      const { error } = await supabase
        .from('inspection_requests')
        .update({ 
          assigned_agent_id: agentId,
          status: agentId ? 'assigned' : 'pending'
        })
        .eq('id', requestId);

      if (error) throw error;

      // Update local state
      setRequests(requests.map(r => 
        r.id === requestId ? { ...r, assigned_agent_id: agentId, status: agentId ? 'assigned' : 'pending' } : r
      ));

      toast({
        title: "Request Reassigned",
        description: "Request has been reassigned successfully",
      });
    } catch (error) {
      console.error('Error reassigning request:', error);
      toast({
        title: "Error",
        description: "Failed to reassign request",
        variant: "destructive",
      });
    }
  };



  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-blue-500" />
              </div>
              <span className="font-bold text-xl">Agent Dashboard</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {profile?.full_name || profile?.email || user?.email}
            </span>
            <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">Agent</Badge>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <Card className="col-span-1">
            <CardHeader className="pb-2">
              <CardDescription>Total Requests</CardDescription>
              <CardTitle className="text-2xl">{stats.totalRequests}</CardTitle>
            </CardHeader>
            <CardContent>
              <Package className="w-6 h-6 text-blue-500" />
            </CardContent>
          </Card>
          <Card className="col-span-1">
            <CardHeader className="pb-2">
              <CardDescription>Total Clients</CardDescription>
              <CardTitle className="text-2xl">{stats.totalClients}</CardTitle>
            </CardHeader>
            <CardContent>
              <Users className="w-6 h-6 text-blue-500" />
            </CardContent>
          </Card>
          <Card className="col-span-1">
            <CardHeader className="pb-2">
              <CardDescription>Active Tasks</CardDescription>
              <CardTitle className="text-2xl">{stats.activeRequests}</CardTitle>
            </CardHeader>
            <CardContent>
              <ClipboardList className="w-6 h-6 text-orange-500" />
            </CardContent>
          </Card>
          <Card className="col-span-1">
            <CardHeader className="pb-2">
              <CardDescription>Appointments Today</CardDescription>
              <CardTitle className="text-2xl">{stats.appointmentsToday}</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar className="w-6 h-6 text-green-500" />
            </CardContent>
          </Card>
          <Card className="col-span-1">
            <CardHeader className="pb-2">
              <CardDescription>Completed</CardDescription>
              <CardTitle className="text-2xl">{stats.completedRequests}</CardTitle>
            </CardHeader>
            <CardContent>
              <CheckCircle className="w-6 h-6 text-purple-500" />
            </CardContent>
          </Card>
          <Card className="col-span-1">
            <CardHeader className="pb-2">
              <CardDescription>Unassigned</CardDescription>
              <CardTitle className="text-2xl">{stats.unassignedRequests}</CardTitle>
            </CardHeader>
            <CardContent>
              <Bell className="w-6 h-6 text-red-500" />
            </CardContent>
          </Card>
          <Card className="col-span-1">
            <CardHeader className="pb-2">
              <CardDescription>Cancelled</CardDescription>
              <CardTitle className="text-2xl">{stats.cancelledRequests}</CardTitle>
            </CardHeader>
            <CardContent>
              <XCircle className="w-6 h-6 text-gray-500" />
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <Button 
            variant={activeTab === 'requests' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('requests')}
            className="gap-2"
          >
            <Package className="w-4 h-4" />
            Requests
          </Button>
          <Button 
            variant={activeTab === 'clients' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('clients')}
            className="gap-2"
          >
            <Users className="w-4 h-4" />
            Client List
          </Button>
        </div>

        {/* Request Filters */}
        {activeTab === 'requests' && (
          <div className="flex gap-2 mb-6 flex-wrap">
            <Button 
              variant={requestFilter === 'all' ? 'default' : 'outline'} 
              onClick={() => setRequestFilter('all')}
              size="sm"
            >
              All Requests
            </Button>
            <Button 
              variant={requestFilter === 'pending' ? 'default' : 'outline'} 
              onClick={() => setRequestFilter('pending')}
              size="sm"
            >
              Unassigned
            </Button>
            <Button 
              variant={requestFilter === 'active' ? 'default' : 'outline'} 
              onClick={() => setRequestFilter('active')}
              size="sm"
            >
              Active
            </Button>
            <Button 
              variant={requestFilter === 'completed' ? 'default' : 'outline'} 
              onClick={() => setRequestFilter('completed')}
              size="sm"
            >
              Completed
            </Button>
            <Button 
              variant={requestFilter === 'cancelled' ? 'default' : 'outline'} 
              onClick={() => setRequestFilter('cancelled')}
              size="sm"
            >
              Cancelled
            </Button>
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === 'requests' ? (
          /* Inspection Requests Table */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                All Inspection Requests
              </CardTitle>
              <CardDescription>
                View all requests and collaborate with other agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRequests ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No inspection requests found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Store</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">Assigned To</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="hidden md:table-cell">Receipt & Payment</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((request) => {
                        const status = statusConfig[request.status] || statusConfig.pending;
                        const StatusIcon = status.icon;
                        
                        return (
                          <TableRow key={request.id}>
                            <TableCell className="font-medium">
                              <div className="truncate max-w-[120px]">{request.customer_name}</div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <Phone className="w-3 h-3" />
                                <span className="truncate max-w-[100px]">{request.whatsapp}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="truncate max-w-[100px]">{request.store_name}</div>
                              <div className="text-xs text-muted-foreground truncate max-w-[100px]">{request.store_location}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">
                                {serviceTierLabels[request.service_tier] || request.service_tier}
                              </Badge>
                            </TableCell>
                            <TableCell>MWK {request.service_fee.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant={status.variant} className="gap-1 text-xs">
                                <StatusIcon className="w-3 h-3" />
                                <span className="hidden sm:inline">{status.label}</span>
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="text-xs truncate max-w-[80px]">
                                  {getAgentName(request.assigned_agent_id)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">
                              {new Date(request.created_at).toLocaleDateString()}
                            </TableCell>
                            {/* Receipt & Payment Verification */}
                            <TableCell className="hidden md:table-cell">
                              <div className="flex flex-col gap-2">
                                {request.payment_received ? (
                                  <div className="flex flex-col gap-2">
                                    <Badge variant="default" className="gap-1 text-xs">
                                      <CheckCircle className="w-3 h-3" />
                                      Paid
                                    </Badge>
                                    {request.receipt_number && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => downloadReceipt(request, getAgentName(request.assigned_agent_id) !== 'Unassigned' ? agents.find(a => a.id === request.assigned_agent_id) : null)}
                                        className="text-xs h-6"
                                      >
                                        Download
                                      </Button>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={() => updateRequestPayment(request.id, true)}
                                        className="text-xs h-6"
                                      >
                                        Mark Paid
                                      </Button>
                                    </div>
                                    {request.payment_method && (
                                      <div className="text-xs text-muted-foreground truncate max-w-[80px]">
                                        Method: {request.payment_method}
                                      </div>
                                    )}
                                    {request.receipt_number && (
                                      <div className="text-xs text-muted-foreground truncate max-w-[80px]">
                                        Receipt: {request.receipt_number}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                {request.status === 'completed' ? (
                                  <div className="text-muted-foreground text-[10px] hidden sm:block">
                                    Completed - Actions Disabled
                                  </div>
                                ) : request.assigned_agent_id === user?.id ? (
                                  <Select
                                    value={request.status}
                                    onValueChange={(value) => updateRequestStatus(request.id, value)}
                                  >
                                    <SelectTrigger className="w-24 text-xs">
                                      <SelectValue>Update</SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="assigned">Assigned</SelectItem>
                                      <SelectItem value="in_progress">In Progress</SelectItem>
                                      <SelectItem value="completed">Completed</SelectItem>
                                      <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : !request.assigned_agent_id ? (
                                  <Button variant="outline" onClick={() => assignSelfToRequest(request.id)} className="text-[10px] h-6 px-2">
                                    <UserPlus className="w-3 h-3 mr-1" />
                                    Assign
                                  </Button>
                                ) : (
                                  <div className="flex flex-col gap-1">
                                    <div className="text-[10px] text-muted-foreground hidden sm:block">
                                      Assigned to {getAgentName(request.assigned_agent_id)}
                                    </div>
                                    {/* Admins and the assigned agent can reassign */}
                                    {(role === 'admin' || request.assigned_agent_id === user?.id) && (
                                      <Select
                                        value={request.assigned_agent_id || undefined}
                                        onValueChange={(value) => {
                                          if (value === '__unassign__') {
                                            assignAgentToRequest(request.id, null);
                                          } else {
                                            assignAgentToRequest(request.id, value);
                                          }
                                        }}
                                      >
                                        <SelectTrigger className="w-24 text-xs">
                                          <SelectValue>Reassign</SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="__unassign__">Unassign</SelectItem>
                                          {agents.map(agent => (
                                            <SelectItem key={agent.id} value={agent.id}>
                                              {agent.full_name || agent.email}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    )}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Clients Table */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Client List
              </CardTitle>
              <CardDescription>
                View and manage your assigned clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingClients ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : clients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No clients assigned yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">
                          {client.full_name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            {client.email || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            {client.phone || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>{client.address || 'N/A'}</TableCell>
                        <TableCell>
                          {client.created_at 
                            ? new Date(client.created_at).toLocaleDateString() 
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}