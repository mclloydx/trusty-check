import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'agent' | 'admin';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hasShownToast, setHasShownToast] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // User is not authenticated
        if (!hasShownToast) {
          toast({
            title: "Access Denied",
            description: "Please log in to access this page.",
            variant: "destructive",
          });
          setHasShownToast(true);
        }
        navigate('/', { replace: true });
      } else if (requiredRole && role && role !== requiredRole && role !== 'admin') {
        // User doesn't have the required role (except admins who can access everything)
        if (!hasShownToast) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to access this page.",
            variant: "destructive",
          });
          setHasShownToast(true);
        }
        navigate('/', { replace: true });
      }
    }
  }, [user, role, loading, navigate, requiredRole, toast, hasShownToast]);

  // Show loading state while checking authentication
  // Also show loading if user exists but role is not yet loaded (needed for refresh scenarios)
  if (loading || (user && requiredRole && !role)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Checking access permissions...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated and has the required role (or is admin), render children
  // Also render children if no required role is specified but user is authenticated
  if (user && (!requiredRole || (role && (role === requiredRole || role === 'admin')))) {
    return <>{children}</>;
  }

  // Handle the case where we're not loading but user is not authenticated
  // This will trigger the useEffect to redirect
  return null;
};
