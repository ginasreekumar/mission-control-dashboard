/**
 * Station-aware data layer for Mission Control Dashboard
 * 
 * This module provides a unified interface for fetching data from any station
 * (local or remote), abstracting away the differences between filesystem
 * access and bridge API calls.
 */

import { DashboardData, DashboardAgent, DashboardTask, DashboardAlert, Project } from './types';

// Station configuration types
export interface StationConfig {
  id: string;
  name: string;
  description: string;
  host: string;
  bridge?: {
    url: string;
    token?: string;
  };
  paths?: {
    missionControlDir: string;
    statusDir: string;
    tasksFile: string;
    tasksLog: string;
    projectsFile: string;
  };
  agents: Record<string, AgentDefinition>;
  projects: Record<string, ProjectDefinition>;
}

export interface AgentDefinition {
  name: string;
  emoji: string;
  description: string;
  role: string;
}

export interface ProjectDefinition {
  name: string;
  color: string;
  description?: string;
}

// Runtime station info
export interface StationInfo {
  id: string;
  name: string;
  description: string;
  host: string;
  isLocal: boolean;
  isRemote: boolean;
  agentCount: number;
  projectCount: number;
}

// Default station configuration (mirrors current hardcoded setup)
export const DEFAULT_STATION: StationConfig = {
  id: 'local',
  name: 'Local OpenClaw',
  description: 'Primary OpenClaw deployment',
  host: 'localhost',
  bridge: {
    url: process.env.MC_BRIDGE_URL || '',
    token: process.env.MC_BRIDGE_TOKEN || undefined,
  },
  paths: {
    missionControlDir: process.env.MISSION_CONTROL_DIR || '/home/siju/WORK/GINA/mission-control',
    statusDir: process.env.MISSION_CONTROL_STATUS || '/home/siju/WORK/GINA/mission-control/status',
    tasksFile: process.env.MISSION_CONTROL_TASKS || '/home/siju/WORK/GINA/mission-control/data/tasks.json',
    tasksLog: process.env.MISSION_CONTROL_TASKS_LOG || '/home/siju/WORK/GINA/mission-control/tasks.jsonl',
    projectsFile: process.env.MISSION_CONTROL_PROJECTS || '/home/siju/WORK/GINA/mission-control/data/projects.json',
  },
  agents: {
    gina: { name: 'Gina', emoji: '🌟', description: 'Main orchestrator. Coordinates all agents and reports to Srijit.', role: 'orchestrator' },
    finch: { name: 'Finch', emoji: '🔍', description: 'Research specialist. Gathers information and analyzes data.', role: 'researcher' },
    geordi: { name: 'Geordi', emoji: '🔧', description: 'Builder and tool creator. Handles coding and implementation tasks.', role: 'builder' },
    r00t: { name: 'R00t', emoji: '📡', description: 'Signal hunter and monitor. Watches for alerts and opportunities.', role: 'monitor' },
  },
  projects: {
    'proj-mission-control': { name: 'Mission Control', color: '#3b82f6' },
    'proj-raindrop-pipeline': { name: 'Raindrop Pipeline', color: '#10b981' },
    'proj-agent-tooling': { name: 'Agent Tooling', color: '#f59e0b' },
    'proj-research': { name: 'Research', color: '#8b5cf6' },
    'proj-general': { name: 'General', color: '#6b7280' },
  },
};

// Station manager class
export class StationManager {
  private stations: Map<string, StationConfig> = new Map();
  private defaultStationId: string = 'local';

