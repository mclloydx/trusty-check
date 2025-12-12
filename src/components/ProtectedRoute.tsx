import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
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

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // User is not authenticated
        toast({
          title: "Access Denied",
          description: "Please log in to access this page.",
          variant: "destructive",
        });
        navigate('/', { replace: true });
      } else if (requiredRole && role !== requiredRole && role !== 'admin') {
        // User doesn't have the required role (except admins who can access everything)
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page.",
          variant: "destructive",
        });
        navigate('/', { replace: true });
      }
    }
  }, [user, role, loading, navigate, requiredRole, toast]);

  if (loading) {
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
  if (user && (!requiredRole || role === requiredRole || role === 'admin')) {
    return <>{children}</>;
  }

  // Otherwise, return null while redirecting
  return null;
};