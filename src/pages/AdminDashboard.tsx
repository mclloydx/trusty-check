import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { roleService } from '@/integrations/supabase/roleService';
import { UserRole } from '@/integrations/supabase/roleTypes';
import { Database } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
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
  Shield,
  Phone,
  User,
  Download,
  FileText,
  Mail as MailIcon,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { downloadReceipt, emailReceipt, requestReceiptReissue } from '@/services/receiptService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
  store_location: string;
  product_details: string;
  service_tier: string;
  service_fee: number;
  status: string;
  assigned_agent_id: string | null;
  created_at: string;
  payment_received: boolean | null;
  payment_method: string | null;
  receipt_number: string | null;
  whatsapp: string;
  receipt_verification_code?: string | null;
  receipt_issued_at?: string | null;
  receipt_data?: any;
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

  // Show warning if supabase is not available
  if (!supabase) {
    console.warn('Supabase client is not available. Admin dashboard features will be disabled.');
  }

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

  // Move useEffect hooks after function definitions to fix initialization error
  const fetchUsers = useCallback(async () => {
    // Skip if supabase is not available
    if (!supabase) {
      console.warn('Supabase client not available, skipping users fetch');
      setLoadingUsers(false);
      return;
    }

    setLoadingUsers(true);
    try {
      // Fetch all profiles and join with user roles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, phone, address, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get user roles for each profile
      const usersWithRoles = [];
      if (profilesData) {
        for (const profile of profilesData) {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.id)
            .single();
          
          usersWithRoles.push({
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            phone: profile.phone,
            role: roleData?.role || 'user',
            created_at: profile.created_at,
          });
        }
      }

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
  }, [toast]);

  const fetchAgents = useCallback(async () => {
    // Skip if supabase is not available
    if (!supabase) {
      console.warn('Supabase client not available, skipping agents fetch');
      return;
    }

    try {
      // Fetch all users with role 'agent' by getting user_ids from user_roles and then profiles
      const { data: userRoleData, error: userRoleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'agent');

      if (userRoleError) throw userRoleError;

      if (userRoleData && userRoleData.length > 0) {
        const userIds = userRoleData.map(role => role.user_id);
        
        const { data: agentProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);
        
        if (profilesError) throw profilesError;
        
        if (agentProfiles) {
          setAgents(agentProfiles);
        }
      } else {
        setAgents([]);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    // Skip if supabase is not available
    if (!supabase) {
      console.warn('Supabase client not available, skipping requests fetch');
      setLoadingRequests(false);
      return;
    }

    setLoadingRequests(true);
    try {
      // Fetch all requests (admin has access via RLS)
      const { data, error } = await supabase
        .from('inspection_requests')
        .select(`
          id,
          customer_name,
          store_name,
          store_location,
          product_details,
          service_tier,
          service_fee,
          status,
          assigned_agent_id,
          created_at,
          payment_received,
          payment_method,
          receipt_number,
          whatsapp,
          tracking_id,
          receipt_verification_code,
          receipt_issued_at,
          receipt_data
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
  }, [toast]);

  // Now add the useEffect hooks after function definitions
  useEffect(() => {
    if (user && role === 'admin') {
      fetchUsers();
      fetchAgents();
    }
  }, [user, role, fetchUsers, fetchAgents]);

  useEffect(() => {
    if (user && role === 'admin' && activeTab === 'requests') {
      fetchRequests();
    }
  }, [user, role, activeTab, fetchRequests]);

  const updateUserRole = async (userId: string, newRole: string) => {
    // Skip if supabase is not available
    if (!supabase) {
      console.warn('Supabase client not available, skipping role update');
      toast({
        title: "Error",
        description: "Role update is not available at the moment",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use the role service to update user role
      const success = await roleService.updateUserRole(
        user?.id || '', // Admin user ID
        userId,        // Target user ID
        newRole as UserRole
      );

      if (!success) {
        throw new Error('Failed to update user role');
      }

      // Update local state
      setUsers(users.map(u =>
        u.id === userId ? { ...u, role: newRole } : u
      ));

      toast({
        title: "Role Updated",
        description: `User role updated to ${newRole}`,
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string) => {
    // Skip if supabase is not available
    if (!supabase) {
      console.warn('Supabase client not available, skipping user deletion');
      toast({
        title: "Error",
        description: "User deletion is not available at the moment",
        variant: "destructive",
      });
      return;
    }

    try {
      // In the new schema, we don't delete users directly from the dashboard
      // Instead, we can deactivate them or use Supabase auth functions
      // For now, we'll just remove from local state and show success
      
      // Update local state
      setUsers(users.filter(u => u.id !== userId));

      toast({
        title: "User Removed",
        description: "User has been removed from the dashboard view",
      });
    } catch (error) {
      console.error('Error removing user:', error);
      toast({
        title: "Error",
        description: "Failed to remove user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const assignAgentToRequest = async (requestId: string, agentId: string | null) => {
    // Skip if supabase is not available
    if (!supabase) {
      console.warn('Supabase client not available, skipping agent assignment');
      toast({
        title: "Error",
        description: "Agent assignment is not available at the moment",
        variant: "destructive",
      });
      return;
    }

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
        description: "Failed to reassign request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateRequestStatus = async (requestId: string, status: string) => {
    // Skip if supabase is not available
    if (!supabase) {
      console.warn('Supabase client not available, skipping status update');
      toast({
        title: "Error",
        description: "Status update is not available at the moment",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('inspection_requests')
        .update({ status: status as Database["public"]["Enums"]["request_status"] })
        .eq('id', requestId);

      if (error) throw error;

      // Update local state
      setRequests(requests.map(r => 
        r.id === requestId ? { ...r, status } : r
      ));

      toast({
        title: "Status Updated",
        description: `Request status updated to ${statusConfig[status]?.label || status}`,
      });
    } catch (error) {
      console.error('Error updating request status:', error);
      toast({
        title: "Error",
        description: "Failed to update request status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const markPaymentReceived = async (requestId: string, receiptNumber: string) => {
    // Skip if supabase is not available
    if (!supabase) {
      console.warn('Supabase client not available, skipping payment marking');
      toast({
        title: "Error",
        description: "Payment marking is not available at the moment",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('inspection_requests')
        .update({ 
          payment_received: true,
          receipt_number: receiptNumber,
          receipt_uploaded_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      // Update local state
      setRequests(requests.map(r => 
        r.id === requestId ? { 
          ...r, 
          payment_received: true,
          receipt_number: receiptNumber,
          receipt_uploaded_at: new Date().toISOString()
        } : r
      ));

      toast({
        title: "Payment Marked",
        description: "Payment has been marked as received",
      });
    } catch (error) {
      console.error('Error marking payment:', error);
      toast({
        title: "Error",
        description: "Failed to mark payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const completeRequest = async (requestId: string) => {
    // Skip if supabase is not available
    if (!supabase) {
      console.warn('Supabase client not available, skipping request completion');
      toast({
        title: "Error",
        description: "Request completion is not available at the moment",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('inspection_requests')
        .update({ status: 'completed' })
        .eq('id', requestId);

      if (error) throw error;

      // Update local state
      setRequests(requests.map(r => 
        r.id === requestId ? { ...r, status: 'completed' } : r
      ));

      toast({
        title: "Request Completed",
        description: "Request has been marked as completed",
      });
    } catch (error) {
      console.error('Error completing request:', error);
      toast({
        title: "Error",
        description: "Failed to complete request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const cancelRequest = async (requestId: string) => {
    // Skip if supabase is not available
    if (!supabase) {
      console.warn('Supabase client not available, skipping request cancellation');
      toast({
        title: "Error",
        description: "Request cancellation is not available at the moment",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('inspection_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId);

      if (error) throw error;

      // Update local state
      setRequests(requests.map(r => 
        r.id === requestId ? { ...r, status: 'cancelled' } : r
      ));

      toast({
        title: "Request Cancelled",
        description: "Request has been cancelled",
      });
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast({
        title: "Error",
        description: "Failed to cancel request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const revertCompletedRequest = async (requestId: string) => {
    // Skip if supabase is not available
    if (!supabase) {
      console.warn('Supabase client not available, skipping request reversion');
      toast({
        title: "Error",
        description: "Request reversion is not available at the moment",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('inspection_requests')
        .update({ 
          status: 'pending',
          payment_received: null,
          receipt_number: null,
          receipt_uploaded_at: null
        })
        .eq('id', requestId);

      if (error) throw error;

      // Update local state
      setRequests(requests.map(r => 
        r.id === requestId ? { 
          ...r, 
          status: 'pending',
          payment_received: null,
          receipt_number: null,
          receipt_uploaded_at: null
        } : r
      ));

      toast({
        title: "Request Reverted",
        description: "Request has been reverted to pending status",
      });
    } catch (error) {
      console.error('Error reverting request:', error);
      toast({
        title: "Error",
        description: "Failed to revert request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadReceipt = async (request: InspectionRequest, format: 'pdf' | 'json' = 'pdf') => {
    try {
      if (!request.receipt_number) {
        toast({
          title: "Error",
          description: "No receipt available for this request",
          variant: "destructive",
        });
        return;
      }

      const result = await downloadReceipt(request, format);
      
      if (result.success) {
        toast({
          title: "Success",
          description: `Receipt downloaded successfully. Verification code: ${result.verificationCode}`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast({
        title: "Error",
        description: "Failed to download receipt",
        variant: "destructive",
      });
    }
  };

  const handleEmailReceipt = async (request: InspectionRequest) => {
    try {
      if (!request.receipt_number) {
        toast({
          title: "Error",
          description: "No receipt available for this request",
          variant: "destructive",
        });
        return;
      }

      // For admin, we need to get the user's email from the request
      // Since we don't have direct access to user emails in this context,
      // we'll use a placeholder and show a message
      const result = await emailReceipt(request, 'client@example.com');
      
      toast({
        title: "Info",
        description: "Email receipt functionality would be implemented here",
        variant: "default",
      });
    } catch (error) {
      console.error('Error emailing receipt:', error);
      toast({
        title: "Error",
        description: "Failed to send receipt via email",
        variant: "destructive",
      });
    }
  };

  const handleReissueReceipt = async (request: InspectionRequest) => {
    try {
      if (!request.id) {
        toast({
          title: "Error",
          description: "Invalid request ID",
          variant: "destructive",
        });
        return;
      }

      const result = await requestReceiptReissue(request.id);
      
      if (result.success) {
        toast({
          title: "Success",
          description: `Receipt reissued with new verification code: ${result.newVerificationCode}`,
          variant: "default",
        });
        // Refresh the request to get the new verification code
        fetchRequests();
      }
    } catch (error) {
      console.error('Error reissuing receipt:', error);
      toast({
        title: "Error",
        description: "Failed to reissue receipt",
        variant: "destructive",
      });
    }
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
  }, [activeTab, agents, toast, fetchRequests]);

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
      {loading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <img src="/images/Dark.svg" alt="Stazama Logo" className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg">Admin Panel</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs sm:text-sm text-muted-foreground max-w-[120px] sm:max-w-none truncate hidden xs:inline">
              {profile?.full_name || profile?.email || user?.email}
            </span>
            <Badge variant="default" className="bg-primary text-xs py-0.5 px-2">Admin</Badge>
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="w-8 h-8">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Tabs - Made responsive */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <Button 
            variant={activeTab === 'users' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('users')}
            className="gap-1 sm:gap-2 whitespace-nowrap text-xs sm:text-sm"
            size="sm"
          >
            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>User Mgmt</span>
          </Button>
          <Button 
            variant={activeTab === 'requests' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('requests')}
            className="gap-1 sm:gap-2 whitespace-nowrap text-xs sm:text-sm"
            size="sm"
          >
            <Package className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Requests</span>
          </Button>
        </div>

        {/* Stats Cards - Made responsive */}
        {activeTab === 'users' ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <Card className="col-span-1">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Total Users</CardDescription>
                <CardTitle className="text-xl sm:text-2xl">{stats.totalUsers}</CardTitle>
              </CardHeader>
              <CardContent>
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
              </CardContent>
            </Card>
            <Card className="col-span-1">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Admins</CardDescription>
                <CardTitle className="text-xl sm:text-2xl">{stats.admins}</CardTitle>
              </CardHeader>
              <CardContent>
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </CardContent>
            </Card>
            <Card className="col-span-1">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Agents</CardDescription>
                <CardTitle className="text-xl sm:text-2xl">{stats.agents}</CardTitle>
              </CardHeader>
              <CardContent>
                <UserCog className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
              </CardContent>
            </Card>
            <Card className="col-span-1">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Regular Users</CardDescription>
                <CardTitle className="text-xl sm:text-2xl">{stats.regularUsers}</CardTitle>
              </CardHeader>
              <CardContent>
                <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <Card className="col-span-1">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Total Requests</CardDescription>
                <CardTitle className="text-xl sm:text-2xl">{stats.totalRequests}</CardTitle>
              </CardHeader>
              <CardContent>
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
              </CardContent>
            </Card>
            <Card className="col-span-1">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Active Requests</CardDescription>
                <CardTitle className="text-xl sm:text-2xl">{stats.activeRequests}</CardTitle>
              </CardHeader>
              <CardContent>
                <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
              </CardContent>
            </Card>
            <Card className="col-span-1">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Completed</CardDescription>
                <CardTitle className="text-xl sm:text-2xl">{stats.completedRequests}</CardTitle>
              </CardHeader>
              <CardContent>
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
              </CardContent>
            </Card>
            <Card className="col-span-1">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Cancelled</CardDescription>
                <CardTitle className="text-xl sm:text-2xl">{stats.cancelledRequests}</CardTitle>
              </CardHeader>
              <CardContent>
                <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Request Filters - Made responsive */}
        {activeTab === 'requests' && (
          <div className="flex gap-1 mb-6 flex-wrap overflow-x-auto pb-2">
            <Button 
              variant={requestFilter === 'all' ? 'default' : 'outline'} 
              onClick={() => setRequestFilter('all')}
              size="sm"
              className="text-xs h-7 px-2"
            >
              All
            </Button>
            <Button 
              variant={requestFilter === 'pending' ? 'default' : 'outline'} 
              onClick={() => setRequestFilter('pending')}
              size="sm"
              className="text-xs h-7 px-2"
            >
              Unassigned
            </Button>
            <Button 
              variant={requestFilter === 'active' ? 'default' : 'outline'} 
              onClick={() => setRequestFilter('active')}
              size="sm"
              className="text-xs h-7 px-2"
            >
              Active
            </Button>
            <Button 
              variant={requestFilter === 'completed' ? 'default' : 'outline'} 
              onClick={() => setRequestFilter('completed')}
              size="sm"
              className="text-xs h-7 px-2"
            >
              Completed
            </Button>
            <Button 
              variant={requestFilter === 'cancelled' ? 'default' : 'outline'} 
              onClick={() => setRequestFilter('cancelled')}
              size="sm"
              className="text-xs h-7 px-2"
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
              <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2">
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
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Name</TableHead>
                        <TableHead className="text-xs">Email</TableHead>
                        <TableHead className="text-xs hidden md:table-cell">Phone</TableHead>
                        <TableHead className="text-xs">Role</TableHead>
                        <TableHead className="text-xs hidden sm:table-cell">Joined</TableHead>
                        <TableHead className="text-xs">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium max-w-[100px] truncate text-xs">
                            {u.full_name || 'N/A'}
                          </TableCell>
                          <TableCell className="max-w-[120px] truncate text-xs">
                            {u.email || 'N/A'}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-xs">
                            {u.phone || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={u.role} 
                              onValueChange={(value) => updateUserRole(u.id, value)}
                            >
                              <SelectTrigger className="w-[90px] h-7 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="agent">Agent</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-xs">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="w-7 h-7">
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this user? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => deleteUser(u.id)}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Requests Table */
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2">
                <Package className="w-5 h-5" />
                All Inspection Requests
              </CardTitle>
              <CardDescription>
                Manage all inspection requests across the platform
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
                        <TableHead className="text-xs">Customer</TableHead>
                        <TableHead className="text-xs">Store</TableHead>
                        <TableHead className="text-xs">Service</TableHead>
                        <TableHead className="text-xs">Amount</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs hidden md:table-cell">Assigned To</TableHead>
                        <TableHead className="text-xs hidden sm:table-cell">Date</TableHead>
                        <TableHead className="text-xs hidden md:table-cell">Receipt & Payment</TableHead>
                        <TableHead className="text-xs">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((request) => {
                        const status = statusConfig[request.status] || statusConfig.pending;
                        const StatusIcon = status.icon;
                        
                        return (
                          <TableRow key={request.id}>
                            <TableCell className="font-medium max-w-[100px] truncate text-xs">
                              <div className="truncate">{request.customer_name}</div>
                              <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1 md:hidden">
                                <Phone className="w-2.5 h-2.5" />
                                <span className="truncate">{request.whatsapp}</span>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[100px] truncate text-xs">
                              <div className="truncate">{request.store_name}</div>
                              <div className="text-[10px] text-muted-foreground truncate md:hidden">{request.store_location}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                                {serviceTierLabels[request.service_tier] || request.service_tier}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">MWK {request.service_fee?.toLocaleString() || '0'}</TableCell>
                            <TableCell>
                              <Badge variant={status.variant} className="gap-1 text-[10px] px-1.5 py-0.5">
                                <StatusIcon className="w-2.5 h-2.5" />
                                <span className="hidden xs:inline">{status.label}</span>
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-xs max-w-[100px] truncate">
                              {request.assigned_agent_id ? (
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  <span className="truncate">
                                    {agents.find(a => a.id === request.assigned_agent_id)?.full_name || 'Agent'}
                                  </span>
                                </div>
                              ) : (
                                'Unassigned'
                              )}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-xs">
                              {new Date(request.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="flex flex-col gap-1">
                                {request.payment_method && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                                    {request.payment_method}
                                  </Badge>
                                )}
                                {request.receipt_number ? (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button size="sm" variant="outline" className="h-6 text-[10px] px-1.5 py-0.5">
                                        <Download className="w-2.5 h-2.5 mr-1" />
                                        Paid
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-48">
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDownloadReceipt(request, 'pdf');
                                        }}
                                        className="flex items-center gap-2 text-xs"
                                      >
                                        <FileText className="w-3 h-3" />
                                        Download PDF
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDownloadReceipt(request, 'json');
                                        }}
                                        className="flex items-center gap-2 text-xs"
                                      >
                                        <FileText className="w-3 h-3" />
                                        Download JSON
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEmailReceipt(request);
                                        }}
                                        className="flex items-center gap-2 text-xs"
                                      >
                                        <MailIcon className="w-3 h-3" />
                                        Email Receipt
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleReissueReceipt(request);
                                        }}
                                        className="flex items-center gap-2 text-xs"
                                      >
                                        <RefreshCw className="w-3 h-3" />
                                        Reissue Receipt
                                      </DropdownMenuItem>
                                      {request.receipt_verification_code && (
                                        <>
                                          <DropdownMenuSeparator />
                                          <div className="px-2 py-1 text-xs text-muted-foreground">
                                            Code: {request.receipt_verification_code}
                                          </div>
                                        </>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                ) : (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                                    Pending
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                {request.status !== 'completed' && (
                                  <>
                                    {request.status === 'pending' && (
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={() => assignAgentToRequest(request.id, user?.id || null)}
                                        className="h-7 text-xs px-2"
                                      >
                                        Take
                                      </Button>
                                    )}
                                    {request.status !== 'pending' && request.status !== 'cancelled' && (
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={() => completeRequest(request.id)}
                                        className="h-7 text-xs px-2"
                                      >
                                        Complete
                                      </Button>
                                    )}
                                  </>
                                )}
                                {request.status === 'completed' && (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => revertCompletedRequest(request.id)}
                                    className="h-7 text-xs px-2"
                                  >
                                    Revert
                                  </Button>
                                )}
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => cancelRequest(request.id)}
                                  disabled={request.status === 'cancelled'}
                                  className="h-7 text-xs px-2 text-destructive"
                                >
                                  Cancel
                                </Button>
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
