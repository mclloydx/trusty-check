import { useState, useMemo } from 'react';
import { Loader2, Users, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Client } from '@/types/dashboard';

interface ClientsTabProps {
  clients: Client[];
  loadingClients: boolean;
}

export function ClientsTab({ clients, loadingClients }: ClientsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    
    const query = searchQuery.toLowerCase().trim();
    return clients.filter(client => 
      client.full_name?.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query) ||
      client.phone?.toLowerCase().includes(query) ||
      client.address?.toLowerCase().includes(query)
    );
  }, [clients, searchQuery]);

  return (
    <Card>
      <CardContent className="pt-4 sm:pt-6">
        <div className="flex gap-2 mb-4 sm:mb-6">
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3 h-3 sm:w-4 sm:h-4" />
              <Input
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 sm:pl-10 h-8 sm:h-10 text-sm"
              />
            </div>
          </div>
        </div>
        {loadingClients ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No clients found</p>
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
                    <TableHead>Address</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        {client.full_name || 'Not set'}
                      </TableCell>
                      <TableCell>{client.email || 'Not set'}</TableCell>
                      <TableCell>{client.phone || 'Not set'}</TableCell>
                      <TableCell>{client.address || 'Not set'}</TableCell>
                      <TableCell>
                        {client.created_at ? new Date(client.created_at).toLocaleDateString() : 'Unknown'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden space-y-3">
              {filteredClients.map((client) => (
                <div key={client.id} className="bg-card border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold truncate flex-1 mr-2 text-sm">{client.full_name || 'Not set'}</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-xs mb-3">
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <div className="truncate">{client.email || 'Not set'}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span>
                      <div className="truncate">{client.phone || 'Not set'}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Address:</span>
                      <div className="truncate">{client.address || 'Not set'}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Joined:</span>
                      <div className="truncate">{client.created_at ? new Date(client.created_at).toLocaleDateString() : 'Unknown'}</div>
                    </div>
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
