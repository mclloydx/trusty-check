import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuthContext';
import { useRoleActions } from '@/hooks/useRoleActions';
import { useToast } from '@/hooks/use-toast';
import { useDashboardData } from '@/hooks/useDashboardData';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { UnifiedRequestModal } from './UnifiedRequestModal';
import { DashboardHeader } from './DashboardHeader';
import { DashboardTabs } from './DashboardTabs';
import { OverviewTab } from './OverviewTab';
import { RequestsTab } from './RequestsTab';
import { ClientsTab } from './ClientsTab';
import { UsersTab } from './UsersTab';
import { ProfileTab } from './ProfileTab';
import { AgentRequestsTab } from './AgentRequestsTab';
import { AvailableRequestsTab } from './AvailableRequestsTab';
import { AgentsManagementTab } from './AgentsManagementTab';
import { UserRequestsTab } from './UserRequestsTab';
import { InspectionRequest, UserRole } from '@/types/dashboard';


export function UnifiedDashboard() {
  const { user, role, loading, signOut, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const roleActions = useRoleActions({ userRole: role as UserRole, currentUserId: user?.id });

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

  // Use custom hook for data management
  const {
    users,
    clients,
    requests,
    agents,
    stats,
    loadingUsers,
    loadingClients,
    loadingRequests,
    loadingAgents,
    refreshSelectedRequest,
    fetchRequests,
    setUsers,
  } = useDashboardData({ user, role, permissions });

  // UI states
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'my-requests' | 'available' | 'clients' | 'users' | 'agents' | 'profile'>('overview');
  const [requestFilter, setRequestFilter] = useState<'all' | 'pending' | 'active' | 'completed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<InspectionRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  
  // Profile editing states (for user role)
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
  });

  // Filter requests based on selected filter and search query
  const filteredRequests = useMemo(() => {
    if (!requests) return [];
    
    let filtered = requests;
    
    // Apply status filter
    if (requestFilter !== 'all') {
      filtered = filtered.filter(request => {
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
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(request => 
        request.customer_name?.toLowerCase().includes(query) ||
        request.store_name?.toLowerCase().includes(query) ||
        request.whatsapp?.toLowerCase().includes(query) ||
        request.service_tier?.toLowerCase().includes(query) ||
        request.status?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [requests, requestFilter, searchQuery]);

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

  // Header sign out handler
  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

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
            const statusConfig = {
              pending: { label: "Pending" },
              assigned: { label: "Assigned" },
              in_progress: { label: "In Progress" },
              completed: { label: "Completed" },
              cancelled: { label: "Cancelled" },
            };
            const statusLabel = statusConfig[newStatus as keyof typeof statusConfig]?.label || newStatus;
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
      <DashboardHeader 
        role={role}
        profile={profile}
        user={user}
        onSignOut={handleSignOut}
      />

      <main className="container mx-auto px-4 py-6 max-w-7xl xl:max-w-screen-2xl">
        {/* Role-based Tabs */}
        <DashboardTabs 
          role={role}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <OverviewTab 
            stats={stats}
            requests={requests}
            loadingRequests={loadingRequests}
            permissions={{
              canViewClients: permissions.canViewClients,
              canViewAllRequests: permissions.canViewAllRequests,
            }}
            onRequestClick={handleRequestClick}
          />
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && permissions.canViewAllRequests && (
          <RequestsTab 
            role={role}
            requests={requests}
            filteredRequests={filteredRequests}
            loadingRequests={loadingRequests}
            requestFilter={requestFilter}
            viewMode={viewMode}
            searchQuery={searchQuery}
            onFilterChange={setRequestFilter}
            onViewModeChange={setViewMode}
            onRequestClick={handleRequestClick}
            onSearchChange={setSearchQuery}
          />
        )}

        {/* Clients Tab */}
        {activeTab === 'clients' && permissions.canViewClients && (
          <ClientsTab 
            clients={clients}
            loadingClients={loadingClients}
          />
        )}

        {/* Users Tab (Admin Only) */}
        {activeTab === 'users' && permissions.canViewUsers && (
          <UsersTab 
            users={users}
            loadingUsers={loadingUsers}
            currentUserId={user?.id}
            onUsersUpdate={setUsers}
          />
        )}

        {/* Profile Tab (User Only) */}
        {activeTab === 'profile' && permissions.canManageProfile && (
          <ProfileTab 
            user={user}
            profile={profile}
            isEditingProfile={isEditingProfile}
            isSavingProfile={isSavingProfile}
            profileFormData={profileFormData}
            onEditToggle={() => setIsEditingProfile(true)}
            onSave={handleProfileSave}
            onCancel={() => {
              setIsEditingProfile(false);
              if (profile) {
                setProfileFormData({
                  full_name: profile.full_name || '',
                  phone: profile.phone || '',
                  address: profile.address || '',
                });
              }
            }}
            onFormDataChange={setProfileFormData}
          />
        )}

        {/* Agent-specific Tabs */}
        {role === 'agent' && activeTab === 'my-requests' && (
          <AgentRequestsTab 
            requests={requests}
            loadingRequests={loadingRequests}
            currentUserId={user?.id}
            onRequestClick={handleRequestClick}
          />
        )}

        {role === 'agent' && activeTab === 'available' && (
          <AvailableRequestsTab 
            requests={requests}
            loadingRequests={loadingRequests}
            onAssignSelf={roleActions.assignSelf}
          />
        )}

        {/* User-specific Tabs */}
        {role === 'user' && activeTab === 'my-requests' && (
          <UserRequestsTab 
            requests={requests}
            filteredRequests={filteredRequests}
            loadingRequests={loadingRequests}
            requestFilter={requestFilter}
            viewMode={viewMode}
            searchQuery={searchQuery}
            onFilterChange={setRequestFilter}
            onViewModeChange={setViewMode}
            onRequestClick={handleRequestClick}
            onSearchChange={setSearchQuery}
          />
        )}

        {/* Admin-specific Agents Tab */}
        {role === 'admin' && activeTab === 'agents' && (
          <AgentsManagementTab 
            agents={agents}
            loadingAgents={loadingAgents}
          />
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
