import { NextResponse } from 'next/server';
import { readTasks } from '@/lib/tasks-server';
import { listAgentStatuses } from '@/lib/agents-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      let interval: NodeJS.Timeout;
      
      // Send initial data
      const sendUpdate = async () => {
        try {
          const [tasksData, agents] = await Promise.all([
            readTasks(),
            listAgentStatuses(),
          ]);
          
          const data = JSON.stringify({
            tasks: tasksData.tasks,
            agents,
            timestamp: new Date().toISOString(),
          });
          
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch (error) {
          controller.enqueue(encoder.encode(`data: {"error": true}\n\n`));
        }
      };
      
      // Send initial data
      sendUpdate();
      
      // Keep connection alive with periodic updates
      interval = setInterval(sendUpdate, 5000);
      
      // Clean up handled by client disconnect
    },
    cancel() {
      // Cleanup when client disconnects
    },
  });
  
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
