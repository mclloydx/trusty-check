export interface InspectionRequest {
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
  customer_address: string | null;
  tracking_id: string | null;
  receipt_verification_code: string | null;
  receipt_issued_at: string | null;
  receipt_data?: Record<string, unknown>;
  receipt_uploaded_at?: string | null;
  fee_notes?: string | null;
  updated_at?: string;
  user_email?: string | null;
}

export interface Agent {
  id: string;
  full_name: string | null;
  email: string | null;
}

export interface Client {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  created_at: string | null;
}

export interface UserWithRole {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: string;
  created_at: string | null;
}

export interface DashboardStats {
  totalRequests: number;
  totalClients: number;
  activeRequests: number;
  completedRequests: number;
  pendingRequests: number;
  cancelledRequests: number;
  appointmentsToday: number;
  unassignedRequests: number;
}

export type UserRole = 'admin' | 'agent' | 'user';

export interface RoleBasedActions {
  canViewAllRequests: boolean;
  canAssignAgents: boolean;
  canUpdateStatus: boolean;
  canProcessPayments: boolean;
  canManageFees: boolean;
  canDeleteUsers: boolean;
  canAssignSelf: boolean;
}
