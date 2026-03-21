'use client';

import { useState } from 'react';
import { DashboardTask } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  CheckCircle2, 
  UserPlus, 
  UserMinus, 
  Loader2,
  AlertCircle
} from 'lucide-react';

interface TaskTransitionActionsProps {
  task: DashboardTask;
  currentAgent?: string;
  onUpdate?: () => void;
  compact?: boolean;
}

type TransitionAction = 'claim' | 'start' | 'complete' | 'unclaim';

interface ActionConfig {
  label: string;
  icon: React.ReactNode;
  variant: 'default' | 'outline' | 'ghost' | 'secondary';
  className?: string;
}

const actionConfig: Record<TransitionAction, ActionConfig> = {
  claim: {
    label: 'Claim',
    icon: <UserPlus className="w-3.5 h-3.5" />,
    variant: 'outline',
    className: 'border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/50',
  },
  start: {
    label: 'Start',
    icon: <Play className="w-3.5 h-3.5" />,
    variant: 'default',
    className: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  complete: {
    label: 'Complete',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    variant: 'default',
    className: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  unclaim: {
    label: 'Unclaim',
    icon: <UserMinus className="w-3.5 h-3.5" />,
    variant: 'ghost',
    className: 'text-muted-foreground hover:text-foreground',
  },
};

export function TaskTransitionActions({ 
  task, 
  currentAgent = 'gina',
  onUpdate,
  compact = false 
}: TaskTransitionActionsProps) {
  const [loading, setLoading] = useState<TransitionAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getAvailableActions = (): TransitionAction[] => {
    const actions: TransitionAction[] = [];
    const isAssigned = task.agentId === currentAgent;

    switch (task.status) {
      case 'pending':
        if (!task.agentId) {
          actions.push('claim');
        } else if (isAssigned) {
          actions.push('start');
          actions.push('unclaim');
        }
        break;
      case 'in-progress':
        if (isAssigned) {
          actions.push('complete');
          actions.push('unclaim');
        }
        break;
      case 'completed':
        break;
      case 'blocked':
        if (isAssigned) {
          actions.push('unclaim');
        }
        break;
    }

    return actions;
  };

  const availableActions = getAvailableActions();

  if (availableActions.length === 0) {
    return null;
  }

  const handleAction = async (action: TransitionAction) => {
    setLoading(action);
    setError(null);

    try {
      const res = await fetch('/api/tasks/transition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: task.id,
          agent: currentAgent,
          action,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to ${action} task`);
      }

      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-2">
      {error && (
        <div className="flex items-center gap-1.5 text-[10px] text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400 px-2 py-1 rounded">
          <AlertCircle className="w-3 h-3" />
          {error}
        </div>
      )}
      
      <div className={`flex items-center gap-1.5 ${compact ? 'flex-wrap' : ''}`}>
        {availableActions.map((action) => {
          const config = actionConfig[action];
          const isLoading = loading === action;

          return (
            <Button
              key={action}
              size="sm"
              variant={config.variant}
              onClick={() => handleAction(action)}
              disabled={loading !== null}
              className={`h-7 px-2.5 text-xs gap-1 ${config.className || ''}`}
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                config.icon
              )}
              {!compact && config.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
