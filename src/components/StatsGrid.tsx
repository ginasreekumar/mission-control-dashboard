'use client';

import { Users, CheckCircle2, Clock, AlertCircle, TrendingUp } from 'lucide-react';

interface Stats {
  totalAgents: number;
  activeAgents: number;
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  totalAlerts: number;
  unacknowledgedAlerts: number;
  criticalTasks: number;
}

interface StatsGridProps {
  stats: Stats;
}

export function StatsGrid({ stats }: StatsGridProps) {
  const items = [
    { 
      label: 'Active Agents', 
      value: stats.activeAgents, 
      total: stats.totalAgents,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/30',
      borderColor: 'border-green-200 dark:border-green-900'
    },
    { 
      label: 'In Progress', 
      value: stats.inProgressTasks, 
      total: stats.totalTasks,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      borderColor: 'border-blue-200 dark:border-blue-900'
    },
    { 
      label: 'Completed', 
      value: stats.completedTasks, 
      total: stats.totalTasks,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
      borderColor: 'border-emerald-200 dark:border-emerald-900'
    },
    { 
      label: 'Pending', 
      value: stats.pendingTasks, 
      total: stats.totalTasks,
      icon: TrendingUp,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
      borderColor: 'border-amber-200 dark:border-amber-900'
    },
    { 
      label: 'Alerts', 
      value: stats.unacknowledgedAlerts, 
      total: stats.totalAlerts,
      icon: AlertCircle,
      color: stats.unacknowledgedAlerts > 0 ? 'text-red-600' : 'text-slate-600',
      bgColor: stats.unacknowledgedAlerts > 0 ? 'bg-red-50 dark:bg-red-950/30' : 'bg-slate-50 dark:bg-slate-950/30',
      borderColor: stats.unacknowledgedAlerts > 0 ? 'border-red-200 dark:border-red-900' : 'border-slate-200 dark:border-slate-900'
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className={`relative overflow-hidden rounded-lg border ${item.borderColor} ${item.bgColor} p-3 transition-all hover:shadow-sm`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className={`text-xl font-bold ${item.color}`}>
                    {item.value}
                  </span>
                  {item.total !== undefined && item.total > 0 && (
                    <span className="text-xs text-muted-foreground">
                      /{item.total}
                    </span>
                  )}
                </div>
              </div>
              <Icon className={`w-4 h-4 ${item.color} opacity-60`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
