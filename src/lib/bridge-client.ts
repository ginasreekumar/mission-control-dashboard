/**
 * Bridge API Client for Mission Control Dashboard
 * Fetches live data from host-side bridge when configured.
 */

import { DashboardData, DashboardAgent, DashboardTask, DashboardAlert } from './types';

const BRIDGE_URL = process.env.MC_BRIDGE_URL;
const BRIDGE_TOKEN = process.env.MC_BRIDGE_TOKEN;

interface BridgeConfig {
  enabled: boolean;
  url: string | null;
  hasToken: boolean;
}

export function getBridgeConfig(): BridgeConfig {
  return {
    enabled: !!BRIDGE_URL,
    url: BRIDGE_URL || null,
    hasToken: !!BRIDGE_TOKEN,
  };
}

export function isBridgeConfigured(): boolean {
  return !!BRIDGE_URL;
}

async function fetchFromBridge<T>(endpoint: string): Promise<T | null> {
  if (!BRIDGE_URL) {
    return null;
  }

  try {
    const url = `${BRIDGE_URL.replace(/\/$/, '')}${endpoint}`;
    const headers: Record<string, string> = {};
    
    if (BRIDGE_TOKEN) {
      headers['Authorization'] = `Bearer ${BRIDGE_TOKEN}`;
    }

    const response = await fetch(url, {
      headers,
      // Add cache-busting for real-time data
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`Bridge fetch failed: ${response.status} ${response.statusText}`);
      return null;
    }

    return await response.json() as T;
  } catch (error) {
    console.error('Bridge fetch error:', error);
    return null;
  }
}

export async function getBridgeDashboardData(): Promise<DashboardData | null> {
  return fetchFromBridge<DashboardData>('/dashboard');
}

export async function getBridgeStats() {
  return fetchFromBridge<{
    totalAgents: number;
    activeAgents: number;
    totalTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    completedTasks: number;
    totalAlerts: number;
    unacknowledgedAlerts: number;
    criticalTasks: number;
  }>('/stats');
}

export async function getBridgeAgents(): Promise<DashboardAgent[] | null> {
  return fetchFromBridge<DashboardAgent[]>('/agents');
}

export async function getBridgeTasks(): Promise<DashboardTask[] | null> {
  return fetchFromBridge<DashboardTask[]>('/tasks');
}

export async function getBridgeAlerts(): Promise<DashboardAlert[] | null> {
  return fetchFromBridge<DashboardAlert[]>('/alerts');
}

export async function checkBridgeHealth(): Promise<{ healthy: boolean; version?: string }> {
  const health = await fetchFromBridge<{ status: string; version: string }>('/health');
  return {
    healthy: health?.status === 'healthy',
    version: health?.version,
  };
}
