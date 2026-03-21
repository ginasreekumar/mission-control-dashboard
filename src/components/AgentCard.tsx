'use client';

import { DashboardAgent } from '@/lib/types';
import { formatRelativeTime, getStalenessInfo } from '@/lib/utils';
import { Activity, Circle, WifiOff, AlertTriangle } from 'lucide-react';

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
  const staleness = getStalenessInfo(agent.lastActivity);
  
  // Determine effective status display
  // If data is stale (>5 min old), show stale indicator even if status says "active"
  const isStale = staleness.isStale;
  const isVeryStale = staleness.isVeryStale;
  
  // Override display for stale data - show the real situation
  const displayStatus = isVeryStale ? 'stale' : isStale ? 'stale-warning' : agent.status;
  
  if (compact) {
    return (
      <div className={`flex items-center gap-3 p-2.5 rounded-lg border ${config.borderColor} ${config.bg} hover:shadow-sm transition-all relative`}>
        {/* Stale indicator overlay */}
        {isVeryStale && (
          <div className="absolute inset-0 bg-slate-100/60 dark:bg-slate-900/60 rounded-lg flex items-center justify-center">
            <span className="flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded-full">
              <WifiOff className="w-3 h-3" />
              Stale
            </span>
          </div>
        )}
        
        <div className="relative">
          <span className="text-lg">{agent.emoji}</span>
          <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ${config.bgColor} ring-2 ring-background`} />
          {/* Stale warning dot */}
          {isStale && !isVeryStale && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-background" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-sm text-foreground truncate">{agent.name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${config.color} bg-background border ${config.borderColor}`}>
              {config.label}
            </span>
            {/* Stale warning badge */}
            {isStale && !isVeryStale && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full text-amber-600 bg-amber-100 dark:bg-amber-950 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="w-3 h-3 inline mr-0.5" />
                {staleness.label}
              </span>
            )}
          </div>
          {agent.currentTask && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{agent.currentTask}</p>
          )}
          {/* Always show freshness info */}
          <p className={`text-[10px] mt-0.5 ${staleness.textColor}`}>
            {staleness.icon} {staleness.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`group rounded-lg border ${config.borderColor} ${config.bg} p-4 hover:shadow-sm transition-all relative`}>
      {/* Stale overlay for very stale data */}
      {isVeryStale && (
        <div className="absolute inset-0 bg-slate-100/70 dark:bg-slate-900/70 rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <WifiOff className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Agent Offline</span>
            <p className="text-xs text-slate-500 mt-1">No updates for {staleness.message}</p>
          </div>
        </div>
      )}
      
      <div className="flex items-start gap-3">
        <div className="relative">
          <span className="text-2xl">{agent.emoji}</span>
          <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${config.bgColor} ring-2 ring-background`} />
          {/* Stale warning indicator */}
          {isStale && !isVeryStale && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-500 ring-2 ring-background flex items-center justify-center">
              <AlertTriangle className="w-2 h-2 text-white" />
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-foreground truncate">{agent.name}</h3>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${config.color} bg-background border ${config.borderColor}`}>
              {config.label}
            </span>
            {/* Stale warning badge */}
            {isStale && !isVeryStale && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full text-amber-700 bg-amber-100 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {staleness.label}
              </span>
            )}
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
      
      {/* Freshness indicator - always visible */}
      <div className={`mt-3 flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-md ${staleness.bgColor}`}>
        <Circle className={`w-2 h-2 ${staleness.dotColor}`} />
        <span className={staleness.textColor}>{staleness.message}</span>
      </div>
    </div>
  );
}
