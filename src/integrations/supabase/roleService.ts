import { supabase } from './client';
import type {
  RoleService,
  UserRole,
  UserWithRole,
  RoleCheckResult,
  PermissionCheckResult,
  UserCountByRole
} from './roleTypes';

export const roleService: RoleService = {
  
  // Role checks
  async isAdmin(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('is_admin', { user_id_param: userId });
      
      if (error) {
        console.error('Error checking admin role:', error);
        return false;
      }
      return data;
    } catch (error) {
      console.error('Unexpected error checking admin role:', error);
      return false;
    }
  },
  
  async isAgent(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('is_agent', { user_id_param: userId });
      
      if (error) {
        console.error('Error checking agent role:', error);
        return false;
      }
      return data;
    } catch (error) {
      console.error('Unexpected error checking agent role:', error);
      return false;
    }
  },
  
  async isUser(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('is_user', { user_id_param: userId });
      
      if (error) {
        console.error('Error checking user role:', error);
        return false;
      }
      return data;
    } catch (error) {
      console.error('Unexpected error checking user role:', error);
      return false;
    }
  },
  
  async getUserRole(userId: string): Promise<UserRole | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_role', { user_id_param: userId });
      
      if (error) {
        console.error('Error getting user role:', error);
        return null;
      }
      return data as UserRole;
    } catch (error) {
      console.error('Unexpected error getting user role:', error);
      return null;
    }
  },
  
  async checkAllRoles(userId: string): Promise<RoleCheckResult> {
    try {
      const [isAdmin, isAgent, isUser, role] = await Promise.all([
        this.isAdmin(userId),
        this.isAgent(userId),
        this.isUser(userId),
        this.getUserRole(userId)
      ]);
      
      return {
        isAdmin,
        isAgent,
        isUser,
        role: role || 'user'
      };
    } catch (error) {
      console.error('Error checking all roles:', error);
      return {
        isAdmin: false,
        isAgent: false,
        isUser: true,
        role: 'user'
      };
    }
  },
  
  // Permission checks
  async canManageUsers(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('can_manage_users', { user_id_param: userId });
      
      if (error) {
        console.error('Error checking manage users permission:', error);
        return false;
      }
      return data;
    } catch (error) {
      console.error('Unexpected error checking manage users permission:', error);
      return false;
    }
  },
  
  async canViewDashboard(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('can_view_dashboard', { user_id_param: userId });
      
      if (error) {
        console.error('Error checking view dashboard permission:', error);
        return false;
      }
      return data;
    } catch (error) {
      console.error('Unexpected error checking view dashboard permission:', error);
      return false;
    }
  },
  
  async canCreateRequest(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('can_create_request', { user_id_param: userId });
      
      if (error) {
        console.error('Error checking create request permission:', error);
        return false;
      }
      return data;
    } catch (error) {
      console.error('Unexpected error checking create request permission:', error);
      return false;
    }
  },
  
  async canManageRequest(userId: string, requestId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('can_manage_request', { 
          user_id_param: userId, 
          request_id_param: requestId 
        });
      
      if (error) {
        console.error('Error checking manage request permission:', error);
        return false;
      }
      return data;
    } catch (error) {
      console.error('Unexpected error checking manage request permission:', error);
      return false;
    }
  },
  
  async canViewRequest(userId: string, requestId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('can_view_request', { 
          user_id_param: userId, 
          request_id_param: requestId 
        });
      
      if (error) {
        console.error('Error checking view request permission:', error);
        return false;
      }
      return data;
    } catch (error) {
      console.error('Unexpected error checking view request permission:', error);
      return false;
    }
  },
  
  async canViewAllRequests(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('can_view_all_requests', { user_id_param: userId });
      
      if (error) {
        console.error('Error checking view all requests permission:', error);
        return false;
      }
      return data;
    } catch (error) {
      console.error('Unexpected error checking view all requests permission:', error);
      return false;
    }
  },
  
  async canManagePayments(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('can_manage_payments', { user_id_param: userId });
      
      if (error) {
        console.error('Error checking manage payments permission:', error);
        return false;
      }
      return data;
    } catch (error) {
      console.error('Unexpected error checking manage payments permission:', error);
      return false;
    }
  },
  
  async checkAllPermissions(userId: string): Promise<PermissionCheckResult> {
    try {
      const [canManageUsers, canViewDashboard, canCreateRequest, 
             canViewAllRequests, canManagePayments] = await Promise.all([
        this.canManageUsers(userId),
        this.canViewDashboard(userId),
        this.canCreateRequest(userId),
        this.canViewAllRequests(userId),
        this.canManagePayments(userId)
      ]);
      
      return {
        canManageUsers,
        canViewDashboard,
        canCreateRequest,
        canManageRequest: false, // Add missing property
        canViewAllRequests,
        canManagePayments
      };
    } catch (error) {
      console.error('Error checking all permissions:', error);
      return {
        canManageUsers: false,
        canViewDashboard: false,
        canCreateRequest: false,
        canManageRequest: false,
        canViewAllRequests: false,
        canManagePayments: false
      };
    }
  },
  
  // User management
  async createUserWithRole(
    email: string,
    password: string,
    fullName: string,
    phone: string | null,
    role: UserRole
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .rpc('create_user_with_role', {
          email_param: email,
          password_param: password,
          full_name_param: fullName,
          phone_param: phone,
          role_param: role
        });
      
      if (error) {
        console.error('Error creating user with role:', error);
        throw new Error(error.message);
      }
      
      return data;
    } catch (error) {
      console.error('Unexpected error creating user with role:', error);
      throw new Error('Failed to create user with role');
    }
  },
  
  async updateUserRole(
    adminUserId: string,
    targetUserId: string,
    newRole: UserRole
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('update_user_role', {
          admin_user_id: adminUserId,
          target_user_id: targetUserId,
          new_role: newRole
        });
      
      if (error) {
        console.error('Error updating user role:', error);
        return false;
      }
      
      return data;
    } catch (error) {
      console.error('Unexpected error updating user role:', error);
      return false;
    }
  },
  
  async getUsersByRole(role: UserRole): Promise<UserWithRole[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_users_by_role', { role_param: role });
      
      if (error) {
        console.error('Error getting users by role:', error);
        return [];
      }
      
      return data as UserWithRole[];
    } catch (error) {
      console.error('Unexpected error getting users by role:', error);
      return [];
    }
  },
  
  async countUsersByRole(): Promise<UserCountByRole[]> {
    try {
      const { data, error } = await supabase
        .rpc('count_users_by_role');
      
      if (error) {
        console.error('Error counting users by role:', error);
        return [];
      }
      
      return data as UserCountByRole[];
    } catch (error) {
      console.error('Unexpected error counting users by role:', error);
      return [];
    }
  }
};