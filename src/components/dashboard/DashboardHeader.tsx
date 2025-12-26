import { Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DashboardHeaderProps {
  role: string | null;
  profile: any;
  user: any;
  onSignOut: () => void;
}

export function DashboardHeader({ role, profile, user, onSignOut }: DashboardHeaderProps) {
  const getPortalTitle = () => {
    switch (role) {
      case 'admin':
        return 'Admin Portal';
      case 'agent':
        return 'Agent Portal';
      case 'user':
        return 'My Dashboard';
      default:
        return 'Dashboard';
    }
  };

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <img src="/images/Dark.svg" alt="Stazama Logo" className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg">{getPortalTitle()}</span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs sm:text-sm text-muted-foreground max-w-[120px] sm:max-w-none truncate hidden xs:inline">
            {profile?.full_name || profile?.email || user?.email}
          </span>
          <Badge variant="default" className="text-xs py-0.5 px-2">
            {role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User'}
          </Badge>
          <Button variant="ghost" size="icon" onClick={onSignOut} className="w-8 h-8">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
