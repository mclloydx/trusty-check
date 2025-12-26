import { useState, useMemo } from 'react';
import { Loader2, Shield, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Agent } from '@/types/dashboard';

interface AgentsManagementTabProps {
  agents: Agent[];
  loadingAgents: boolean;
}

export function AgentsManagementTab({ agents, loadingAgents }: AgentsManagementTabProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAgents = useMemo(() => {
    if (!searchQuery.trim()) return agents;
    
    const query = searchQuery.toLowerCase().trim();
    return agents.filter(agent => 
      agent.full_name?.toLowerCase().includes(query) ||
      agent.email?.toLowerCase().includes(query)
    );
  }, [agents, searchQuery]);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex gap-2 mb-4 sm:mb-6">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3 h-3 sm:w-4 sm:h-4" />
                <Input
                  placeholder="Search agents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 sm:pl-10 h-8 sm:h-10 text-sm"
                />
              </div>
            </div>
          </div>
          {loadingAgents ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No agents found</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-4">
              {filteredAgents.map(agent => (
                <div key={agent.id} className="bg-card border rounded-lg p-3 sm:p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold truncate flex-1 mr-2 text-sm sm:text-base">{agent.full_name || 'Unknown'}</h3>
                    <Badge variant="secondary" className="text-xs px-1 sm:px-2 py-1 flex-shrink-0">Agent</Badge>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-xs sm:text-sm mb-3">
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <div className="truncate">{agent.email || 'Not set'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
