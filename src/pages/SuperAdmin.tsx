// src/pages/SuperAdmin.tsx
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { monitoring } from '@/lib/monitoring';
import { cacheService } from '@/lib/cache';
import { OverviewTab } from './admin/OverviewTab';
import { UsersTab } from './admin/UsersTab';
import { SystemTab } from './admin/SystemTab';
import { LogsTab } from './admin/LogsTab';
import { CacheTab } from './admin/CacheTab';
import { SettingsTab } from './admin/SettingsTab';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function SuperAdmin() {
  const [systemMetrics, setSystemMetrics] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user;
      
      if (!currentUser) {
        setIsAuthorized(false);
        return;
      }
      
      // Check if user has admin role
      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUser.id)
        .single();
      
      const isAdmin = !error && roleData?.role === 'admin';
      setIsAuthorized(isAdmin);
      
      if (isAdmin) {
        loadSystemMetrics();
      }
    };
    
    checkAdminStatus();
  }, []);

  useEffect(() => {
    // Set active tab based on URL
    const pathParts = location.pathname.split('/');
    const tabFromUrl = pathParts[pathParts.length - 1];
    
    if (['overview', 'users', 'system', 'logs', 'cache', 'settings'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    } else {
      setActiveTab('overview');
    }
  }, [location.pathname]);

  const loadSystemMetrics = async () => {
    const metrics = {
      performance: monitoring.getMetrics(),
      errors: monitoring.getErrors(),
      cacheStats: cacheService.getStats(),
      // Add more system metrics as needed
    };
    setSystemMetrics(metrics);
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p>You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Super Admin Dashboard</h1>
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          {['overview', 'users', 'system', 'logs', 'cache', 'settings'].map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 font-medium ${
                activeTab === tab
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => navigate(`/super-admin/${tab}`)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white p-6 rounded-lg shadow">
          {activeTab === 'overview' && <OverviewTab metrics={systemMetrics} onRefresh={loadSystemMetrics} />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'system' && <SystemTab metrics={systemMetrics} />}
          {activeTab === 'logs' && <LogsTab />}
          {activeTab === 'cache' && <CacheTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </div>
      </div>
    </AdminLayout>
  );
}

// Tab components would be defined here...