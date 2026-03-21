import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';

const MISSION_CONTROL_DIR = process.env.MISSION_CONTROL_DIR || '/home/siju/WORK/GINA/mission-control';
const TASKS_FILE = join(MISSION_CONTROL_DIR, 'data/tasks.json');

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'backlog' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  project_id?: string;
}

interface TasksData {
  tasks: Task[];
  columns: Array<{ id: string; title: string; order: number }>;
}

async function readTasks(): Promise<TasksData> {
  try {
    const data = await fs.readFile(TASKS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { tasks: [], columns: [] };
  }
}

async function writeTasks(data: TasksData): Promise<void> {
  await fs.mkdir(join(MISSION_CONTROL_DIR, 'data'), { recursive: true });
  await fs.writeFile(TASKS_FILE, JSON.stringify(data, null, 2));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, projectId, agentId, unassign = false } = body;

    if (!taskId || typeof taskId !== 'string') {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const data = await readTasks();
    const taskIndex = data.tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    const task = data.tasks[taskIndex];
    const updates: Partial<Task> = {
      updated_at: new Date().toISOString(),
    };

    // Handle project assignment
    if (projectId !== undefined) {
      if (projectId === null) {
        // Unassign from project
        updates.project_id = undefined;
      } else {
        updates.project_id = projectId;
      }
    }

    // Handle agent assignment
    if (agentId !== undefined) {
      const currentAssigned = task.assigned_to || [];
      if (unassign) {
        // Remove agent from assignment
        updates.assigned_to = currentAssigned.filter(a => a !== agentId);
      } else {
        // Add agent to assignment
        if (!currentAssigned.includes(agentId)) {
          updates.assigned_to = [...currentAssigned, agentId];
        }
      }
    }

    data.tasks[taskIndex] = { ...task, ...updates };
    await writeTasks(data);

    return NextResponse.json({ task: data.tasks[taskIndex] });
  } catch (error) {
    console.error('Error assigning task:', error);
    return NextResponse.json(
      { error: 'Failed to assign task' },
      { status: 500 }
    );
  }
}
