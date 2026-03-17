'use client';

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
    { label: 'Active Agents', value: stats.activeAgents, total: stats.totalAgents, color: 'text-green-600' },
    { label: 'Tasks Pending', value: stats.pendingTasks, total: stats.totalTasks, color: 'text-yellow-600' },
    { label: 'In Progress', value: stats.inProgressTasks, total: stats.totalTasks, color: 'text-blue-600' },
    { label: 'Completed', value: stats.completedTasks, total: stats.totalTasks, color: 'text-green-600' },
    { label: 'Critical Tasks', value: stats.criticalTasks, color: 'text-red-600' },
    { label: 'Unacknowledged Alerts', value: stats.unacknowledgedAlerts, total: stats.totalAlerts, color: 'text-orange-600' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-card rounded-xl border border-border p-4 text-center"
        >
          <div className={`text-2xl font-bold ${item.color}`}>
            {item.value}
            {item.total !== undefined && (
              <span className="text-sm text-muted-foreground font-normal">
                /{item.total}
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
