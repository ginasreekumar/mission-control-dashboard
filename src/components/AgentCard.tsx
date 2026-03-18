'use client';

import { DashboardAgent } from '@/lib/types';
import { formatRelativeTime } from '@/lib/utils';
import { Activity, Circle } from 'lucide-react';

interface AgentCardProps {
  agent: DashboardAgent;
  compact?: boolean;
}

const statusConfig = {
  active: { 
    color: 'text-green-600', 
    bgColor: 'bg-green-500',
    borderColor: 'border-green-200 dark:border-green-900',
    bg: 'bg-green-50/50 dark:bg-green-950/20',
    label: 'Active'
  },
  idle: { 
    color: 'text-amber-600', 
    bgColor: 'bg-amber-500',
    borderColor: 'border-amber-200 dark:border-amber-900',
    bg: 'bg-amber-50/50 dark:bg-amber-950/20',
    label: 'Idle'
  },
  busy: { 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-500',
    borderColor: 'border-blue-200 dark:border-blue-900',
    bg: 'bg-blue-50/50 dark:bg-blue-950/20',
    label: 'Busy'
  },
  offline: { 
    color: 'text-slate-500', 
    bgColor: 'bg-slate-400',
    borderColor: 'border-slate-200 dark:border-slate-800',
    bg: 'bg-slate-50/50 dark:bg-slate-950/20',
    label: 'Offline'
  },
  error: { 
    color: 'text-red-600', 
    bgColor: 'bg-red-500',
    borderColor: 'border-red-200 dark:border-red-900',
    bg: 'bg-red-50/50 dark:bg-red-950/20',
    label: 'Error'
  },
};

export function AgentCard({ agent, compact = false }: AgentCardProps) {
  const config = statusConfig[agent.status];
  
  if (compact) {
    return (
      <div className={`flex items-center gap-3 p-2.5 rounded-lg border ${config.borderColor} ${config.bg} hover:shadow-sm transition-all`}>
        <div className="relative">
          <span className="text-lg">{agent.emoji}</span>
          <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ${config.bgColor} ring-2 ring-background`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-sm text-foreground truncate">{agent.name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${config.color} bg-background border ${config.borderColor}`}>
              {config.label}
            </span>
          </div>
          {agent.currentTask && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{agent.currentTask}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`group rounded-lg border ${config.borderColor} ${config.bg} p-4 hover:shadow-sm transition-all`}>
      <div className="flex items-start gap-3">
        <div className="relative">
          <span className="text-2xl">{agent.emoji}</span>
          <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${config.bgColor} ring-2 ring-background`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground truncate">{agent.name}</h3>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${config.color} bg-background border ${config.borderColor}`}>
              {config.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{agent.description}</p>
        </div>
      </div>
      
      {agent.currentTask && (
        <div className="mt-3 p-2 bg-background/80 rounded-md border border-border/50">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Activity className="w-3 h-3" />
            <span>Current task</span>
          </div>
          <p className="text-sm text-foreground mt-0.5 truncate">{agent.currentTask}</p>
        </div>
      )}
      
      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Circle className="w-2 h-2" />
        <span>{formatRelativeTime(agent.lastActivity)}</span>
      </div>
    </div>
  );
}
