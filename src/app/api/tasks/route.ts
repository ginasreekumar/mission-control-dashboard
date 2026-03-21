import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';
import { getTasks as getStaticTasks } from '@/lib/data';
import { getBridgeTasks, isBridgeConfigured } from '@/lib/bridge-client';

const MISSION_CONTROL_DIR = process.env.MISSION_CONTROL_DIR || '/home/siju/WORK/GINA/mission-control';
const TASKS_LOG = join(MISSION_CONTROL_DIR, 'tasks.jsonl');
const PROJECTS_FILE = join(MISSION_CONTROL_DIR, 'data/projects.json');

const AGENT_METADATA: Record<string, { name: string; emoji: string }> = {
  gina: { name: 'Gina', emoji: '🌟' },
  finch: { name: 'Finch', emoji: '🔍' },
  geordi: { name: 'Geordi', emoji: '🔧' },
  r00t: { name: 'R00t', emoji: '📡' },
};

interface TaskEntry {
  timestamp: string;
  agent: string;
  task: string;
  status: string;
  result?: string;
  project_id?: string;
}

interface Project {
  id: string;
  name: string;
}

async function readTasksLog(): Promise<TaskEntry[]> {
  try {
    const data = await fs.readFile(TASKS_LOG, 'utf-8');
    const lines = data.split('\n').filter(line => line.trim());
    const entries: TaskEntry[] = [];
    for (const line of lines) {
      try {
        entries.push(JSON.parse(line));
      } catch (e) {}
    }
    return entries;
  } catch (error) {
    return [];
  }
}

async function readProjects(): Promise<Project[]> {
  try {
    const data = await fs.readFile(PROJECTS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed.projects || [];
  } catch (error) {
    return [];
  }
}

function mapTaskStatus(status: string): 'pending' | 'in-progress' | 'completed' | 'blocked' {
  switch (status) {
    case 'done':
    case 'completed':
      return 'completed';
    case 'in-progress':
      return 'in-progress';
    case 'error':
      return 'blocked';
    default:
      return 'pending';
  }
}

export async function GET(request: Request) {
  try {
    // Check for query params
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const agentId = searchParams.get('agentId');
    const status = searchParams.get('status');

    // Try bridge first for live data
    if (isBridgeConfigured()) {
      const bridgeTasks = await getBridgeTasks();
      if (bridgeTasks) {
        let tasks = bridgeTasks;
        if (projectId) tasks = tasks.filter(t => t.projectId === projectId);
        if (agentId) tasks = tasks.filter(t => t.agentId === agentId);
        if (status) tasks = tasks.filter(t => t.status === status);
        return NextResponse.json({ tasks, source: 'bridge' });
      }
    }

    // Read live tasks from tasks.jsonl
    const [taskEntries, projects] = await Promise.all([
      readTasksLog(),
      readProjects(),
    ]);

    const projectMap = new Map(projects.map(p => [p.id, p.name]));

    // Convert task log entries to DashboardTask format
    const tasks = taskEntries
      .filter(entry => {
        if (projectId && entry.project_id !== projectId) return false;
        if (agentId && entry.agent !== agentId) return false;
        if (status) {
          const mappedStatus = mapTaskStatus(entry.status);
          if (mappedStatus !== status) return false;
        }
        return true;
      })
      .map((entry, index) => {
        const agentMeta = AGENT_METADATA[entry.agent];
        const pid = entry.project_id || 'proj-general';
        return {
          id: `task-${entry.timestamp}-${index}`,
          title: entry.task,
          description: entry.result || '',
          status: mapTaskStatus(entry.status),
          priority: 'medium' as const,
          agentId: entry.agent,
          agentName: agentMeta?.name || entry.agent,
          projectId: pid,
          projectName: projectMap.get(pid) || 'General / Unfiled',
          createdAt: entry.timestamp,
          updatedAt: entry.timestamp,
          tags: [],
        };
      })
      .reverse(); // Most recent first

    return NextResponse.json({ tasks, source: 'live', count: tasks.length });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    // Fallback to static on error
    const tasks = getStaticTasks();
    return NextResponse.json({ tasks, source: 'static-fallback' });
  }
}
