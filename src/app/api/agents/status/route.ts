import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';

const MISSION_CONTROL_DIR = process.env.MISSION_CONTROL_DIR || '/home/siju/WORK/GINA/mission-control';
const STATUS_DIR = join(MISSION_CONTROL_DIR, 'status');
const TASKS_LOG = join(MISSION_CONTROL_DIR, 'tasks.jsonl');
const PROJECTS_FILE = join(MISSION_CONTROL_DIR, 'data/projects.json');

const AGENT_METADATA: Record<string, { name: string; emoji: string; role: string; description: string }> = {
  gina: { name: 'Gina', emoji: '🌟', role: 'Coordinator', description: 'Lead orchestrator. Delegates to specialists and manages workflow.' },
  finch: { name: 'Finch', emoji: '🔍', role: 'Researcher', description: 'Research analyst. Gathers information and analyzes data.' },
  geordi: { name: 'Geordi', emoji: '🔧', role: 'Builder', description: 'Coding specialist. Implements features and builds tools.' },
  r00t: { name: 'R00t', emoji: '📡', role: 'Monitor', description: 'Signal hunter. Monitors sources and tracks changes.' },
};

interface AgentStatusFile {
  agent: string;
  status: 'idle' | 'working' | 'error' | 'done';
  current_task: string | null;
  last_update: string;
  task_id: string | null;
  project_id?: string;
  project_name?: string;
  note?: string;
}

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

async function readAgentStatuses(): Promise<AgentStatusFile[]> {
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

function getStatusDisplay(status: string): { status: 'idle' | 'working' | 'error'; label: string } {
  switch (status) {
    case 'working':
    case 'in-progress':
      return { status: 'working', label: 'working' };
    case 'error':
      return { status: 'error', label: 'error' };
    case 'done':
    case 'completed':
      return { status: 'idle', label: 'idle' };
    default:
      return { status: 'idle', label: 'idle' };
  }
}

export async function GET() {
  try {
    const [agentStatuses, tasks, projects] = await Promise.all([
      readAgentStatuses(),
      readTasksLog(),
      readProjects(),
    ]);

    const projectMap = new Map(projects.map(p => [p.id, p.name]));

    // Build workload data for each agent
    const agentWorkloads: Record<string, {
      totalTasks: number;
      completedTasks: number;
      inProgressTasks: number;
      pendingTasks: number;
      byProject: Array<{
        projectId: string;
        projectName: string;
        taskCount: number;
        lastActivity: string;
      }>;
      recentTasks: Array<{
        title: string;
        status: string;
        projectId?: string;
        projectName?: string;
        timestamp: string;
      }>;
    }> = {};

    // Initialize workload for all known agents
    for (const agentId of Object.keys(AGENT_METADATA)) {
      agentWorkloads[agentId] = {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        pendingTasks: 0,
        byProject: [],
        recentTasks: [],
      };
    }

    // Process tasks for workload calculation
    const agentTasks: Record<string, TaskEntry[]> = {};
    for (const task of tasks) {
      if (!agentTasks[task.agent]) {
        agentTasks[task.agent] = [];
      }
      agentTasks[task.agent].push(task);
    }

    // Calculate workload stats per agent
    for (const [agentId, agentTaskList] of Object.entries(agentTasks)) {
      if (!agentWorkloads[agentId]) continue;

      const byProject: Record<string, { count: number; lastActivity: string }> = {};

      for (const task of agentTaskList) {
        agentWorkloads[agentId].totalTasks++;

        if (task.status === 'done' || task.status === 'completed') {
          agentWorkloads[agentId].completedTasks++;
        } else if (task.status === 'in-progress') {
          agentWorkloads[agentId].inProgressTasks++;
        } else {
          agentWorkloads[agentId].pendingTasks++;
        }

        const pid = task.project_id || 'proj-general';
        if (!byProject[pid]) {
          byProject[pid] = { count: 0, lastActivity: task.timestamp };
        }
        byProject[pid].count++;
        if (task.timestamp > byProject[pid].lastActivity) {
          byProject[pid].lastActivity = task.timestamp;
        }
      }

      agentWorkloads[agentId].byProject = Object.entries(byProject)
        .map(([projectId, data]) => ({
          projectId,
          projectName: projectMap.get(projectId) || 'General / Unfiled',
          taskCount: data.count,
          lastActivity: data.lastActivity,
        }))
        .sort((a, b) => b.taskCount - a.taskCount);

      // Get recent tasks (last 5)
      agentWorkloads[agentId].recentTasks = agentTaskList
        .slice(-5)
        .reverse()
        .map(task => ({
          title: task.task,
          status: task.status,
          projectId: task.project_id,
          projectName: task.project_id ? projectMap.get(task.project_id) : undefined,
          timestamp: task.timestamp,
        }));
    }

    // Build enhanced agent list
    const agents = Object.entries(AGENT_METADATA).map(([agentId, meta]) => {
      const statusData = agentStatuses.find(s => s.agent === agentId);
      const display = getStatusDisplay(statusData?.status || 'idle');
      const workload = agentWorkloads[agentId];

      return {
        agent: agentId,
        name: meta.name,
        emoji: meta.emoji,
        role: meta.role,
        description: meta.description,
        status: display.status,
        statusLabel: display.label,
        current_task: statusData?.current_task || null,
        task_id: statusData?.task_id || null,
        project_id: statusData?.project_id || null,
        project_name: statusData?.project_name || null,
        last_update: statusData?.last_update || null,
        workload: {
          totalTasks: workload.totalTasks,
          completedTasks: workload.completedTasks,
          inProgressTasks: workload.inProgressTasks,
          pendingTasks: workload.pendingTasks,
          byProject: workload.byProject,
          recentTasks: workload.recentTasks,
        },
      };
    });

    return NextResponse.json({ agents });
  } catch (error) {
    console.error('Error fetching agent statuses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent statuses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const status: AgentStatusFile = {
      agent: body.agent,
      status: body.status,
      current_task: body.current_task || null,
      task_id: body.task_id || null,
      last_update: new Date().toISOString(),
    };

    await fs.mkdir(STATUS_DIR, { recursive: true });
    await fs.writeFile(
      join(STATUS_DIR, `${status.agent}.json`),
      JSON.stringify(status, null, 2)
    );

    return NextResponse.json(status, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update agent status' },
      { status: 500 }
    );
  }
}
