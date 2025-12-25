import { useEffect, useState } from 'react';
import { roleService } from '../integrations/supabase/roleService';
import type { RoleCheckResult, PermissionCheckResult, UserRole } from '../integrations/supabase/roleTypes';

export function useRoleAccess(userId: string | null) {
  const [roleInfo, setRoleInfo] = useState<RoleCheckResult>({
    isAdmin: false,
    isAgent: false,
    isUser: true,
    role: 'user'
  });
  
  const [permissions, setPermissions] = useState<PermissionCheckResult>({
    canManageUsers: false,
    canViewDashboard: false,
    canCreateRequest: false,
    canManageRequest: false,
    canViewAllRequests: false,
    canManagePayments: false
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadRoleInfo = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Check roles and permissions in parallel
        const [roles, perms] = await Promise.all([
          roleService.checkAllRoles(userId),
          roleService.checkAllPermissions(userId)
        ]);
        
        setRoleInfo(roles);
        setPermissions(perms);
      } catch (err) {
        console.error('Error loading role info:', err);
        setError('Failed to load role information');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRoleInfo();
  }, [userId]);
  
  // Helper functions for common access checks
  const canAccess = (requiredRole: UserRole | UserRole[]): boolean => {
    if (isLoading) return false;
    if (!userId) return false;
    
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return requiredRoles.includes(roleInfo.role);
  };
  
  const canPerform = (permissionKey: keyof PermissionCheckResult): boolean => {
    if (isLoading) return false;
    if (!userId) return false;
    
    return permissions[permissionKey];
  };
  
  return {
    ...roleInfo,
    ...permissions,
    isLoading,
    error,
    canAccess,
    canPerform,
    refresh: () => {
      if (userId) {
        roleService.checkAllRoles(userId).then(setRoleInfo);
        roleService.checkAllPermissions(userId).then(setPermissions);
      }
    }
  };
}
