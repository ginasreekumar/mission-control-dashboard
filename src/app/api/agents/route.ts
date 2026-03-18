import { NextResponse } from 'next/server';
import { getAgents } from '@/lib/data';
import { getBridgeAgents, isBridgeConfigured } from '@/lib/bridge-client';

export async function GET() {
  try {
    // Try bridge first
    if (isBridgeConfigured()) {
      const bridgeAgents = await getBridgeAgents();
      if (bridgeAgents) {
        return NextResponse.json({ agents: bridgeAgents, source: 'bridge' });
      }
    }

    // Fallback to static
    const agents = getAgents();
    return NextResponse.json({ agents, source: 'static' });
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}
