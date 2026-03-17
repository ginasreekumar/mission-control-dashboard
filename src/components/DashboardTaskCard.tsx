'use client';

import { DashboardTask } from '@/lib/types';

interface DashboardTaskCardProps {
  task: DashboardTask;
}

const statusColors = {
  pending: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30',
  'in-progress': 'bg-blue-500/20 text-blue-700 border-blue-500/30',
  completed: 'bg-green-500/20 text-green-700 border-green-500/30',
  blocked: 'bg-red-500/20 text-red-700 border-red-500/30',
};

const statusLabels = {
  pending: 'Pending',
  'in-progress': 'In Progress',
  completed: 'Completed',
  blocked: 'Blocked',
};

const priorityColors = {
  low: 'text-muted-foreground',
  medium: 'text-blue-600',
  high: 'text-orange-600',
  critical: 'text-red-600 font-semibold',
};

export function DashboardTaskCard({ task }: DashboardTaskCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-foreground text-sm line-clamp-2 flex-1">
          {task.title}
        </h3>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[task.status]}`}>
          {statusLabels[task.status]}
        </span>
      </div>
      
      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
        {task.description}
      </p>
      
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          {task.agentName && (
            <span className="text-xs bg-muted px-2 py-1 rounded">
              {task.agentName}
            </span>
          )}
          <span className={`text-xs ${priorityColors[task.priority]}`}>
            {task.priority.toUpperCase()}
          </span>
        </div>
      </div>
      
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {task.tags.map(tag => (
            <span key={tag} className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
