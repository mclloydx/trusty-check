// src/components/admin/AdminLayout.tsx
import { useState, useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Shield, 
  Settings, 
  Database, 
  Activity, 
  LogOut,
  Menu,
  X
} from 'lucide-react';

interface AdminLayoutProps {
  children?: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>('');

  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user;

      if (!currentUser) {
        setIsAuthorized(false);
        setIsLoading(false);
        navigate('/auth');
        return;
      }

      // Check if user has admin or system_admin role
      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', currentUser.id)
        .eq('is_active', true)
        .single();

      if (error || !roleData) {
        setIsAuthorized(false);
        setIsLoading(false);
        navigate('/');
        return;
      }

      const roleName = roleData.roles?.name;
      if (roleName !== 'admin' && roleName !== 'administrator') {
        setIsAuthorized(false);
        setIsLoading(false);
        navigate('/');
        return;
      }

      setIsAuthorized(true);
      setUser(currentUser);
      setUserRole(roleName);
      setIsLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-6 text-center">
              You don't have permission to access this page.
            </p>
            <Button 
              className="w-full" 
              onClick={() => navigate('/')}
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getMenuItems = () => {
    return [
      { id: 'overview', label: 'Overview', icon: Activity, path: '/system' },
      { id: 'users', label: 'User Management', icon: Users, path: '/system/users' },
      { id: 'system', label: 'System Status', icon: Shield, path: '/system/system' },
      { id: 'logs', label: 'System Logs', icon: Database, path: '/system/logs' },
      { id: 'cache', label: 'Cache Management', icon: Database, path: '/system/cache' },
      { id: 'settings', label: 'Settings', icon: Settings, path: '/system/settings' },
    ];
  };

  const menuItems = getMenuItems();

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Mobile sidebar toggle */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:static md:translate-x-0`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold">
              Administrator
            </span>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <a
                  href={item.path}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
          
          <div className="mt-8 pt-8 border-t">
            <div className="flex items-center space-x-3 p-3">
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="font-medium">
                  {user?.user_metadata?.name?.charAt(0) || user?.email?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.user_metadata?.name || user?.email}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  Administrator
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-64">
        <div className="p-6">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
}