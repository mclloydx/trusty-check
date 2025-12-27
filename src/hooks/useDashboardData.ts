import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { InspectionRequest, Agent, Client, UserWithRole, DashboardStats } from '@/types/dashboard';

import { User } from '@supabase/supabase-js';

interface UseDashboardDataProps {
  user: User | null;
  role: string | null;
  permissions: {
    canViewUsers: boolean;
    canViewClients: boolean;
    canViewAllRequests: boolean;
  };
}

export function useDashboardData({ user, role, permissions }: UseDashboardDataProps) {
  const { toast } = useToast();

  // Data states
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [requests, setRequests] = useState<InspectionRequest[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  
  // Loading states
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingAgents, setLoadingAgents] = useState(true);

  // Data fetching functions
  const fetchUsers = useCallback(async () => {
    if (!permissions.canViewUsers || !supabase) {
      setLoadingUsers(false);
      return;
    }

    setLoadingUsers(true);
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, phone, address, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

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

    setLoadingAgents(true);
    try {
      const { data: agentProfiles, error: profilesError } = await supabase
          .rpc('get_agent_profiles_with_email');
        
        if (profilesError) throw profilesError;
        
        if (agentProfiles) {
          setAgents(agentProfiles);
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
    if (!supabase) {
      setLoadingRequests(false);
      return;
    }

    setLoadingRequests(true);
    try {
      let query = supabase
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
          receipt_data,
          user_id
        `);

      // Filter based on user role
      if (permissions.canViewAllRequests) {
        // Admins and agents can see all requests
        query = query.order('created_at', { ascending: false });
      } else if (user && role === 'user') {
        // Regular users can only see their own requests
        query = query
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
      } else {
        // No permissions, don't fetch
        setRequests([]);
        setLoadingRequests(false);
        return;
      }

      const { data, error } = await query;

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
  }, [permissions.canViewAllRequests, user, role, toast]);

  // Calculate stats
  const stats: DashboardStats = useMemo(() => ({
    totalRequests: requests?.length || 0,
    totalClients: clients?.length || 0,
    activeRequests: requests?.filter(r => r.assigned_agent_id && (r.status === 'assigned' || r.status === 'in_progress')).length || 0,
    completedRequests: requests?.filter(r => r.status === 'completed').length || 0,
    pendingRequests: requests?.filter(r => !r.assigned_agent_id).length || 0,
    cancelledRequests: requests?.filter(r => r.status === 'cancelled').length || 0,
    appointmentsToday: 0,
    unassignedRequests: requests?.filter(r => !r.assigned_agent_id).length || 0,
  }), [requests, clients]);

  // Data fetching effects
  useEffect(() => {
    if (user && role) {
      if (permissions.canViewUsers) fetchUsers();
      if (permissions.canViewClients) fetchClients();
      // Always fetch requests for authenticated users
      fetchRequests();
      fetchAgents();
    }
  }, [user, role, permissions, fetchUsers, fetchClients, fetchRequests, fetchAgents]);

  // Refresh selected request
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
        setRequests(prev => prev.map(req => req.id === requestId ? data : req));
        return data;
      }
    } catch (error) {
      console.error('Error refreshing request:', error);
    }
  }, []);

  return {
    // Data
    users,
    clients,
    requests,
    agents,
    stats,
    
    // Loading states
    loadingUsers,
    loadingClients,
    loadingRequests,
    loadingAgents,
    
    // Actions
    refreshSelectedRequest,
    fetchRequests,
    setUsers,
  };
}
