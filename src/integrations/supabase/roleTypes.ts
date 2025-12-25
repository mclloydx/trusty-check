// Role types
export type UserRole = 'admin' | 'agent' | 'user';

// User with role information
export interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

// Role check results
export interface RoleCheckResult {
  isAdmin: boolean;
  isAgent: boolean;
  isUser: boolean;
  role: UserRole;
}

// Permission check results
export interface PermissionCheckResult {
  canManageUsers: boolean;
  canViewDashboard: boolean;
  canCreateRequest: boolean;
  canManageRequest: boolean;
  canViewAllRequests: boolean;
  canManagePayments: boolean;
}

// User count by role
export interface UserCountByRole {
  role: UserRole;
  count: number;
}

// Role service interface
export interface RoleService {
  // Role checks
  isAdmin: (userId: string) => Promise<boolean>;
  isAgent: (userId: string) => Promise<boolean>;
  isUser: (userId: string) => Promise<boolean>;
  getUserRole: (userId: string) => Promise<UserRole | null>;
  checkAllRoles: (userId: string) => Promise<RoleCheckResult>;
  
  // Permission checks
  canManageUsers: (userId: string) => Promise<boolean>;
  canViewDashboard: (userId: string) => Promise<boolean>;
  canCreateRequest: (userId: string) => Promise<boolean>;
  canManageRequest: (userId: string, requestId: string) => Promise<boolean>;
  canViewRequest: (userId: string, requestId: string) => Promise<boolean>;
  canViewAllRequests: (userId: string) => Promise<boolean>;
  canManagePayments: (userId: string) => Promise<boolean>;
  checkAllPermissions: (userId: string) => Promise<PermissionCheckResult>;
  
  // User management
  createUserWithRole: (
    email: string,
    password: string,
    fullName: string,
    phone: string | null,
    role: UserRole
  ) => Promise<string>;
  
  updateUserRole: (
    adminUserId: string,
    targetUserId: string,
    newRole: UserRole
  ) => Promise<boolean>;
  
  getUsersByRole: (role: UserRole) => Promise<UserWithRole[]>;
  countUsersByRole: () => Promise<UserCountByRole[]>;
}