  constructor() {
    // Load from localStorage if available (for browser)
    this.loadFromStorage();
    
    // Always ensure default station exists
    if (!this.stations.has('local')) {
      this.stations.set('local', DEFAULT_STATION);
    }
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    
    try {
      const saved = localStorage.getItem('mc-stations');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.stations) {
          for (const [id, config] of Object.entries(data.stations)) {
            this.stations.set(id, config as StationConfig);
          }
        }
        if (data.defaultStationId) {
          this.defaultStationId = data.defaultStationId;
        }
      }
    } catch (e) {
      console.error('Failed to load stations from storage:', e);
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    
    try {
      const data = {
        stations: Object.fromEntries(this.stations),
        defaultStationId: this.defaultStationId,
      };
      localStorage.setItem('mc-stations', JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save stations to storage:', e);
    }
  }

  // Add a new station
  addStation(config: StationConfig): void {
    this.stations.set(config.id, config);
    this.saveToStorage();
  }

  // Remove a station
  removeStation(stationId: string): boolean {
    if (stationId === 'local') {
      return false; // Cannot remove local station
    }
    const result = this.stations.delete(stationId);
    if (result) {
      this.saveToStorage();
    }
    return result;
  }

  // Get a station by ID
  getStation(stationId: string): StationConfig | undefined {
    return this.stations.get(stationId);
  }

  // Get default station
  getDefaultStation(): StationConfig {
    return this.stations.get(this.defaultStationId) || DEFAULT_STATION;
  }

  // Set default station
  setDefaultStation(stationId: string): boolean {
    if (this.stations.has(stationId)) {
      this.defaultStationId = stationId;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  // List all stations
  listStations(): StationInfo[] {
    return Array.from(this.stations.values()).map(config => ({
      id: config.id,
      name: config.name,
      description: config.description,
      host: config.host,
      isLocal: !!config.paths,
      isRemote: !!config.bridge?.url,
      agentCount: Object.keys(config.agents).length,
      projectCount: Object.keys(config.projects).length,
    }));
  }

  // Get current station ID from URL or default
  getCurrentStationId(): string {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const stationId = params.get('station');
      if (stationId && this.stations.has(stationId)) {
        return stationId;
      }
    }
    return this.defaultStationId;
  }

  // Check if multi-station features are enabled
  isMultiStationEnabled(): boolean {
    return this.stations.size > 1;
  }
}

// Singleton instance
let stationManager: StationManager | null = null;

export function getStationManager(): StationManager {
  if (!stationManager) {
    stationManager = new StationManager();
  }
  return stationManager;
}

// Reset singleton (for testing)
export function resetStationManager(): void {
  stationManager = null;
}

// Fetch data from a specific station
export async function fetchStationData(
  stationId: string
): Promise<{ data: DashboardData | null; source: 'local' | 'remote' | 'static' | null }> {
  const manager = getStationManager();
  const station = manager.getStation(stationId);
  
  if (!station) {
    return { data: null, source: null };
  }

  // Try bridge first if configured
  if (station.bridge?.url) {
    try {
      const data = await fetchFromBridge(station);
      if (data) {
        return { data, source: 'remote' };
      }
    } catch (e) {
      console.warn(`Bridge fetch failed for station ${stationId}:`, e);
    }
  }

  // Fall back to static data
  return { data: getStaticData(station), source: 'static' };
}

// Fetch from bridge API
async function fetchFromBridge(station: StationConfig): Promise<DashboardData | null> {
  if (!station.bridge?.url) return null;

  const headers: Record<string, string> = {};
  if (station.bridge.token) {
    headers['Authorization'] = `Bearer ${station.bridge.token}`;
  }

  const response = await fetch(`${station.bridge.url.replace(/\/$/, '')}/dashboard`, {
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  return enrichDataWithStationMetadata(data, station);
}

// Get static data for a station
function getStaticData(station: StationConfig): DashboardData {
  // Transform agents
  const agents: DashboardAgent[] = Object.entries(station.agents).map(([id, agent]) => ({
    id,
    name: agent.name,
    emoji: agent.emoji,
    status: 'idle',
    lastActivity: new Date().toISOString(),
    description: agent.description,
  }));

  // Transform projects
  const projects: Project[] = Object.entries(station.projects).map(([id, proj]) => ({
    id,
    name: proj.name,
    description: proj.description || '',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tags: [],
  }));

  return {
    agents,
    tasks: [],
    alerts: [],
    projects,
    lastUpdated: new Date().toISOString(),
  };
}

// Enrich bridge data with station-specific agent/project metadata
function enrichDataWithStationMetadata(
  data: DashboardData,
  station: StationConfig
): DashboardData {
  // Enrich agents with station metadata
  const enrichedAgents = data.agents.map(agent => {
    const stationAgent = station.agents[agent.id];
    if (stationAgent) {
      return {
        ...agent,
        name: stationAgent.name,
        emoji: stationAgent.emoji,
        description: stationAgent.description,
      };
    }
    return agent;
  });

  // Enrich projects with station metadata
  const enrichedProjects = data.projects.map(project => {
    const stationProject = station.projects[project.id];
    if (stationProject) {
      return {
        ...project,
        name: stationProject.name,
      };
    }
    return project;
  });

  return {
    ...data,
    agents: enrichedAgents,
    projects: enrichedProjects,
  };
}
