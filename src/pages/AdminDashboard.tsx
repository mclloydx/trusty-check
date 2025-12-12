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
  LogOut,
  Home,
  UserCog,
  Loader2,
  UserPlus,
  Trash2,
  Package,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Bell,
  ClipboardList,
  Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface UserWithRole {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: string;
  created_at: string | null;
}

interface InspectionRequest {
  id: string;
  customer_name: string;
  store_name: string;
  product_details: string;
  service_tier: string;
  service_fee: number;
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

export default function AdminDashboard() {
  const { user, role, loading, signOut, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [requests, setRequests] = useState<InspectionRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'requests'>('users');
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

  // Authentication is now handled by ProtectedRoute component
  // This effect can be removed as it's redundant

  useEffect(() => {
    if (user && role === 'admin') {
      fetchUsers();
      fetchAgents();
    }
  }, [user, role]);

  useEffect(() => {
    if (user && role === 'admin' && activeTab === 'requests') {
      fetchRequests();
    }
  }, [user, role, activeTab]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      // Fetch all profiles (admin has access via RLS)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles = profiles?.map(p => {
        const userRole = roles?.find(r => r.user_id === p.id);
        return {
          id: p.id,
          email: p.email,
          full_name: p.full_name,
          phone: p.phone,
          role: userRole?.role || 'user',
          created_at: p.created_at,
        };
      }) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
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
      const { data, error } = await supabase
        .from('inspection_requests')
        .select(`
          id,
          customer_name,
          store_name,
          product_details,
          service_tier,
          service_fee,
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
        description: "Failed to load inspection requests",
        variant: "destructive",
      });
    } finally {
      setLoadingRequests(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole as 'admin' | 'agent' | 'user' })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));

      toast({
        title: "Role updated",
        description: "User role has been updated successfully",
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const updateRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      // Check if request is already completed
      const request = requests.find(r => r.id === requestId);
      if (request?.status === 'completed') {
        // Only allow admin to change status of completed requests
        toast({
          title: "Request Already Completed",
          description: "This request has already been completed and cannot be updated except by admin.",
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

  // New function to allow admin to revert completed requests
  const revertCompletedRequest = async (requestId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('inspection_requests')
        .update({ 
          status: newStatus as 'pending' | 'assigned' | 'in_progress' | 'cancelled',
          // Reset payment if reverting from completed
          payment_received: newStatus === 'pending' || newStatus === 'assigned' || newStatus === 'in_progress' || newStatus === 'cancelled' ? false : undefined
        })
        .eq('id', requestId);

      if (error) throw error;

      setRequests(requests.map(r => 
        r.id === requestId ? { ...r, status: newStatus, payment_received: newStatus === 'pending' || newStatus === 'assigned' || newStatus === 'in_progress' || newStatus === 'cancelled' ? false : r.payment_received } : r
      ));

      toast({
        title: "Status reverted",
        description: "Request status has been reverted successfully",
      });
    } catch (error) {
      console.error('Error reverting status:', error);
      toast({
        title: "Error",
        description: "Failed to revert request status",
        variant: "destructive",
      });
    }
  };

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

      setRequests(requests.map(r => 
        r.id === requestId ? { ...r, assigned_agent_id: agentId, status: agentId ? 'assigned' : 'pending' } : r
      ));

      toast({
        title: "Agent assigned",
        description: agentId 
          ? "Agent has been assigned to the request" 
          : "Agent assignment has been removed",
      });
    } catch (error) {
      console.error('Error assigning agent:', error);
      toast({
        title: "Error",
        description: "Failed to assign agent to request",
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
    doc.text(`Store: ${request.store_name}`, 20, yPos);
    yPos += 10;

    // Service details
    doc.setFont('helvetica', 'bold');
    doc.text('SERVICE DETAILS', 20, yPos);
    yPos += 10;
    doc.setFont('helvetica', 'normal');
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

  // Notification system
  useEffect(() => {
    // Set up real-time subscription for requests
    const channel = supabase
      .channel('admin-request-notifications')
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
          if (activeTab === 'requests') {
            fetchRequests();
          }
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
          // Notify about assignment changes
          if (payload.new.assigned_agent_id && payload.old.assigned_agent_id !== payload.new.assigned_agent_id) {
            const agent = agents.find(a => a.id === payload.new.assigned_agent_id);
            const agentName = agent ? (agent.full_name || agent.email) : 'an agent';

            toast({
              title: "Request Assigned",
              description: `Request for ${payload.new.customer_name} assigned to ${agentName}`,
              duration: 5000,
            });
          }

          // Refresh requests list
          if (activeTab === 'requests') {
            fetchRequests();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab, agents]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = {
    totalUsers: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    agents: users.filter(u => u.role === 'agent').length,
    regularUsers: users.filter(u => u.role === 'user').length,
    totalRequests: requests.length,
    pendingRequests: requests.filter(r => r.status === 'pending').length,
    assignedRequests: requests.filter(r => r.status === 'assigned').length,
    completedRequests: requests.filter(r => r.status === 'completed').length,
    cancelledRequests: requests.filter(r => r.status === 'cancelled').length,
    activeRequests: requests.filter(r => r.status === 'assigned' || r.status === 'in_progress').length,
    unassignedRequests: requests.filter(r => !r.assigned_agent_id).length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <img src="/images/Dark.svg" alt="Stazama Logo" className="w-6 h-6" />
              </div>
              <span className="font-bold text-xl">Admin Panel</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {profile?.full_name || profile?.email || user?.email}
            </span>
            <Badge variant="default" className="bg-primary">Admin</Badge>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <Button 
            variant={activeTab === 'users' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('users')}
            className="gap-2"
          >
            <Users className="w-4 h-4" />
            User Management
          </Button>
          <Button 
            variant={activeTab === 'requests' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('requests')}
            className="gap-2"
          >
            <Package className="w-4 h-4" />
            Inspection Requests
          </Button>
        </div>

        {/* Stats Cards */}
        {activeTab === 'users' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="col-span-1">
              <CardHeader className="pb-2">
                <CardDescription>Total Users</CardDescription>
                <CardTitle className="text-2xl">{stats.totalUsers}</CardTitle>
              </CardHeader>
              <CardContent>
                <Users className="w-6 h-6 text-muted-foreground" />
              </CardContent>
            </Card>
            <Card className="col-span-1">
              <CardHeader className="pb-2">
                <CardDescription>Admins</CardDescription>
                <CardTitle className="text-2xl">{stats.admins}</CardTitle>
              </CardHeader>
              <CardContent>
                <Shield className="w-6 h-6 text-primary" />
              </CardContent>
            </Card>
            <Card className="col-span-1">
              <CardHeader className="pb-2">
                <CardDescription>Agents</CardDescription>
                <CardTitle className="text-2xl">{stats.agents}</CardTitle>
              </CardHeader>
              <CardContent>
                <UserCog className="w-6 h-6 text-blue-500" />
              </CardContent>
            </Card>
            <Card className="col-span-1">
              <CardHeader className="pb-2">
                <CardDescription>Regular Users</CardDescription>
                <CardTitle className="text-2xl">{stats.regularUsers}</CardTitle>
              </CardHeader>
              <CardContent>
                <UserPlus className="w-6 h-6 text-green-500" />
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="col-span-1">
              <CardHeader className="pb-2">
                <CardDescription>Total Requests</CardDescription>
                <CardTitle className="text-2xl">{stats.totalRequests}</CardTitle>
              </CardHeader>
              <CardContent>
                <Package className="w-6 h-6 text-purple-500" />
              </CardContent>
            </Card>
            <Card className="col-span-1">
              <CardHeader className="pb-2">
                <CardDescription>Active Requests</CardDescription>
                <CardTitle className="text-2xl">{stats.activeRequests}</CardTitle>
              </CardHeader>
              <CardContent>
                <ClipboardList className="w-6 h-6 text-orange-500" />
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
                <CardDescription>Cancelled</CardDescription>
                <CardTitle className="text-2xl">{stats.cancelledRequests}</CardTitle>
              </CardHeader>
              <CardContent>
                <XCircle className="w-6 h-6 text-gray-500" />
              </CardContent>
            </Card>
          </div>
        )}

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
        {activeTab === 'users' ? (
          /* Users Table */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage all users and their roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">
                          {u.full_name || 'N/A'}
                        </TableCell>
                        <TableCell>{u.email || 'N/A'}</TableCell>
                        <TableCell>{u.phone || 'N/A'}</TableCell>
                        <TableCell>
                          <Select
                            value={u.role}
                            onValueChange={(value) => updateUserRole(u.id, value)}
                            disabled={u.id === user?.id}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="agent">Agent</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {u.created_at 
                            ? new Date(u.created_at).toLocaleDateString() 
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {u.id !== user?.id && (
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Inspection Requests Table */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Inspection Requests Management
              </CardTitle>
              <CardDescription>
                Manage all inspection requests, assign agents, and update statuses
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
                        <TableHead className="hidden sm:table-cell">Store</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead className="hidden sm:table-cell">Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Agent</TableHead>
                        <TableHead className="hidden md:table-cell">Date</TableHead>
                        <TableHead className="hidden md:table-cell">Receipt & Payment</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((request) => {
                        const status = statusConfig[request.status] || statusConfig.pending;
                        const StatusIcon = status.icon;
                        const assignedAgent = agents.find(a => a.id === request.assigned_agent_id);
                        
                        return (
                          <TableRow key={request.id}>
                            <TableCell className="font-medium">
                              <div className="truncate max-w-[120px]">{request.customer_name}</div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <div className="truncate max-w-[100px]">{request.store_name}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">
                                {serviceTierLabels[request.service_tier] || request.service_tier}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">MWK {request.service_fee.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant={status.variant} className="gap-1 text-xs">
                                <StatusIcon className="w-3 h-3" />
                                <span className="hidden sm:inline">{status.label}</span>
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={request.assigned_agent_id || undefined}
                                onValueChange={(value) => assignAgentToRequest(request.id, value === '__unassign__' ? null : value)}
                              >
                                <SelectTrigger className="w-24 text-xs">
                                  <SelectValue placeholder="Agent" />
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
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-xs">
                              {new Date(request.created_at).toLocaleDateString()}
                            </TableCell>
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
                                        onClick={() => downloadReceipt(request, assignedAgent)}
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
                                  <div className="flex flex-col gap-1">
                                    <div className="text-muted-foreground text-[10px] hidden sm:block">
                                      Completed - Actions Restricted
                                    </div>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="outline" size="sm" className="text-[10px] h-6 px-2">
                                          Revert
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Revert Completed Request</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This will change the status of a completed request. This action should only be performed in exceptional circumstances.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <div className="py-4">
                                          <Select onValueChange={(value) => revertCompletedRequest(request.id, value)}>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select new status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="pending">Pending</SelectItem>
                                              <SelectItem value="assigned">Assigned</SelectItem>
                                              <SelectItem value="in_progress">In Progress</SelectItem>
                                              <SelectItem value="cancelled">Cancelled</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                ) : (
                                  <Select
                                    value={request.status}
                                    onValueChange={(value) => updateRequestStatus(request.id, value)}
                                  >
                                    <SelectTrigger className="w-24 text-xs">
                                      <SelectValue>Update</SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="assigned">Assigned</SelectItem>
                                      <SelectItem value="in_progress">In Progress</SelectItem>
                                      <SelectItem value="completed">Completed</SelectItem>
                                      <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                  </Select>
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
        )}
      </main>
    </div>
  );
}
