'use client';

import { DashboardAgent } from '@/lib/types';

interface AgentCardProps {
  agent: DashboardAgent;
}

const statusColors = {
  active: 'bg-green-500',
  idle: 'bg-yellow-500',
  busy: 'bg-blue-500',
  offline: 'bg-gray-400',
  error: 'bg-red-500',
};

const statusLabels = {
  active: 'Active',
  idle: 'Idle',
  busy: 'Busy',
  offline: 'Offline',
  error: 'Error',
};

export function AgentCard({ agent }: AgentCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="text-3xl">{agent.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground truncate">{agent.name}</h3>
            <span className={`w-2 h-2 rounded-full ${statusColors[agent.status]}`} />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{statusLabels[agent.status]}</p>
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
        {agent.description}
      </p>
      
      {agent.currentTask && (
        <div className="mt-3 p-2 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">Current task:</p>
          <p className="text-sm text-foreground truncate">{agent.currentTask}</p>
        </div>
      )}
      
      <div className="mt-3 text-xs text-muted-foreground">
        Last activity: {new Date(agent.lastActivity).toLocaleTimeString()}
      </div>
    </div>
  );
}
