import { NextResponse } from 'next/server';
import { getStationConfig } from '@/lib/live-data-station';

// List of configured stations
// In the future, this will be loaded from stations.yaml
const STATIONS = [
  {
    id: 'local',
    name: 'Local OpenClaw',
    description: 'Primary OpenClaw deployment on srijit-l3',
    host: 'localhost',
    isLocal: true,
    isRemote: false,
  },
];

export async function GET() {
  try {
    // Get station configs
    const stations = STATIONS.map(s => {
      try {
        const config = getStationConfig(s.id);
        return {
          ...s,
          agentCount: Object.keys(config.agents).length,
          projectCount: Object.keys(config.projects).length,
        };
      } catch (e) {
        return s;
      }
    });

    return NextResponse.json({
      stations,
      defaultStation: 'local',
      features: {
        multiStation: false, // Will be true when multi-station is fully implemented
        stationSwitching: false,
        aggregateView: false,
      },
    });
  } catch (error) {
    console.error('Error fetching stations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stations' },
      { status: 500 }
    );
  }
}
