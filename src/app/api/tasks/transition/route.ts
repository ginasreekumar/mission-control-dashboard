import { NextRequest, NextResponse } from 'next/server';
import { readTasks, writeTasks } from '@/lib/tasks-server';
import { promises as fs } from 'fs';
import { join } from 'path';

const MISSION_CONTROL_DIR = process.env.MISSION_CONTROL_DIR || '/home/siju/WORK/GINA/mission-control';
const STATUS_DIR = join(MISSION_CONTROL_DIR, 'status');

interface TransitionRequest {
  task_id: string;
  agent: string;
  action: 'claim' | 'start' | 'complete' | 'unclaim';
  result?: string;
}

// Ensure status directory exists
async function ensureStatusDir() {
  try {
    await fs.mkdir(STATUS_DIR, { recursive: true });
  } catch {}
}

// Update agent status file
async function updateAgentStatus(
  agent: string,
  status: 'idle' | 'working' | 'error',
  currentTask: string | null,
  taskId: string | null,
  note?: string
) {
  await ensureStatusDir();
  const statusFile = join(STATUS_DIR, `${agent}.json`);
  const timestamp = new Date().toISOString();
  
  const statusData = {
    agent,
    status,
    current_task: currentTask,
    task_id: taskId,
    last_update: timestamp,
    ...(note && { note }),
  };
  
  await fs.writeFile(statusFile, JSON.stringify(statusData, null, 2));
}

// Log task to tasks.jsonl
async function logTask(agent: string, task: string, status: string, result?: string) {
  const tasksLog = join(MISSION_CONTROL_DIR, 'tasks.jsonl');
  const entry = {
    timestamp: new Date().toISOString(),
    agent,
    task,
    status,
    ...(result && { result }),
  };
  
  try {
    await fs.appendFile(tasksLog, JSON.stringify(entry) + '\n');
  } catch (err) {
    console.error('Failed to log task:', err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: TransitionRequest = await request.json();
    const { task_id, agent, action, result } = body;
    
    if (!task_id || !agent || !action) {
      return NextResponse.json(
        { error: 'task_id, agent, and action are required' },
        { status: 400 }
      );
    }
    
    const data = await readTasks();
    const taskIndex = data.tasks.findIndex(t => t.id === task_id);
    
    if (taskIndex === -1) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }
    
    const task = data.tasks[taskIndex];
    const now = new Date().toISOString();
    
    switch (action) {
      case 'claim':
        // Add agent to assigned_to
        if (!task.assigned_to?.includes(agent)) {
          task.assigned_to = [...(task.assigned_to || []), agent];
        }
        task.updated_at = now;
        await writeTasks(data);
        await updateAgentStatus(agent, 'idle', task.title, task_id, `Claimed task: ${task.title}`);
        return NextResponse.json({
          success: true,
          task,
          message: `Task ${task_id} claimed by ${agent}`,
        });
        
      case 'start':
        // Update task status and agent
        task.status = 'in_progress';
        if (!task.assigned_to?.includes(agent)) {
          task.assigned_to = [...(task.assigned_to || []), agent];
        }
        task.updated_at = now;
        await writeTasks(data);
        await updateAgentStatus(agent, 'working', task.title, task_id);
        await logTask(agent, task.title, 'in-progress');
        return NextResponse.json({
          success: true,
          task,
          message: `Task ${task_id} started by ${agent}`,
        });
        
      case 'complete':
        // Mark task as done
        task.status = 'done';
        task.updated_at = now;
        await writeTasks(data);
        await updateAgentStatus(agent, 'idle', null, null, `Last completed: ${task.title}`);
        await logTask(agent, task.title, 'done', result);
        return NextResponse.json({
          success: true,
          task,
          message: `Task ${task_id} completed by ${agent}`,
        });
        
      case 'unclaim':
        // Remove agent from assigned_to
        task.assigned_to = task.assigned_to?.filter(a => a !== agent) || [];
        if (task.assigned_to.length === 0 && task.status === 'in_progress') {
          task.status = 'backlog';
        }
        task.updated_at = now;
        await writeTasks(data);
        await updateAgentStatus(agent, 'idle', null, null);
        return NextResponse.json({
          success: true,
          task,
          message: `Task ${task_id} unclaimed by ${agent}`,
        });
        
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Task transition error:', error);
    return NextResponse.json(
      { error: 'Failed to process task transition' },
      { status: 500 }
    );
  }
}

// GET endpoint to list available transitions for a task
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('task_id');
  const agent = searchParams.get('agent');
  
  if (!taskId) {
    return NextResponse.json(
      { error: 'task_id is required' },
      { status: 400 }
    );
  }
  
  try {
    const data = await readTasks();
    const task = data.tasks.find(t => t.id === taskId);
    
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }
    
    // Determine available actions based on current state
    const actions: string[] = [];
    const isAssigned = task.assigned_to?.includes(agent || '');
    
    if (task.status === 'backlog') {
      actions.push('claim');
    } else if (task.status === 'in_progress') {
      if (isAssigned) {
        actions.push('complete');
        actions.push('unclaim');
      }
    } else if (task.status === 'done') {
      // No actions available for completed tasks
    }
    
    return NextResponse.json({
      task_id: taskId,
      current_status: task.status,
      assigned_to: task.assigned_to || [],
      available_actions: actions,
    });
  } catch (error) {
    console.error('Error getting transitions:', error);
    return NextResponse.json(
      { error: 'Failed to get available transitions' },
      { status: 500 }
    );
  }
}
