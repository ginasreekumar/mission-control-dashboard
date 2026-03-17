'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, formatRecurrence } from '@/lib/tasks';
import { Calendar, Repeat, Users } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
}

const priorityColors = {
  low: 'border-l-blue-400',
  medium: 'border-l-yellow-400',
  high: 'border-l-orange-400',
  urgent: 'border-l-red-500',
};

export function TaskCard({ task, isDragging }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dragging = isDragging || isSortableDragging;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        bg-card p-4 rounded-lg border border-border border-l-4 ${priorityColors[task.priority]}
        shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing
        ${dragging ? 'opacity-50 rotate-2 shadow-xl' : ''}
      `}
    >
      <h3 className="font-semibold text-foreground text-sm mb-2">{task.title}</h3>
      
      {task.description && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {task.description}
        </p>
      )}
      
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {task.assigned_to?.length > 0 && (
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{task.assigned_to.join(', ')}</span>
          </div>
        )}
        
        {task.due_date && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{new Date(task.due_date).toLocaleDateString()}</span>
          </div>
        )}
        
        {task.is_recurring && task.recurrence && (
          <div className="flex items-center gap-1 text-blue-500">
            <Repeat className="h-3 w-3" />
            <span>{formatRecurrence(task.recurrence)}</span>
          </div>
        )}
      </div>
      
      {task.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
