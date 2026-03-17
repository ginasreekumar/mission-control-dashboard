import { NextRequest, NextResponse } from 'next/server';
import { claimTask, unclaimTask } from '@/lib/tasks-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { task_id, agent, action } = body;
    
    if (!task_id || !agent) {
      return NextResponse.json(
        { error: 'task_id and agent are required' },
        { status: 400 }
      );
    }
    
    // Handle unclaim
    if (action === 'unclaim') {
      const task = await unclaimTask(task_id, agent);
      if (!task) {
        return NextResponse.json(
          { error: 'Task not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(task);
    }
    
    // Handle claim
    const task = await claimTask(task_id, agent);
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found or not assigned to this agent' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(task);
  } catch (error) {
    console.error('Failed to claim task:', error);
    return NextResponse.json(
      { error: 'Failed to claim task' },
      { status: 500 }
    );
  }
}
