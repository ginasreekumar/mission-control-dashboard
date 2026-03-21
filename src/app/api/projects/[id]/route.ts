import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';

const MISSION_CONTROL_DIR = process.env.MISSION_CONTROL_DIR || '/home/siju/WORK/GINA/mission-control';
const PROJECTS_FILE = join(MISSION_CONTROL_DIR, 'data/projects.json');
const TASKS_LOG = join(MISSION_CONTROL_DIR, 'tasks.jsonl');
const STATUS_DIR = join(MISSION_CONTROL_DIR, 'status');

const AGENT_METADATA: Record<string, { name: string; emoji: string; description: string }> = {
  gina: { name: 'Gina', emoji: '🌟', description: 'Main orchestrator. Coordinates all agents and reports to Srijit.' },
  finch: { name: 'Finch', emoji: '🔍', description: 'Research specialist. Gathers information and analyzes data.' },
  geordi: { name: 'Geordi', emoji: '🔧', description: 'Builder and tool creator. Handles coding and implementation tasks.' },
  r00t: { name: 'R00t', emoji: '📡', description: 'Signal hunter and monitor. Watches for alerts and opportunities.' },
};

const PROJECT_METADATA: Record<string, { name: string; color: string }> = {
  'proj-mission-control': { name: 'Mission Control', color: '#3b82f6' },
  'proj-raindrop-pipeline': { name: 'Raindrop Pipeline', color: '#10b981' },
  'proj-agent-tooling': { name: 'Agent Tooling', color: '#f59e0b' },
  'proj-research': { name: 'Research', color: '#8b5cf6' },
  'proj-general': { name: 'General', color: '#6b7280' },
};

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
  tags: string[];
  metadata?: {
    repo?: string;
    priority?: string;
  };
}

async function readProjects(): Promise<Project[]> {
  try {
    const data = await fs.readFile(PROJECTS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed.projects || [];
  } catch (error) {
    return Object.entries(PROJECT_METADATA).map(([id, meta]) => ({
      id,
      name: meta.name,
      description: '',
      status: 'active' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tags: [],
    }));
  }
}

async function readTasksLog(): Promise<Array<{
  timestamp: string;
  agent: string;
  task: string;
  status: string;
  result?: string;
  project_id?: string;
}> | null> {
  try {
    const data = await fs.readFile(TASKS_LOG, 'utf-8');
    const lines = data.split('\n').filter(line => line.trim());
    const entries = [];
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

async function readAgentStatuses(): Promise<Array<{
  agent: string;
  status: string;
  current_task: string | null;
  last_update: string;
  task_id: string | null;
  project_id?: string;
  project_name?: string;
}> | null> {
  try {
    const files = await fs.readdir(STATUS_DIR);
    const statuses = [];
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    
    const projects = await readProjects();
    const project = projects.find((p: Project) => p.id === projectId);
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const taskLog = await readTasksLog();
    const projectTasks = (taskLog || [])
      .filter((entry: any) => entry.project_id === projectId || (!entry.project_id && projectId === 'proj-general'))
      .map((entry: any) => {
        const agentMeta = AGENT_METADATA[entry.agent];
        return {
          id: `task-${entry.timestamp}`,
          title: entry.task,
          description: entry.result || '',
          status: entry.status === 'done' ? 'completed' : entry.status === 'in-progress' ? 'in-progress' : 'pending',
          priority: 'medium' as const,
          agentId: entry.agent,
          agentName: agentMeta?.name || entry.agent,
          projectId: projectId,
          projectName: project.name,
          createdAt: entry.timestamp,
          updatedAt: entry.timestamp,
          tags: [],
        };
      })
      .reverse();

    const agentStatuses = await readAgentStatuses();
    const projectAgents = (agentStatuses || [])
      .filter((status: any) => status.project_id === projectId || (!status.project_id && projectId === 'proj-general'))
      .map((status: any) => {
        const meta = AGENT_METADATA[status.agent] || {
          name: status.agent.charAt(0).toUpperCase() + status.agent.slice(1),
          emoji: '🤖',
          description: 'Agent',
        };
        return {
          id: status.agent,
          name: meta.name,
          emoji: meta.emoji,
          status: status.status === 'working' ? 'active' : status.status === 'idle' ? 'idle' : 'error',
          currentTask: status.current_task || undefined,
          projectId: projectId,
          projectName: project.name,
          lastActivity: status.last_update,
          description: meta.description,
        };
      });

    const stats = {
      totalTasks: projectTasks.length,
      pendingTasks: projectTasks.filter((t: any) => t.status === 'pending').length,
      inProgressTasks: projectTasks.filter((t: any) => t.status === 'in-progress').length,
      completedTasks: projectTasks.filter((t: any) => t.status === 'completed').length,
      activeAgents: projectAgents.filter((a: any) => a.status === 'active').length,
    };

    return NextResponse.json({
      project,
      tasks: projectTasks.slice(0, 50),
      agents: projectAgents,
      stats,
    });
  } catch (error) {
    console.error('Error fetching project details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project details' },
      { status: 500 }
    );
  }
}
