'use client';

import { DashboardAgent } from '@/lib/types';
import { formatRelativeTime, getStalenessInfo } from '@/lib/utils';
import { Activity, Clock } from 'lucide-react';

interface AgentCardProps {
  agent: DashboardAgent;
  compact?: boolean;
}

// Agent state configuration - ONLY for actual agent status
const stateConfig = {
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
    label: 'Working'
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

// Freshness indicator - subtle, secondary info
function FreshnessIndicator({ lastActivity }: { lastActivity: string }) {
  const staleness = getStalenessInfo(lastActivity);
  
  // Only show freshness indicator if data is stale (>5 min)
  if (!staleness.isStale) {
    return null;
  }
  
  return (
    <span className={`text-[10px] flex items-center gap-1 ${staleness.textColor}`}>
      <Clock className="w-3 h-3" />
      {staleness.message}
    </span>
  );
}

export function AgentCard({ agent, compact = false }: AgentCardProps) {
  const config = stateConfig[agent.status];
  
  // Only show offline overlay if agent state is actually offline
  const isActuallyOffline = agent.status === 'offline';
  
  if (compact) {
    return (
      <div className={`flex items-center gap-3 p-2.5 rounded-lg border ${config.borderColor} ${config.bg} hover:shadow-sm transition-all`}>
        <div className="relative flex-shrink-0">
          <span className="text-lg">{agent.emoji}</span>
          {/* Primary status dot - shows actual agent state */}
          <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ${config.bgColor} ring-2 ring-background`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-foreground truncate">{agent.name}</span>
            {/* Primary status badge - small and clear */}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${config.color} bg-background border ${config.borderColor}`}>
              {config.label}
            </span>
          </div>
          {agent.currentTask && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{agent.currentTask}</p>
          )}
          {/* Freshness info - subtle, secondary */}
          <div className="mt-0.5">
            <FreshnessIndicator lastActivity={agent.lastActivity} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`group rounded-lg border ${config.borderColor} ${config.bg} p-4 hover:shadow-sm transition-all relative`}>
      {/* Only show big overlay if agent is actually offline */}
      {isActuallyOffline && (
        <div className="absolute inset-0 bg-slate-100/70 dark:bg-slate-900/70 rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Agent Offline</span>
            <p className="text-xs text-slate-500 mt-1">
              <FreshnessIndicator lastActivity={agent.lastActivity} />
            </p>
          </div>
        </div>
      )}
      
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <span className="text-2xl">{agent.emoji}</span>
          {/* Primary status dot - shows actual agent state */}
          <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${config.bgColor} ring-2 ring-background`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-foreground truncate">{agent.name}</h3>
            {/* Primary status badge - small and clear */}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${config.color} bg-background border ${config.borderColor}`}>
              {config.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{agent.description}</p>
          {/* Freshness info - subtle, secondary */}
          <div className="mt-1">
            <FreshnessIndicator lastActivity={agent.lastActivity} />
          </div>
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
    </div>
  );
}
