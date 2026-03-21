import { promises as fs } from 'fs';
import { join } from 'path';
import type { Task, TasksData, Column, Recurrence } from './tasks';

const DATA_DIR = process.env.MISSION_CONTROL_DATA || '/home/siju/WORK/GINA/mission-control/data';
const TASKS_FILE = join(DATA_DIR, 'tasks.json');

export async function readTasks(): Promise<TasksData> {
  try {
    const data = await fs.readFile(TASKS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    // Migrate old tasks with string assigned_to to array
    if (parsed.tasks) {
      parsed.tasks = parsed.tasks.map((t: any) => ({
        ...t,
        assigned_to: Array.isArray(t.assigned_to) 
          ? t.assigned_to 
          : t.assigned_to ? [t.assigned_to] : [],
      }));
    }
    return parsed;
  } catch (error) {
    return { tasks: [], columns: [] };
  }
}

export async function writeTasks(data: TasksData): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(TASKS_FILE, JSON.stringify(data, null, 2));
}

export async function getTaskById(id: string): Promise<Task | null> {
  const data = await readTasks();
  return data.tasks.find(t => t.id === id) || null;
}

export async function createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
  const data = await readTasks();
  const newTask: Task = {
    ...task,
    id: `task-${Date.now().toString(36)}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    assigned_to: task.assigned_to || [],
  };
  data.tasks.push(newTask);
  await writeTasks(data);
  return newTask;
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
  const data = await readTasks();
  const index = data.tasks.findIndex(t => t.id === id);
  if (index === -1) return null;
  
  data.tasks[index] = {
    ...data.tasks[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  await writeTasks(data);
  return data.tasks[index];
}

export async function deleteTask(id: string): Promise<boolean> {
  const data = await readTasks();
  const index = data.tasks.findIndex(t => t.id === id);
  if (index === -1) return false;
  
  data.tasks.splice(index, 1);
  await writeTasks(data);
  return true;
}

export async function claimTask(taskId: string, agent: string): Promise<Task | null> {
  const task = await getTaskById(taskId);
  if (!task) return null;
  
  // Allow claim if: unassigned, or agent is in assigned_to list, or assigned_to is empty
  const canClaim = !task.assigned_to || 
                   (task.assigned_to || []).length === 0 || 
                   task.assigned_to.includes(agent);
  
  if (!canClaim) return null;
  
  // Add agent to assigned_to if not already there
  const newAssigned = task.assigned_to?.includes(agent) 
    ? task.assigned_to 
    : [...(task.assigned_to || []), agent];
  
  return updateTask(taskId, {
    assigned_to: newAssigned,
    status: 'in_progress',
  });
}

export async function unclaimTask(taskId: string, agent: string): Promise<Task | null> {
  const task = await getTaskById(taskId);
  if (!task) return null;
  
  const newAssigned = task.assigned_to?.filter(a => a !== agent) || [];
  
  return updateTask(taskId, {
    assigned_to: newAssigned,
    status: newAssigned.length === 0 ? 'backlog' : task.status,
  });
}

// Calculate next run time based on recurrence
function calculateNextRun(recurrence: Recurrence, fromDate: Date = new Date()): string {
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
    case 'cron':
      // For cron, we'd need a cron parser - default to +1 day for now
      next.setDate(next.getDate() + 1);
      break;
    default:
      next.setDate(next.getDate() + 1);
  }
  
  return next.toISOString();
}

// Complete a task and create next instance if recurring
export async function completeTask(taskId: string): Promise<{ task: Task | null; nextInstance?: Task }> {
  const task = await getTaskById(taskId);
  if (!task) return { task: null };
  
  const updated = await updateTask(taskId, {
    status: 'done',
    last_run: new Date().toISOString(),
  });
  
  if (!updated) return { task: null };
  
  // Create next instance if recurring
  if (task.is_recurring && task.recurrence) {
    const nextRun = calculateNextRun(task.recurrence, new Date());
    const nextInstance = await createTask({
      title: task.title,
      description: task.description,
      status: 'backlog',
      priority: task.priority,
      assigned_to: task.assigned_to,
      created_by: task.created_by,
      tags: task.tags,
      is_recurring: true,
      recurrence: task.recurrence,
      next_run: nextRun,
    });
    return { task: updated, nextInstance };
  }
  
  return { task: updated };
}

// Get cron jobs from system crontab
export async function getCronJobs(): Promise<Array<{
  schedule: string;
  command: string;
  comment?: string;
  agent?: string;
}>> {
  try {
    const { execSync } = require('child_process');
    const output = execSync('crontab -l 2>/dev/null || echo ""', { encoding: 'utf-8' });
    const lines = output.split('\n');
    const jobs: Array<{ schedule: string; command: string; comment?: string; agent?: string }> = [];
    let lastComment = '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        if (trimmed.startsWith('#')) {
          lastComment = trimmed.slice(1).trim();
        }
        continue;
      }
      
      // Parse cron line: schedule command
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 6) {
        const schedule = parts.slice(0, 5).join(' ');
        const command = parts.slice(5).join(' ');
        const agentMatch = command.match(/(geordi|finch|r00t|gina)/);
        jobs.push({
          schedule,
          command,
          comment: lastComment,
          agent: agentMatch?.[0],
        });
        lastComment = '';
      }
    }
    
    return jobs;
  } catch {
    return [];
  }
}
