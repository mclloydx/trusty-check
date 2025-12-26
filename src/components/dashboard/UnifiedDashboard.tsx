import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRoleActions } from '@/hooks/useRoleActions';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users,
  LogOut,
  Loader2,
  ClipboardList,
  Calendar,
  Phone,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserPlus,
  Bell,
  User,
  Download,
  FileText,
  Mail as MailIcon,
  RefreshCw,
  Home,
  Edit as EditIcon,
  Save,
  MapPin,
  Shield,
  UserCog,
  Trash2,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { UnifiedRequestModal } from './UnifiedRequestModal';
import { InspectionRequest, Agent, Client, UserWithRole, UserRole, DashboardStats } from '@/types/dashboard';
import { roleService } from '@/integrations/supabase/roleService';
import { UserRole as SupabaseUserRole } from '@/integrations/supabase/roleTypes';

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

export function UnifiedDashboard() {
  const { user, role, loading, signOut, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const roleActions = useRoleActions({ userRole: role as UserRole, currentUserId: user?.id });

  // Data states
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [requests, setRequests] = useState<InspectionRequest[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  
  // UI states
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'my-requests' | 'available' | 'clients' | 'users' | 'agents' | 'profile'>('overview');
  const [requestFilter, setRequestFilter] = useState<'all' | 'pending' | 'active' | 'completed' | 'cancelled'>('all');
  const [selectedRequest, setSelectedRequest] = useState<InspectionRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  
  // Loading states
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingAgents, setLoadingAgents] = useState(true);

  // Profile editing states (for user role)
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
  });

  // Role-based permissions
  const permissions = useMemo(() => ({
    canViewAllRequests: role === 'admin' || role === 'agent',
    canViewUsers: role === 'admin',
    canViewClients: role === 'agent' || role === 'admin',
    canManageProfile: role === 'user',
    canAssignAgents: role === 'admin',
    canUpdateStatus: role === 'admin' || role === 'agent',
    canProcessPayments: role === 'admin',
    canManageFees: role === 'admin',
    canAssignSelf: role === 'agent',
  }), [role]);

  // Filter requests based on selected filter
  const filteredRequests = useMemo(() => {
    if (!requests) return [];
    
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

  // Calculate stats
  const stats: DashboardStats = useMemo(() => ({
    totalRequests: requests?.length || 0,
    totalClients: clients?.length || 0,
    activeRequests: requests?.filter(r => r.assigned_agent_id && (r.status === 'assigned' || r.status === 'in_progress')).length || 0,
    completedRequests: requests?.filter(r => r.status === 'completed').length || 0,
    pendingRequests: requests?.filter(r => !r.assigned_agent_id).length || 0,
    cancelledRequests: requests?.filter(r => r.status === 'cancelled').length || 0,
    appointmentsToday: 0, // TODO: Calculate based on date
    unassignedRequests: requests?.filter(r => !r.assigned_agent_id).length || 0,
  }), [requests, clients]);

  // Data fetching functions
  const fetchUsers = useCallback(async () => {
    if (!permissions.canViewUsers || !supabase) {
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
  }, [permissions.canViewUsers, toast]);

  const fetchClients = useCallback(async () => {
    if (!permissions.canViewClients || !supabase) {
      setLoadingClients(false);
      return;
    }

    setLoadingClients(true);
    try {
      // Fetch all users with role 'user' by getting user_ids from user_roles and then profiles
      const { data: userRoleData, error: userRoleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'user');

      if (userRoleError) throw userRoleError;

      if (userRoleData && userRoleData.length > 0) {
        const userIds = userRoleData.map(role => role.user_id);
        
        const { data: clientProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds)
          .order('created_at', { ascending: false });
        
        if (profilesError) throw profilesError;
        setClients(clientProfiles || []);
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
  }, [permissions.canViewClients, toast]);

  const fetchAgents = useCallback(async () => {
    if (!supabase) {
      setLoadingAgents(false);
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
    } finally {
      setLoadingAgents(false);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    if (!permissions.canViewAllRequests || !supabase) {
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
  }, [permissions.canViewAllRequests, toast]);

  // Initialize profile form data
  useEffect(() => {
    if (profile) {
      setProfileFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        address: profile.address || '',
      });
    }
  }, [profile]);

  // Data fetching effects
  useEffect(() => {
    if (user && role) {
      if (permissions.canViewUsers) fetchUsers();
      if (permissions.canViewClients) fetchClients();
      if (permissions.canViewAllRequests) fetchRequests();
      fetchAgents();
    }
  }, [user, role, permissions, fetchUsers, fetchClients, fetchRequests, fetchAgents]);

  // Profile save handler
  const handleProfileSave = async () => {
    if (!user || !supabase) return;
    
    setIsSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileFormData.full_name,
          phone: profileFormData.phone,
          address: profileFormData.address,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully",
      });
      setIsEditingProfile(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Request action handlers
  const handleRequestClick = (request: InspectionRequest) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  // Update selected request with fresh data from database
  const refreshSelectedRequest = useCallback(async (requestId: string) => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('inspection_requests')
        .select('*')
        .eq('id', requestId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setSelectedRequest(data);
        // Also update the requests array
        setRequests(prev => prev.map(req => req.id === requestId ? data : req));
      }
    } catch (error) {
      console.error('Error refreshing request:', error);
    }
  }, [supabase]);

  // Notification system
  useEffect(() => {
    if (!supabase || !user) return;

    const channel = supabase
      .channel(`${role}-dashboard-notifications`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'inspection_requests',
      }, (payload) => {
        if (role === 'admin' || role === 'agent') {
          toast({
            title: "New Request",
            description: `New inspection request from ${payload.new.customer_name}`,
            duration: 5000,
          });
        } else if (role === 'user' && payload.new.user_id === user.id) {
          toast({
            title: "Request Submitted",
            description: "Your inspection request has been received",
            duration: 5000,
          });
        }
        fetchRequests();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'inspection_requests',
      }, (payload) => {
        if (role === 'user' && payload.new.user_id === user.id) {
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
        }
        fetchRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, role, fetchRequests, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <img src="/images/Dark.svg" alt="Stazama Logo" className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg">
                {role === 'admin' && 'Admin Portal'}
                {role === 'agent' && 'Agent Portal'}
                {role === 'user' && 'My Dashboard'}
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs sm:text-sm text-muted-foreground max-w-[120px] sm:max-w-none truncate hidden xs:inline">
              {profile?.full_name || profile?.email || user?.email}
            </span>
            <Badge variant="default" className="text-xs py-0.5 px-2">
              {role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User'}
            </Badge>
            <Button variant="ghost" size="icon" onClick={() => { signOut(); navigate('/'); }} className="w-8 h-8">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Role-based Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {/* Admin Tabs */}
          {role === 'admin' && (
            <>
              <Button 
                variant={activeTab === 'overview' ? 'default' : 'outline'} 
                onClick={() => setActiveTab('overview')}
                className="gap-2 whitespace-nowrap"
                size="sm"
              >
                <Home className="w-4 h-4" />
                Overview
              </Button>
              
              <Button 
                variant={activeTab === 'requests' ? 'default' : 'outline'} 
                onClick={() => setActiveTab('requests')}
                className="gap-2 whitespace-nowrap"
                size="sm"
              >
                <Package className="w-4 h-4" />
                All Requests
              </Button>
              
              <Button 
                variant={activeTab === 'clients' ? 'default' : 'outline'} 
                onClick={() => setActiveTab('clients')}
                className="gap-2 whitespace-nowrap"
                size="sm"
              >
                <Users className="w-4 h-4" />
                Clients
              </Button>
              
              <Button 
                variant={activeTab === 'users' ? 'default' : 'outline'} 
                onClick={() => setActiveTab('users')}
                className="gap-2 whitespace-nowrap"
                size="sm"
              >
                <UserCog className="w-4 h-4" />
                Users Management
              </Button>
              
              <Button 
                variant={activeTab === 'agents' ? 'default' : 'outline'} 
                onClick={() => setActiveTab('agents')}
                className="gap-2 whitespace-nowrap"
                size="sm"
              >
                <Shield className="w-4 h-4" />
                Agents
              </Button>
            </>
          )}
          
          {/* Agent Tabs */}
          {role === 'agent' && (
            <>
              <Button 
                variant={activeTab === 'overview' ? 'default' : 'outline'} 
                onClick={() => setActiveTab('overview')}
                className="gap-2 whitespace-nowrap"
                size="sm"
              >
                <Home className="w-4 h-4" />
                Dashboard
              </Button>
              
              <Button 
                variant={activeTab === 'my-requests' ? 'default' : 'outline'} 
                onClick={() => setActiveTab('my-requests')}
                className="gap-2 whitespace-nowrap"
                size="sm"
              >
                <Package className="w-4 h-4" />
                My Requests
              </Button>
              
              <Button 
                variant={activeTab === 'available' ? 'default' : 'outline'} 
                onClick={() => setActiveTab('available')}
                className="gap-2 whitespace-nowrap"
                size="sm"
              >
                <ClipboardList className="w-4 h-4" />
                Available Requests
              </Button>
              
              <Button 
                variant={activeTab === 'clients' ? 'default' : 'outline'} 
                onClick={() => setActiveTab('clients')}
                className="gap-2 whitespace-nowrap"
                size="sm"
              >
                <Users className="w-4 h-4" />
                Clients
              </Button>
            </>
          )}
          
          {/* User Tabs */}
          {role === 'user' && (
            <>
              <Button 
                variant={activeTab === 'overview' ? 'default' : 'outline'} 
                onClick={() => setActiveTab('overview')}
                className="gap-2 whitespace-nowrap"
                size="sm"
              >
                <Home className="w-4 h-4" />
                Dashboard
              </Button>
              
              <Button 
                variant={activeTab === 'my-requests' ? 'default' : 'outline'} 
                onClick={() => setActiveTab('my-requests')}
                className="gap-2 whitespace-nowrap"
                size="sm"
              >
                <Package className="w-4 h-4" />
                My Requests
              </Button>
              
              <Button 
                variant={activeTab === 'profile' ? 'default' : 'outline'} 
                onClick={() => setActiveTab('profile')}
                className="gap-2 whitespace-nowrap"
                size="sm"
              >
                <User className="w-4 h-4" />
                Profile
              </Button>
            </>
          )}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
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
                            onClick={() => handleRequestClick(request)}
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
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && permissions.canViewAllRequests && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Inspection Requests
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={viewMode === 'table' ? 'default' : 'outline'}
                    onClick={() => setViewMode('table')}
                  >
                    Table
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'cards' ? 'default' : 'outline'}
                    onClick={() => setViewMode('cards')}
                  >
                    Cards
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                {role === 'admin' && "Manage all inspection requests and assignments"}
                {role === 'agent' && "View and manage inspection requests"}
                {role === 'user' && "View your inspection requests"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Request Filters */}
              <div className="flex gap-2 mb-6 flex-wrap">
                <Button 
                  variant={requestFilter === 'all' ? 'default' : 'outline'} 
                  onClick={() => setRequestFilter('all')}
                  size="sm"
                >
                  All
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
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Store</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        {role !== 'user' && <TableHead>Assigned To</TableHead>}
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
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
                            onClick={() => handleRequestClick(request)}
                          >
                            <TableCell className="font-medium">
                              <div>
                                <div>{request.customer_name}</div>
                                <div className="text-xs text-muted-foreground">{request.whatsapp}</div>
                              </div>
                            </TableCell>
                            <TableCell>{request.store_name}</TableCell>
                            <TableCell>
                              <span className="text-sm">
                                {serviceTierLabels[request.service_tier] || request.service_tier}
                              </span>
                            </TableCell>
                            <TableCell>MWK {request.service_fee ? request.service_fee.toLocaleString() : '0.00'}</TableCell>
                            <TableCell>
                              <Badge variant={status.variant} className="text-xs">
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {status.label}
                              </Badge>
                            </TableCell>
                            {role !== 'user' && (
                              <TableCell>
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
                            <TableCell className="text-sm">
                              {new Date(request.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Button size="sm" variant="outline">
                                <Eye className="w-3 h-3 mr-1" />
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredRequests.map((request) => {
                    const status = statusConfig[request.status] || statusConfig.pending;
                    const StatusIcon = status.icon;
                    
                    return (
                      <Card
                        key={request.id}
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleRequestClick(request)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">{request.customer_name}</h3>
                            <Badge variant={status.variant} className="text-xs">
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {status.label}
                            </Badge>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Store:</span>
                              <span>{request.store_name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Service:</span>
                              <span>{serviceTierLabels[request.service_tier] || request.service_tier}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Amount:</span>
                              <span>MWK {request.service_fee.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Date:</span>
                              <span>{new Date(request.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Clients Tab */}
        {activeTab === 'clients' && permissions.canViewClients && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Clients
              </CardTitle>
              <CardDescription>View and manage client information</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingClients ? (
                <div className="flex justify-center py-8">
                  <Loader rough className="w-6 h-6 animate-spin" />
                </div>
              ) : clients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No clients found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">
                            {client.full_name || 'Not set'}
                          </TableCell>
                          <TableCell>{client.email || 'Not set'}</TableCell>
                          <TableCell>{client.phone || 'Not set'}</TableCell>
                          <TableCell>{client.address || 'Not set'}</TableCell>
                          <TableCell>
                            {client.created_at ? new Date(client.created_at).toLocaleDateString() : 'Unknown'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Users Tab (Admin Only) */}
        {activeTab === 'users' && permissions.canViewUsers && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="w-5 h-5" />
                User Management
              </CardTitle>
              <CardDescription>Manage user roles and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserCog className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No users found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
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
                      {users.map((userItem) => (
                        <TableRow key={userItem.id}>
                          <TableCell className="font-medium">
                            {userItem.full_name || 'Not set'}
                          </TableCell>
                          <TableCell>{userItem.email || 'Not set'}</TableCell>
                          <TableCell>{userItem.phone || 'Not set'}</TableCell>
                          <TableCell>
                            <Badge variant={userItem.role === 'admin' ? 'default' : 'secondary'}>
                              {userItem.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {userItem.created_at ? new Date(userItem.created_at).toLocaleDateString() : 'Unknown'}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={userItem.role}
                              onValueChange={(newRole) => {
                                roleService.updateUserRole(user?.id || '', userItem.id, newRole as SupabaseUserRole);
                                setUsers(users.map(u => 
                                  u.id === userItem.id ? { ...u, role: newRole } : u
                                ));
                              }}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="agent">Agent</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Profile Tab (User Only) */}
        {activeTab === 'profile' && permissions.canManageProfile && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  My Profile
                </div>
                {!isEditingProfile && (
                  <Button variant="outline" onClick={() => setIsEditingProfile(true)} size="sm">
                    <EditIcon className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
              </CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              {isEditingProfile ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={profileFormData.full_name}
                        onChange={(e) => setProfileFormData({...profileFormData, full_name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={profileFormData.phone}
                        onChange={(e) => setProfileFormData({...profileFormData, phone: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={profileFormData.address}
                      onChange={(e) => setProfileFormData({...profileFormData, address: e.target.value})}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleProfileSave} disabled={isSavingProfile}>
                      {isSavingProfile ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Save
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setIsEditingProfile(false);
                      if (profile) {
                        setProfileFormData({
                          full_name: profile.full_name || '',
                          phone: profile.phone || '',
                          address: profile.address || '',
                        });
                      }
                    }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{profile?.full_name || 'Not set'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{profile?.phone || 'Not set'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MailIcon className="w-4 h-4 text-muted-foreground" />
                      <span>{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{profile?.address || 'Not set'}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Agent-specific Tabs */}
        {role === 'agent' && activeTab === 'my-requests' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Assigned Requests</CardTitle>
                <CardDescription>Requests assigned to you</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingRequests ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.filter(r => r.assigned_agent_id === user?.id).map(request => (
                      <div key={request.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{request.customer_name}</h3>
                            <p className="text-sm text-muted-foreground">{request.store_name}</p>
                          </div>
                          <Badge variant={statusConfig[request.status]?.variant || 'outline'}>
                            {statusConfig[request.status]?.label || request.status}
                          </Badge>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => {
                            setSelectedRequest(request);
                            setIsModalOpen(true);
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {role === 'agent' && activeTab === 'available' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Available Requests</CardTitle>
                <CardDescription>Unassigned requests you can take</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingRequests ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.filter(r => !r.assigned_agent_id).map(request => (
                      <div key={request.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{request.customer_name}</h3>
                            <p className="text-sm text-muted-foreground">{request.store_name}</p>
                          </div>
                          <Badge variant="outline">Available</Badge>
                        </div>
                        <Button 
                          size="sm" 
                          className="mt-2"
                          onClick={() => roleActions.assignSelf(request.id)}
                        >
                          Assign to Me
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* User-specific Tabs */}
        {role === 'user' && activeTab === 'my-requests' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Requests</CardTitle>
                <CardDescription>Your inspection requests</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingRequests ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.map(request => (
                      <div key={request.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{request.store_name}</h3>
                            <p className="text-sm text-muted-foreground">{request.product_details}</p>
                          </div>
                          <Badge variant={statusConfig[request.status]?.variant || 'outline'}>
                            {statusConfig[request.status]?.label || request.status}
                          </Badge>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => {
                            setSelectedRequest(request);
                            setIsModalOpen(true);
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Admin-specific Agents Tab */}
        {role === 'admin' && activeTab === 'agents' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Agents Management</CardTitle>
                <CardDescription>Manage inspection agents</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingAgents ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {agents.map(agent => (
                      <div key={agent.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{agent.full_name || 'Unknown'}</h3>
                            <p className="text-sm text-muted-foreground">{agent.email}</p>
                          </div>
                          <Badge variant="secondary">Agent</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Unified Request Modal */}
      <UnifiedRequestModal
        selectedRequest={selectedRequest}
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        userRole={role as UserRole}
        currentUserId={user?.id}
        currentUserEmail={user?.email}
        agents={agents}
        onStatusUpdate={async (requestId: string, status: string) => {
          const success = await roleActions.updateRequestStatus(requestId, status);
          if (success && selectedRequest?.id === requestId) {
            await refreshSelectedRequest(requestId);
          }
        }}
        onAgentAssignment={async (requestId: string, agentId: string | null) => {
          const success = await roleActions.assignAgent(requestId, agentId);
          if (success && selectedRequest?.id === requestId) {
            await refreshSelectedRequest(requestId);
          }
        }}
        onSelfAssignment={async (requestId: string) => {
          const success = await roleActions.assignSelf(requestId);
          if (success && selectedRequest?.id === requestId) {
            await refreshSelectedRequest(requestId);
          }
        }}
        onPaymentProcessing={async (requestId: string, amount: string, method: string) => {
          const success = await roleActions.processPayment(requestId, amount, method);
          if (success && selectedRequest?.id === requestId) {
            await refreshSelectedRequest(requestId);
          }
        }}
        onFeeUpdate={async (requestId: string, feeAmount: string, additionalFees: string, feeNotes: string) => {
          const success = await roleActions.updateFees(requestId, feeAmount, additionalFees, feeNotes);
          if (success && selectedRequest?.id === requestId) {
            await refreshSelectedRequest(requestId);
          }
        }}
        onPaymentReceived={async (requestId: string) => {
          const success = await roleActions.markPaymentReceived(requestId);
          if (success && selectedRequest?.id === requestId) {
            await refreshSelectedRequest(requestId);
          }
        }}
        onRequestComplete={async (requestId: string) => {
          const success = await roleActions.completeRequest(requestId);
          if (success && selectedRequest?.id === requestId) {
            await refreshSelectedRequest(requestId);
          }
        }}
        onRequestCancel={async (requestId: string) => {
          const success = await roleActions.cancelRequest(requestId);
          if (success && selectedRequest?.id === requestId) {
            await refreshSelectedRequest(requestId);
          }
        }}
      />
    </div>
  );
}
