/**
 * Live Data Module for Mission Control Dashboard
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { DashboardAgent, DashboardTask, DashboardAlert, DashboardData } from './types';

const MISSION_CONTROL_DIR = process.env.MISSION_CONTROL_DIR || '/home/siju/WORK/GINA/mission-control';
const STATUS_DIR = process.env.MISSION_CONTROL_STATUS || join(MISSION_CONTROL_DIR, 'status');
const TASKS_FILE = process.env.MISSION_CONTROL_TASKS || join(MISSION_CONTROL_DIR, 'data/tasks.json');
const TASKS_LOG = process.env.MISSION_CONTROL_TASKS_LOG || join(MISSION_CONTROL_DIR, 'tasks.jsonl');
const DISABLE_FILESYSTEM = process.env.DISABLE_FILESYSTEM === 'true';

const AGENT_METADATA: Record<string, { name: string; emoji: string; description: string }> = {
  gina: { name: 'Gina', emoji: '🌟', description: 'Main orchestrator. Coordinates all agents and reports to Srijit.' },
  finch: { name: 'Finch', emoji: '🔍', description: 'Research specialist. Gathers information and analyzes data.' },
  geordi: { name: 'Geordi', emoji: '🔧', description: 'Builder and tool creator. Handles coding and implementation tasks.' },
  r00t: { name: 'R00t', emoji: '📡', description: 'Signal hunter and monitor. Watches for alerts and opportunities.' },
};

interface AgentStatusFile {
  agent: string;
  status: 'idle' | 'working' | 'error';
  current_task: string | null;
  last_update: string;
  task_id: string | null;
}

interface TaskFile {
  id: string;
  title: string;
  description: string;
  status: 'backlog' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigned_to: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  tags: string[];
}

interface TasksDataFile {
  tasks: TaskFile[];
  columns: Array<{ id: string; title: string; order: number }>;
}

interface TaskLogEntry {
  timestamp: string;
  agent: string;
  task: string;
  status: 'pending' | 'in-progress' | 'done' | 'error';
  result?: string;
}

function isFilesystemAvailable(): boolean {
  if (DISABLE_FILESYSTEM) return false;
  return !process.env.VERCEL && !process.env.NETLIFY;
}

async function readAgentStatuses(): Promise<AgentStatusFile[]> {
  if (!isFilesystemAvailable()) return [];
  try {
    const files = await fs.readdir(STATUS_DIR);
    const statuses: AgentStatusFile[] = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const data = await fs.readFile(join(STATUS_DIR, file), 'utf-8');
          statuses.push(JSON.parse(data));
        } catch (e) {}
      }
    }
    return statuses;
  } catch (error) {
    return [];
  }
}

async function readTasksFromJson(): Promise<TaskFile[]> {
  if (!isFilesystemAvailable()) return [];
  try {
    const data = await fs.readFile(TASKS_FILE, 'utf-8');
    const parsed: TasksDataFile = JSON.parse(data);
    return parsed.tasks || [];
  } catch (error) {
    return [];
  }
}

async function readTasksLog(): Promise<TaskLogEntry[]> {
  if (!isFilesystemAvailable()) return [];
  try {
    const data = await fs.readFile(TASKS_LOG, 'utf-8');
    const lines = data.split('\n').filter(line => line.trim());
    const entries: TaskLogEntry[] = [];
    for (const line of lines.slice(-50)) {
      try {
        entries.push(JSON.parse(line));
      } catch (e) {}
    }
    return entries;
  } catch (error) {
    return [];
  }
}

function transformAgentStatus(status: AgentStatusFile): DashboardAgent {
  const meta = AGENT_METADATA[status.agent] || {
    name: status.agent.charAt(0).toUpperCase() + status.agent.slice(1),
    emoji: '🤖',
    description: 'Agent',
  };
  const statusMap: Record<string, DashboardAgent['status']> = {
    'idle': 'idle',
    'working': 'active',
    'error': 'error',
  };
  return {
    id: status.agent,
    name: meta.name,
    emoji: meta.emoji,
    status: statusMap[status.status] || 'offline',
    currentTask: status.current_task || undefined,
    lastActivity: status.last_update,
    description: meta.description,
  };
}

function transformTask(task: TaskFile): DashboardTask {
  const statusMap: Record<string, DashboardTask['status']> = {
    'backlog': 'pending',
    'in_progress': 'in-progress',
    'review': 'in-progress',
    'done': 'completed',
  };
  const priorityMap: Record<string, DashboardTask['priority']> = {
    'low': 'low',
    'medium': 'medium',
    'high': 'high',
    'critical': 'critical',
  };
  const agentId = task.assigned_to?.[0];
  const agentMeta = agentId ? AGENT_METADATA[agentId] : undefined;
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: statusMap[task.status] || 'pending',
    priority: priorityMap[task.priority] || 'medium',
    agentId: agentId,
    agentName: agentMeta?.name,
    createdAt: task.created_at,
    updatedAt: task.updated_at,
    tags: task.tags || [],
  };
}

function generateAlertsFromLog(entries: TaskLogEntry[]): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];
  const recentEntries = entries.slice(-10).reverse();
  for (const entry of recentEntries) {
    let level: DashboardAlert['level'] = 'info';
    let title = '';
    let message = '';
    switch (entry.status) {
      case 'done':
        level = 'success';
        title = `${AGENT_METADATA[entry.agent]?.name || entry.agent} completed task`;
        message = entry.task;
        break;
      case 'error':
        level = 'error';
        title = `${AGENT_METADATA[entry.agent]?.name || entry.agent} encountered an error`;
        message = entry.task;
        break;
      case 'in-progress':
        level = 'info';
        title = `${AGENT_METADATA[entry.agent]?.name || entry.agent} started task`;
        message = entry.task;
        break;
      default:
        continue;
    }
    alerts.push({
      id: `alert-${entry.timestamp}`,
      level,
      title,
      message,
      timestamp: entry.timestamp,
      acknowledged: false,
      source: entry.agent,
    });
  }
  return alerts;
}

export async function getLiveDashboardData(): Promise<DashboardData | null> {
  try {
    const agentStatuses = await readAgentStatuses();
    const tasks = await readTasksFromJson();
    const taskLog = await readTasksLog();
    if (agentStatuses.length === 0 && tasks.length === 0) {
      return null;
    }
    const agents = agentStatuses.map(transformAgentStatus);
    const dashboardTasks = tasks.map(transformTask);
    const alerts = generateAlertsFromLog(taskLog);
    return {
      agents,
      tasks: dashboardTasks,
      alerts,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error reading live data:', error);
    return null;
  }
}

export async function isLiveDataAvailable(): Promise<boolean> {
  if (!isFilesystemAvailable()) return false;
  try {
    const agentStatuses = await readAgentStatuses();
    return agentStatuses.length > 0;
  } catch {
    return false;
  }
}
