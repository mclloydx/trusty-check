import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/dashboard';

interface UseRoleActionsProps {
  userRole: UserRole;
  currentUserId?: string;
}

export function useRoleActions({ userRole, currentUserId }: UseRoleActionsProps) {
  const { toast } = useToast();

  // Universal status update (works for all roles with proper permissions)
  const updateRequestStatus = useCallback(async (requestId: string, status: string) => {
    if (!supabase) {
      toast({
        title: "Error",
        description: "Status update is not available at the moment",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('inspection_requests')
        .update({ status })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Request status updated to ${status}`,
      });
      return true;
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update request status",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  // Agent assignment (admin only)
  const assignAgent = useCallback(async (requestId: string, agentId: string | null) => {
    if (userRole !== 'admin') {
      toast({
        title: "Access Denied",
        description: "Only admins can assign agents",
        variant: "destructive",
      });
      return false;
    }

    if (!supabase) {
      toast({
        title: "Error",
        description: "Agent assignment is not available at the moment",
        variant: "destructive",
      });
      return false;
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

      toast({
        title: "Agent Assigned",
        description: agentId ? "Request has been assigned to agent" : "Request unassigned",
      });
      return true;
    } catch (error) {
      console.error('Error assigning agent:', error);
      toast({
        title: "Error",
        description: "Failed to assign agent",
        variant: "destructive",
      });
      return false;
    }
  }, [userRole, toast]);

  // Self assignment (agent only)
  const assignSelf = useCallback(async (requestId: string) => {
    if (userRole !== 'agent' || !currentUserId) {
      toast({
        title: "Access Denied",
        description: "Only agents can assign themselves to requests",
        variant: "destructive",
      });
      return false;
    }

    if (!supabase) {
      toast({
        title: "Error",
        description: "Self assignment is not available at the moment",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('inspection_requests')
        .update({ 
          assigned_agent_id: currentUserId,
          status: 'assigned'
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "You have been assigned to this request",
      });
      return true;
    } catch (error) {
      console.error('Error assigning self:', error);
      toast({
        title: "Error",
        description: "Failed to assign yourself to this request",
        variant: "destructive",
      });
      return false;
    }
  }, [userRole, currentUserId, toast]);

  // Payment processing (admin only)
  const processPayment = useCallback(async (requestId: string, amount: string, method: string) => {
    if (userRole !== 'admin') {
      toast({
        title: "Access Denied",
        description: "Only admins can process payments",
        variant: "destructive",
      });
      return false;
    }

    if (!supabase) {
      toast({
        title: "Error",
        description: "Payment processing is not available at the moment",
        variant: "destructive",
      });
      return false;
    }

    try {
      const receiptNumber = `REC-${Date.now()}`;
      const { error } = await supabase
        .from('inspection_requests')
        .update({
          payment_received: true,
          payment_method: method,
          service_fee: parseFloat(amount),
          receipt_number: receiptNumber,
          receipt_uploaded_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Payment Processed",
        description: `Payment of MWK ${amount} marked as received`,
      });
      return true;
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Error",
        description: "Failed to process payment",
        variant: "destructive",
      });
      return false;
    }
  }, [userRole, toast]);

  // Fee management (admin only)
  const updateFees = useCallback(async (requestId: string, feeAmount: string, additionalFees: string, feeNotes: string) => {
    if (userRole !== 'admin') {
      toast({
        title: "Access Denied",
        description: "Only admins can update fees",
        variant: "destructive",
      });
      return false;
    }

    if (!supabase) {
      toast({
        title: "Error",
        description: "Fee update is not available at the moment",
        variant: "destructive",
      });
      return false;
    }

    try {
      const total = parseFloat(feeAmount) + parseFloat(additionalFees);
      const { error } = await supabase
        .from('inspection_requests')
        .update({
          service_fee: total,
          fee_notes: feeNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Fees Updated",
        description: `Total amount updated to MWK ${total.toFixed(2)}`,
      });
      return true;
    } catch (error) {
      console.error('Error updating fees:', error);
      toast({
        title: "Error",
        description: "Failed to update fees",
        variant: "destructive",
      });
      return false;
    }
  }, [userRole, toast]);

  // Mark payment received (agent)
  const markPaymentReceived = useCallback(async (requestId: string) => {
    if (userRole !== 'agent') {
      toast({
        title: "Access Denied",
        description: "Only agents can mark payments as received",
        variant: "destructive",
      });
      return false;
    }

    if (!supabase) {
      toast({
        title: "Error",
        description: "Payment marking is not available at the moment",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { data, error } = await supabase
        .rpc('generate_receipt_data', { request_id: requestId });

      if (error) throw error;

      if (!data) {
        throw new Error('Failed to generate receipt data');
      }

      const receiptInfo = data as { receipt_number?: string; };

      toast({
        title: "Payment Marked",
        description: `Payment has been marked as received. Receipt: ${receiptInfo?.receipt_number}`,
      });
      return true;
    } catch (error) {
      console.error('Error marking payment:', error);
      toast({
        title: "Error",
        description: "Failed to mark payment",
        variant: "destructive",
      });
      return false;
    }
  }, [userRole, toast]);

  // Complete request (agent)
  const completeRequest = useCallback(async (requestId: string) => {
    if (userRole !== 'agent') {
      toast({
        title: "Access Denied",
        description: "Only agents can complete requests",
        variant: "destructive",
      });
      return false;
    }

    if (!supabase) {
      toast({
        title: "Error",
        description: "Request completion is not available at the moment",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('inspection_requests')
        .update({ status: 'completed' })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Request Completed",
        description: "Request has been marked as completed",
      });
      return true;
    } catch (error) {
      console.error('Error completing request:', error);
      toast({
        title: "Error",
        description: "Failed to complete request",
        variant: "destructive",
      });
      return false;
    }
  }, [userRole, toast]);

  // Cancel request (agent)
  const cancelRequest = useCallback(async (requestId: string) => {
    if (userRole !== 'agent') {
      toast({
        title: "Access Denied",
        description: "Only agents can cancel requests",
        variant: "destructive",
      });
      return false;
    }

    if (!supabase) {
      toast({
        title: "Error",
        description: "Request cancellation is not available at the moment",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('inspection_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Request Cancelled",
        description: "Request has been cancelled",
      });
      return true;
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast({
        title: "Error",
        description: "Failed to cancel request",
        variant: "destructive",
      });
      return false;
    }
  }, [userRole, toast]);

  return {
    updateRequestStatus,
    assignAgent,
    assignSelf,
    processPayment,
    updateFees,
    markPaymentReceived,
    completeRequest,
    cancelRequest,
  };
}
