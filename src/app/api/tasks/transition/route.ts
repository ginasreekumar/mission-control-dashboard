import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';

const MISSION_CONTROL_DIR = process.env.MISSION_CONTROL_DIR || '/home/siju/WORK/GINA/mission-control';
const STATUS_DIR = join(MISSION_CONTROL_DIR, 'status');
const TASKS_LOG = join(MISSION_CONTROL_DIR, 'tasks.jsonl');

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
  const entry = {
    timestamp: new Date().toISOString(),
    agent,
    task,
    status,
    ...(result && { result }),
  };
  
  try {
    await fs.appendFile(TASKS_LOG, JSON.stringify(entry) + '\n');
  } catch (err) {
    console.error('Failed to log task:', err);
  }
}

// Read tasks from tasks.jsonl to find task by ID
async function findTaskInLog(taskId: string): Promise<{ title: string; found: boolean } | null> {
  try {
    const data = await fs.readFile(TASKS_LOG, 'utf-8');
    const lines = data.split('\n').filter(line => line.trim());
    
    // Look for task entries with matching ID or title
    for (const line of lines.reverse()) {
      try {
        const entry = JSON.parse(line);
        // Match by task_id in the entry or by task title
        if (entry.task_id === taskId || entry.task === taskId) {
          return { title: entry.task, found: true };
        }
      } catch (e) {}
    }
    return null;
  } catch (error) {
    return null;
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
    
    // For dashboard tasks, we work with the tasks.jsonl log
    // The task_id could be a generated ID or a task title
    const taskInfo = await findTaskInLog(task_id);
    const taskTitle = taskInfo?.title || task_id;
    
    const now = new Date().toISOString();
    
    switch (action) {
      case 'claim':
        // Log claim action
        await logTask(agent, taskTitle, 'claimed');
        await updateAgentStatus(agent, 'idle', taskTitle, task_id, `Claimed task: ${taskTitle}`);
        return NextResponse.json({
          success: true,
          message: `Task "${taskTitle}" claimed by ${agent}`,
          task_id,
          action,
          timestamp: now,
        });
        
      case 'start':
        // Log start action
        await logTask(agent, taskTitle, 'in-progress');
        await updateAgentStatus(agent, 'working', taskTitle, task_id);
        return NextResponse.json({
          success: true,
          message: `Task "${taskTitle}" started by ${agent}`,
          task_id,
          action,
          timestamp: now,
        });
        
      case 'complete':
        // Log completion
        await logTask(agent, taskTitle, 'done', result);
        await updateAgentStatus(agent, 'idle', null, null, `Last completed: ${taskTitle}`);
        return NextResponse.json({
          success: true,
          message: `Task "${taskTitle}" completed by ${agent}`,
          task_id,
          action,
          timestamp: now,
          result,
        });
        
      case 'unclaim':
        // Log unclaim
        await logTask(agent, taskTitle, 'unclaimed');
        await updateAgentStatus(agent, 'idle', null, null);
        return NextResponse.json({
          success: true,
          message: `Task "${taskTitle}" unclaimed by ${agent}`,
          task_id,
          action,
          timestamp: now,
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
  const status = searchParams.get('status');
  
  if (!taskId) {
    return NextResponse.json(
      { error: 'task_id is required' },
      { status: 400 }
    );
  }
  
  try {
    // Determine available actions based on current state
    const actions: string[] = [];
    
    switch (status) {
      case 'pending':
        actions.push('claim');
        break;
      case 'in-progress':
        actions.push('complete');
        actions.push('unclaim');
        break;
      case 'completed':
        // No actions for completed tasks
        break;
      case 'blocked':
        actions.push('unclaim');
        break;
      default:
        // Default: allow claim
        actions.push('claim');
    }
    
    return NextResponse.json({
      task_id: taskId,
      current_status: status || 'unknown',
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
