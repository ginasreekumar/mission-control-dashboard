import { NextRequest, NextResponse } from 'next/server';
import { listAgentStatuses, writeAgentStatus, AgentStatus } from '@/lib/agents-server';

export async function GET() {
  const statuses = await listAgentStatuses();
  return NextResponse.json(statuses);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const status: AgentStatus = {
      agent: body.agent,
      status: body.status,
      current_task: body.current_task || null,
      task_id: body.task_id || null,
      last_update: new Date().toISOString(),
    };
    await writeAgentStatus(status);
    return NextResponse.json(status, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update agent status' },
      { status: 500 }
    );
  }
}
