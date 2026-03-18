import { NextResponse } from 'next/server';
import { getAlerts } from '@/lib/data';
import { getBridgeAlerts, isBridgeConfigured } from '@/lib/bridge-client';

export async function GET() {
  try {
    // Try bridge first
    if (isBridgeConfigured()) {
      const bridgeAlerts = await getBridgeAlerts();
      if (bridgeAlerts) {
        return NextResponse.json({ alerts: bridgeAlerts, source: 'bridge' });
      }
    }

    // Fallback to static
    const alerts = getAlerts();
    return NextResponse.json({ alerts, source: 'static' });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}
