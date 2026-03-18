import { NextResponse } from 'next/server';
import { getTasks } from '@/lib/data';
import { getBridgeTasks, isBridgeConfigured } from '@/lib/bridge-client';

export async function GET() {
  try {
    // Try bridge first
    if (isBridgeConfigured()) {
      const bridgeTasks = await getBridgeTasks();
      if (bridgeTasks) {
        return NextResponse.json({ tasks: bridgeTasks, source: 'bridge' });
      }
    }

    // Fallback to static
    const tasks = getTasks();
    return NextResponse.json({ tasks, source: 'static' });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}
