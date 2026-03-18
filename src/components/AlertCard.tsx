'use client';

import { DashboardAlert } from '@/lib/types';
import { Info, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AlertCardProps {
  alert: DashboardAlert;
  compact?: boolean;
}

const levelConfig = {
  info: { 
    icon: Info,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-900',
    label: 'Info'
  },
  warning: { 
    icon: AlertTriangle,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-900',
    label: 'Warning'
  },
  error: { 
    icon: AlertCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-900',
    label: 'Error'
  },
  success: { 
    icon: CheckCircle2,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderColor: 'border-emerald-200 dark:border-emerald-900',
    label: 'Success'
  },
};

export function AlertCard({ alert, compact = false }: AlertCardProps) {
  const config = levelConfig[alert.level];
  const Icon = config.icon;

  if (compact) {
    return (
      <div className={`flex items-start gap-2.5 p-2.5 rounded-lg border ${config.borderColor} ${config.bgColor} ${alert.acknowledged ? 'opacity-60' : ''}`}>
        <Icon className={`w-4 h-4 ${config.color} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-sm text-foreground truncate">{alert.title}</span>
            {!alert.acknowledged && alert.level === 'error' && (
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">{alert.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border ${config.borderColor} ${config.bgColor} p-4 ${alert.acknowledged ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${config.color} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-foreground">{alert.title}</h3>
            {!alert.acknowledged && alert.level === 'error' && (
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
            {alert.source && (
              <>
                <span className="text-border">•</span>
                <span>{alert.source}</span>
              </>
            )}
            {alert.acknowledged && (
              <>
                <span className="text-border">•</span>
                <span className="text-emerald-600">Acknowledged</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
