export interface Recurrence {
  type: 'daily' | 'weekly' | 'cron' | 'interval';
  cron_expr?: string;
  interval_hours?: number;
  time_of_day?: string; // HH:MM format
  days_of_week?: number[]; // 0-6, Sunday = 0
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'backlog' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to: string[];  // Changed to array for multiple agents
  created_by: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  due_date?: string;
  // Recurring task fields
  is_recurring?: boolean;
  recurrence?: Recurrence;
  last_run?: string;
  next_run?: string;
}

export interface AgentStatus {
  agent: string;
  status: 'idle' | 'working' | 'error';
  current_task: string | null;
  last_update: string;
  task_id: string | null;
}

export interface Column {
  id: string;
  title: string;
  order: number;
}

export interface TasksData {
  tasks: Task[];
  columns: Column[];
}

// Helper to format recurrence for display
export function formatRecurrence(recurrence?: Recurrence): string {
  if (!recurrence) return '';
  
  switch (recurrence.type) {
    case 'daily':
      return `Daily at ${recurrence.time_of_day || '9:00'}`;
    case 'weekly':
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayNames = recurrence.days_of_week?.map(d => days[d]).join(', ') || 'Mon';
      return `Weekly on ${dayNames}`;
    case 'cron':
      return `Cron: ${recurrence.cron_expr}`;
    case 'interval':
      return `Every ${recurrence.interval_hours} hours`;
    default:
      return '';
  }
}

// Calculate next run time based on recurrence
export function calculateNextRun(recurrence: Recurrence, fromDate: Date = new Date()): string {
  const next = new Date(fromDate);
  
  switch (recurrence.type) {
    case 'daily':
      const [hours, minutes] = (recurrence.time_of_day || '09:00').split(':').map(Number);
      next.setDate(next.getDate() + 1);
      next.setHours(hours, minutes, 0, 0);
      break;
    case 'weekly':
      const targetDay = recurrence.days_of_week?.[0] || 1;
      const daysUntil = (targetDay - next.getDay() + 7) % 7 || 7;
      next.setDate(next.getDate() + daysUntil);
      break;
    case 'interval':
      next.setHours(next.getHours() + (recurrence.interval_hours || 24));
      break;
    default:
      next.setDate(next.getDate() + 1);
  }
  
  return next.toISOString();
}
