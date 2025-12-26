import { useState, useMemo } from 'react';
import { Loader2, UserCog, Search, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserWithRole } from '@/types/dashboard';
import { UserRole as SupabaseUserRole } from '@/integrations/supabase/roleTypes';
import { roleService } from '@/integrations/supabase/roleService';

type UserFilter = 'all' | 'admin' | 'agent' | 'user';

interface UsersTabProps {
  users: UserWithRole[];
  loadingUsers: boolean;
  currentUserId: string | undefined;
  onUsersUpdate: (users: UserWithRole[]) => void;
}

export function UsersTab({ users, loadingUsers, currentUserId, onUsersUpdate }: UsersTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState<UserFilter>('all');

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!currentUserId) return;
    
    try {
      await roleService.updateUserRole(currentUserId, userId, newRole as SupabaseUserRole);
      onUsersUpdate(users.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const filteredUsers = useMemo(() => {
    let filtered = users;
    
    // Apply role filter
    if (userFilter !== 'all') {
      filtered = filtered.filter(user => user.role === userFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(user => 
        user.full_name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.phone?.toLowerCase().includes(query) ||
        user.role?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [users, userFilter, searchQuery]);

  return (
    <Card>
      <CardContent className="pt-4 sm:pt-6">
        <div className="flex gap-2 mb-4 sm:mb-6">
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3 h-3 sm:w-4 sm:h-4" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 sm:pl-10 h-8 sm:h-10 text-sm"
              />
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2 flex-shrink-0 h-8 sm:h-10 px-2 sm:px-3">
                <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline text-xs sm:text-sm">
                  {userFilter === 'all' && 'All Roles'}
                  {userFilter === 'admin' && 'Admins'}
                  {userFilter === 'agent' && 'Agents'}
                  {userFilter === 'user' && 'Users'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-xs sm:text-sm">
              <DropdownMenuItem onClick={() => setUserFilter('all')}>
                All Roles
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setUserFilter('admin')}>
                Admins
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setUserFilter('agent')}>
                Agents
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setUserFilter('user')}>
                Users
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {loadingUsers ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <UserCog className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No users found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((userItem) => (
                    <TableRow key={userItem.id}>
                      <TableCell className="font-medium">
                        {userItem.full_name || 'Not set'}
                      </TableCell>
                      <TableCell>{userItem.email || 'Not set'}</TableCell>
                      <TableCell>{userItem.phone || 'Not set'}</TableCell>
                      <TableCell>
                        <Badge variant={userItem.role === 'admin' ? 'default' : 'secondary'}>
                          {userItem.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {userItem.created_at ? new Date(userItem.created_at).toLocaleDateString() : 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={userItem.role}
                          onValueChange={(newRole) => handleRoleChange(userItem.id, newRole)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="agent">Agent</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden space-y-3">
              {filteredUsers.map((userItem) => (
                <div key={userItem.id} className="bg-card border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold truncate flex-1 mr-2 text-sm">{userItem.full_name || 'Not set'}</h3>
                    <Badge variant={userItem.role === 'admin' ? 'default' : 'secondary'} className="text-xs px-1 py-1 flex-shrink-0">
                      {userItem.role}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-xs mb-3">
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <div className="truncate">{userItem.email || 'Not set'}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span>
                      <div className="truncate">{userItem.phone || 'Not set'}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Joined:</span>
                      <div className="truncate">{userItem.created_at ? new Date(userItem.created_at).toLocaleDateString() : 'Unknown'}</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <div className="text-xs text-muted-foreground truncate flex-1">
                      Role: {userItem.role}
                    </div>
                    <Select
                      value={userItem.role}
                      onValueChange={(newRole) => handleRoleChange(userItem.id, newRole)}
                    >
                      <SelectTrigger className="w-28 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
