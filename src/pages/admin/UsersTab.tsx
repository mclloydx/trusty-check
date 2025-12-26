// src/pages/admin/UsersTab.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Shield, 
  User, 
  Mail,
  Calendar
} from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  lastLogin: string;
  isSuperAdmin?: boolean;
}

export function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Mock data - in a real app, this would come from your database
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setUsers([
        {
          id: '1',
          email: 'admin@example.com',
          name: 'John Admin',
          role: 'super_admin',
          status: 'active',
          createdAt: '2025-01-01',
          lastLogin: '2025-12-26',
          isSuperAdmin: true
        },
        {
          id: '2',
          email: 'agent@example.com',
          name: 'Jane Agent',
          role: 'agent',
          status: 'active',
          createdAt: '2025-01-15',
          lastLogin: '2025-12-25'
        },
        {
          id: '3',
          email: 'user@example.com',
          name: 'Bob User',
          role: 'user',
          status: 'active',
          createdAt: '2025-02-01',
          lastLogin: '2025-12-24'
        },
        {
          id: '4',
          email: 'pending@example.com',
          name: 'Alice Pending',
          role: 'user',
          status: 'pending',
          createdAt: '2025-12-20',
          lastLogin: null
        }
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateUserRole = async (userId: string, newRole: string) => {
    console.log(`Updating user ${userId} to role ${newRole}`);
    // In a real app, this would make an API call to update the user role
  };

  const deleteUser = async (userId: string) => {
    console.log(`Deleting user ${userId}`);
    // In a real app, this would make an API call to delete the user
    setUsers(users.filter(user => user.id !== userId));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <div className="flex space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                        <span>{user.name}</span>
                        {user.isSuperAdmin && (
                          <Shield className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'super_admin' ? 'default' : 
                                    user.role === 'agent' ? 'secondary' : 'outline'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'active' ? 'default' : 
                                    user.status === 'inactive' ? 'destructive' : 'secondary'}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{user.createdAt}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.lastLogin ? (
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{user.lastLogin}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          onClick={() => deleteUser(user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}