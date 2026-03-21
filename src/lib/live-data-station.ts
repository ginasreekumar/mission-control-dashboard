/**
 * Station-aware Live Data Module for Mission Control Dashboard
 * 
 * This is an updated version of live-data.ts that supports multiple stations.
 * It maintains backward compatibility with the existing API while adding
 * multi-instance support.
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { DashboardAgent, DashboardTask, DashboardAlert, DashboardData, Project } from './types';

// Station configuration types
export interface StationConfig {
  id: string;
  name: string;
  description: string;
  host: string;
  bridge?: {
    url: string;
    token?: string;
  };
  paths?: {
    missionControlDir: string;
    statusDir: string;
    tasksFile: string;
    tasksLog: string;
    projectsFile: string;
  };
  agents: Record<string, AgentMetadata>;
  projects: Record<string, ProjectMetadata>;
}

export interface AgentMetadata {
  name: string;
  emoji: string;
  description: string;
  role?: string;
}

export interface ProjectMetadata {
  name: string;
  color: string;
  description?: string;
}

// Legacy environment-based config (for backward compatibility)
const LEGACY_MISSION_CONTROL_DIR = process.env.MISSION_CONTROL_DIR || '/home/siju/WORK/GINA/mission-control';
const LEGACY_STATUS_DIR = process.env.MISSION_CONTROL_STATUS || join(LEGACY_MISSION_CONTROL_DIR, 'status');
const LEGACY_TASKS_FILE = process.env.MISSION_CONTROL_TASKS || join(LEGACY_MISSION_CONTROL_DIR, 'data/tasks.json');
const LEGACY_TASKS_LOG = process.env.MISSION_CONTROL_TASKS_LOG || join(LEGACY_MISSION_CONTROL_DIR, 'tasks.jsonl');
const LEGACY_PROJECTS_FILE = process.env.MISSION_CONTROL_PROJECTS || join(LEGACY_MISSION_CONTROL_DIR, 'data/projects.json');
const DISABLE_FILESYSTEM = process.env.DISABLE_FILESYSTEM === 'true';

// Default agent metadata (can be overridden by station config)
const DEFAULT_AGENT_METADATA: Record<string, AgentMetadata> = {
  gina: { name: 'Gina', emoji: '🌟', description: 'Main orchestrator. Coordinates all agents and reports to Srijit.', role: 'orchestrator' },
  finch: { name: 'Finch', emoji: '🔍', description: 'Research specialist. Gathers information and analyzes data.', role: 'researcher' },
  geordi: { name: 'Geordi', emoji: '🔧', description: 'Builder and tool creator. Handles coding and implementation tasks.', role: 'builder' },
  r00t: { name: 'R00t', emoji: '📡', description: 'Signal hunter and monitor. Watches for alerts and opportunities.', role: 'monitor' },
};

// Default project metadata (can be overridden by station config)
const DEFAULT_PROJECT_METADATA: Record<string, ProjectMetadata> = {
  'proj-mission-control': { name: 'Mission Control', color: '#3b82f6' },
  'proj-raindrop-pipeline': { name: 'Raindrop Pipeline', color: '#10b981' },
  'proj-agent-tooling': { name: 'Agent Tooling', color: '#f59e0b' },
  'proj-research': { name: 'Research', color: '#8b5cf6' },
  'proj-general': { name: 'General', color: '#6b7280' },
};

// Get station config (for now, returns default/legacy config)
// In the future, this will read from stations.yaml
export function getStationConfig(stationId: string = 'local'): StationConfig {
  // For backward compatibility, 'local' station uses env vars
  if (stationId === 'local') {
    return {
      id: 'local',
      name: 'Local OpenClaw',
      description: 'Primary OpenClaw deployment',
      host: 'localhost',
      bridge: {
        url: process.env.MC_BRIDGE_URL || '',
        token: process.env.MC_BRIDGE_TOKEN,
      },
      paths: {
        missionControlDir: LEGACY_MISSION_CONTROL_DIR,
        statusDir: LEGACY_STATUS_DIR,
        tasksFile: LEGACY_TASKS_FILE,
        tasksLog: LEGACY_TASKS_LOG,
        projectsFile: LEGACY_PROJECTS_FILE,
      },
      agents: DEFAULT_AGENT_METADATA,
      projects: DEFAULT_PROJECT_METADATA,
    };
  }

  // For other stations, would load from stations.yaml
  throw new Error(`Station ${stationId} not configured`);
}

// Check if filesystem is available
function isFilesystemAvailable(): boolean {
  if (DISABLE_FILESYSTEM) return false;
  return !process.env.VERCEL && !process.env.NETLIFY;
}

// Types for raw data
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

// Station-aware file reading functions
async function readAgentStatusesForStation(station: StationConfig): Promise<AgentStatusFile[]> {
  if (!isFilesystemAvailable() || !station.paths) return [];
  
  try {
    const files = await fs.readdir(station.paths.statusDir);
    const statuses: AgentStatusFile[] = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const data = await fs.readFile(join(station.paths.statusDir, file), 'utf-8');
          statuses.push(JSON.parse(data));
        } catch (e) {}
      }
    }
    return statuses;
  } catch (error) {
    return [];
  }
}

async function readTasksFromJsonForStation(station: StationConfig): Promise<TaskFile[]> {
  if (!isFilesystemAvailable() || !station.paths) return [];
  
  try {
    const data = await fs.readFile(station.paths.tasksFile, 'utf-8');
    const parsed: TasksDataFile = JSON.parse(data);
    return parsed.tasks || [];
  } catch (error) {
    return [];
  }
}

async function readTasksLogForStation(station: StationConfig): Promise<TaskLogEntry[]> {
  if (!isFilesystemAvailable() || !station.paths) return [];
  
  try {
    const data = await fs.readFile(station.paths.tasksLog, 'utf-8');
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

async function readProjectsForStation(station: StationConfig): Promise<Project[]> {
  if (!isFilesystemAvailable() || !station.paths) {
    // Return projects from station config
    return Object.entries(station.projects).map(([id, meta]) => ({
      id,
      name: meta.name,
      description: meta.description || '',
      status: 'active' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tags: [],
    }));
  }
  
  try {
    const data = await fs.readFile(station.paths.projectsFile, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed.projects || [];
  } catch (error) {
    return Object.entries(station.projects).map(([id, meta]) => ({
      id,
      name: meta.name,
      description: meta.description || '',
      status: 'active' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tags: [],
    }));
  }
}

// Transform functions using station config
function transformAgentStatusForStation(
  status: AgentStatusFile,
  station: StationConfig
): DashboardAgent {
  const meta = station.agents[status.agent] || {
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

function transformTaskForStation(task: TaskFile, station: StationConfig): DashboardTask {
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
  const agentMeta = agentId ? station.agents[agentId] : undefined;
  
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

function generateAlertsFromLogForStation(
  entries: TaskLogEntry[],
  station: StationConfig
): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];
  const recentEntries = entries.slice(-10).reverse();
  
  for (const entry of recentEntries) {
    let level: DashboardAlert['level'] = 'info';
    let title = '';
    let message = '';
    
    const agentMeta = station.agents[entry.agent];
    const agentName = agentMeta?.name || entry.agent;
    
    switch (entry.status) {
      case 'done':
        level = 'success';
        title = `${agentName} completed task`;
        message = entry.task;
        break;
      case 'error':
        level = 'error';
        title = `${agentName} encountered an error`;
        message = entry.task;
        break;
      case 'in-progress':
        level = 'info';
        title = `${agentName} started task`;
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

// Main function: Get live dashboard data for a station
export async function getLiveDashboardDataForStation(
  stationId: string = 'local'
): Promise<DashboardData | null> {
  try {
    const station = getStationConfig(stationId);
    
    const agentStatuses = await readAgentStatusesForStation(station);
    const tasks = await readTasksFromJsonForStation(station);
    const taskLog = await readTasksLogForStation(station);
    const projects = await readProjectsForStation(station);
    
    if (agentStatuses.length === 0 && tasks.length === 0) {
      return null;
    }
    
    const agents = agentStatuses.map(s => transformAgentStatusForStation(s, station));
    const dashboardTasks = tasks.map(t => transformTaskForStation(t, station));
    const alerts = generateAlertsFromLogForStation(taskLog, station);
    
    return {
      agents,
      tasks: dashboardTasks,
      alerts,
      projects,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error reading live data for station ${stationId}:`, error);
    return null;
  }
}

// Check if live data is available for a station
export async function isLiveDataAvailableForStation(
  stationId: string = 'local'
): Promise<boolean> {
  if (!isFilesystemAvailable()) return false;
  
  try {
    const station = getStationConfig(stationId);
    if (!station.paths) return false;
    
    const agentStatuses = await readAgentStatusesForStation(station);
    return agentStatuses.length > 0;
  } catch {
    return false;
  }
}

// Backward compatibility: Original function uses 'local' station
export async function getLiveDashboardData(): Promise<DashboardData | null> {
  return getLiveDashboardDataForStation('local');
}

export async function isLiveDataAvailable(): Promise<boolean> {
  return isLiveDataAvailableForStation('local');
}
