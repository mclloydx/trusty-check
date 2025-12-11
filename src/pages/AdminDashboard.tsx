import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Shield, 
  LogOut, 
  Home,
  UserCog,
  Loader2,
  UserPlus,
  Trash2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface UserWithRole {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: string;
  created_at: string | null;
}

export default function AdminDashboard() {
  const { user, role, loading, signOut, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    if (!loading && (!user || role !== 'admin')) {
      navigate('/dashboard');
    }
  }, [user, role, loading, navigate]);

  useEffect(() => {
    if (user && role === 'admin') {
      fetchUsers();
    }
  }, [user, role]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      // Fetch all profiles (admin has access via RLS)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles = profiles?.map(p => {
        const userRole = roles?.find(r => r.user_id === p.id);
        return {
          id: p.id,
          email: p.email,
          full_name: p.full_name,
          phone: p.phone,
          role: userRole?.role || 'user',
          created_at: p.created_at,
        };
      }) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole as 'admin' | 'agent' | 'user' })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));

      toast({
        title: "Role updated",
        description: "User role has been updated successfully",
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = {
    totalUsers: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    agents: users.filter(u => u.role === 'agent').length,
    regularUsers: users.filter(u => u.role === 'user').length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <span className="font-bold text-xl">Admin Panel</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {profile?.full_name || profile?.email || user?.email}
            </span>
            <Badge variant="default" className="bg-primary">Admin</Badge>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Users</CardDescription>
              <CardTitle className="text-3xl">{stats.totalUsers}</CardTitle>
            </CardHeader>
            <CardContent>
              <Users className="w-8 h-8 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Admins</CardDescription>
              <CardTitle className="text-3xl">{stats.admins}</CardTitle>
            </CardHeader>
            <CardContent>
              <Shield className="w-8 h-8 text-primary" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Agents</CardDescription>
              <CardTitle className="text-3xl">{stats.agents}</CardTitle>
            </CardHeader>
            <CardContent>
              <UserCog className="w-8 h-8 text-blue-500" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Regular Users</CardDescription>
              <CardTitle className="text-3xl">{stats.regularUsers}</CardTitle>
            </CardHeader>
            <CardContent>
              <UserPlus className="w-8 h-8 text-green-500" />
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage all users and their roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingUsers ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
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
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        {u.full_name || 'N/A'}
                      </TableCell>
                      <TableCell>{u.email || 'N/A'}</TableCell>
                      <TableCell>{u.phone || 'N/A'}</TableCell>
                      <TableCell>
                        <Select
                          value={u.role}
                          onValueChange={(value) => updateUserRole(u.id, value)}
                          disabled={u.id === user?.id}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="agent">Agent</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {u.created_at 
                          ? new Date(u.created_at).toLocaleDateString() 
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {u.id !== user?.id && (
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
