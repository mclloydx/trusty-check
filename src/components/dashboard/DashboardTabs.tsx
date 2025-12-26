import { 
  Home, 
  Package, 
  Users, 
  UserCog, 
  Shield, 
  ClipboardList, 
  User 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type TabType = 'overview' | 'requests' | 'my-requests' | 'available' | 'clients' | 'users' | 'agents' | 'profile';

interface DashboardTabsProps {
  role: string | null;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function DashboardTabs({ role, activeTab, onTabChange }: DashboardTabsProps) {
  const renderAdminTabs = () => {
    if (role !== 'admin') return null;
    
    return (
      <>
        <Button 
          variant={activeTab === 'overview' ? 'default' : 'outline'} 
          onClick={() => onTabChange('overview')}
          className="gap-2 whitespace-nowrap"
          size="sm"
        >
          <Home className="w-4 h-4" />
          Overview
        </Button>
        
        <Button 
          variant={activeTab === 'requests' ? 'default' : 'outline'} 
          onClick={() => onTabChange('requests')}
          className="gap-2 whitespace-nowrap"
          size="sm"
        >
          <Package className="w-4 h-4" />
          All Requests
        </Button>
        
        <Button 
          variant={activeTab === 'clients' ? 'default' : 'outline'} 
          onClick={() => onTabChange('clients')}
          className="gap-2 whitespace-nowrap"
          size="sm"
        >
          <Users className="w-4 h-4" />
          Clients
        </Button>
        
        <Button 
          variant={activeTab === 'users' ? 'default' : 'outline'} 
          onClick={() => onTabChange('users')}
          className="gap-2 whitespace-nowrap"
          size="sm"
        >
          <UserCog className="w-4 h-4" />
          Users Management
        </Button>
        
        <Button 
          variant={activeTab === 'agents' ? 'default' : 'outline'} 
          onClick={() => onTabChange('agents')}
          className="gap-2 whitespace-nowrap"
          size="sm"
        >
          <Shield className="w-4 h-4" />
          Agents
        </Button>
      </>
    );
  };

  const renderAgentTabs = () => {
    if (role !== 'agent') return null;
    
    return (
      <>
        <Button 
          variant={activeTab === 'overview' ? 'default' : 'outline'} 
          onClick={() => onTabChange('overview')}
          className="gap-2 whitespace-nowrap"
          size="sm"
        >
          <Home className="w-4 h-4" />
          Dashboard
        </Button>
        
        <Button 
          variant={activeTab === 'my-requests' ? 'default' : 'outline'} 
          onClick={() => onTabChange('my-requests')}
          className="gap-2 whitespace-nowrap"
          size="sm"
        >
          <Package className="w-4 h-4" />
          My Requests
        </Button>
        
        <Button 
          variant={activeTab === 'available' ? 'default' : 'outline'} 
          onClick={() => onTabChange('available')}
          className="gap-2 whitespace-nowrap"
          size="sm"
        >
          <ClipboardList className="w-4 h-4" />
          Available Requests
        </Button>
        
        <Button 
          variant={activeTab === 'clients' ? 'default' : 'outline'} 
          onClick={() => onTabChange('clients')}
          className="gap-2 whitespace-nowrap"
          size="sm"
        >
          <Users className="w-4 h-4" />
          Clients
        </Button>
      </>
    );
  };

  const renderUserTabs = () => {
    if (role !== 'user') return null;
    
    return (
      <>
        <Button 
          variant={activeTab === 'overview' ? 'default' : 'outline'} 
          onClick={() => onTabChange('overview')}
          className="gap-2 whitespace-nowrap"
          size="sm"
        >
          <Home className="w-4 h-4" />
          Dashboard
        </Button>
        
        <Button 
          variant={activeTab === 'my-requests' ? 'default' : 'outline'} 
          onClick={() => onTabChange('my-requests')}
          className="gap-2 whitespace-nowrap"
          size="sm"
        >
          <Package className="w-4 h-4" />
          My Requests
        </Button>
        
        <Button 
          variant={activeTab === 'profile' ? 'default' : 'outline'} 
          onClick={() => onTabChange('profile')}
          className="gap-2 whitespace-nowrap"
          size="sm"
        >
          <User className="w-4 h-4" />
          Profile
        </Button>
      </>
    );
  };

  return (
    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
      {renderAdminTabs()}
      {renderAgentTabs()}
      {renderUserTabs()}
    </div>
  );
}
