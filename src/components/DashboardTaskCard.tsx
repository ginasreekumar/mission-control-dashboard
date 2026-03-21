'use client';

import { useState } from 'react';
import { DashboardTask } from '@/lib/types';
import { TaskAssignmentModal } from '@/components/TaskAssignmentModal';
import { TaskTransitionActions } from '@/components/TaskTransitionActions';
import { ArrowRight, Tag, FolderKanban, Edit2 } from 'lucide-react';

interface DashboardTaskCardProps {
  task: DashboardTask;
  projects?: Array<{ id: string; name: string; description: string; status: 'active' | 'paused' | 'completed' | 'archived' }>;
  agents?: Array<{ id: string; name: string; emoji: string; status: 'active' | 'idle' | 'busy' | 'offline' | 'error' }>;
  onUpdate?: () => void;
  currentAgent?: string;
}

const statusConfig = {
  pending: { 
    label: 'Pending',
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-950/50',
    borderColor: 'border-amber-200 dark:border-amber-900'
  },
  'in-progress': { 
    label: 'In Progress',
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-950/50',
    borderColor: 'border-blue-200 dark:border-blue-900'
  },
  completed: { 
    label: 'Completed',
    color: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-950/50',
    borderColor: 'border-emerald-200 dark:border-emerald-900'
  },
  blocked: { 
    label: 'Blocked',
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-950/50',
    borderColor: 'border-red-200 dark:border-red-900'
  },
};

const priorityConfig = {
  low: { color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-900' },
  medium: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-950/50' },
  high: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-950/50' },
  critical: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-950/50' },
};

export function DashboardTaskCard({ task, projects = [], agents = [], onUpdate, currentAgent = 'gina' }: DashboardTaskCardProps) {
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const status = statusConfig[task.status];
  const priority = priorityConfig[task.priority];

  return (
    <>
      <div className="group rounded-lg border border-border bg-card p-3.5 hover:shadow-sm hover:border-border/80 transition-all">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-sm text-foreground line-clamp-2 flex-1">
            {task.title}
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="p-1 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
              title="Assign task"
            >
              <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${status.borderColor} ${status.bgColor} ${status.color} whitespace-nowrap`}>
              {status.label}
            </span>
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
          {task.description}
        </p>
        
        {/* Project badge */}
        {task.projectName && (
          <div className="flex items-center gap-1 mt-2">
            <FolderKanban className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">{task.projectName}</span>
          </div>
        )}
        
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            {task.agentName && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                {task.agentName}
              </span>
            )}
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${priority.bg} ${priority.color}`}>
              {task.priority}
            </span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Task Transition Actions */}
        <div className="mt-3 pt-3 border-t border-border/50">
          <TaskTransitionActions 
            task={task} 
            currentAgent={currentAgent}
            onUpdate={onUpdate}
            compact
          />
        </div>
        
        {task.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-border/50">
            {task.tags.slice(0, 3).map(tag => (
              <span key={tag} className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <Tag className="w-2.5 h-2.5" />
                {tag}
              </span>
            ))}
            {task.tags?.length > 3 && (
              <span className="text-[10px] text-muted-foreground">+{task.tags?.length - 3}</span>
            )}
          </div>
        )}
      </div>

      <TaskAssignmentModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        task={task}
        projects={projects}
        agents={agents}
        onSuccess={() => {
          setIsAssignModalOpen(false);
          onUpdate?.();
        }}
      />
    </>
  );
}
