import { DashboardData, DashboardAgent, DashboardTask, DashboardAlert } from './types';

// Static data import - no filesystem reads at runtime
import dashboardData from '@/data/dashboard.json';

export function getDashboardData(): DashboardData {
  return dashboardData as DashboardData;
}

export function getAgents(): DashboardAgent[] {
  return getDashboardData().agents;
}

export function getTasks(): DashboardTask[] {
  return getDashboardData().tasks;
}

export function getAlerts(): DashboardAlert[] {
  return getDashboardData().alerts;
}

export function getAgentById(id: string): DashboardAgent | undefined {
  return getAgents().find(agent => agent.id === id);
}

export function getTaskById(id: string): DashboardTask | undefined {
  return getTasks().find(task => task.id === id);
}

export function getAlertById(id: string): DashboardAlert | undefined {
  return getAlerts().find(alert => alert.id === id);
}

export function getTasksByAgent(agentId: string): DashboardTask[] {
  return getTasks().filter(task => task.agentId === agentId);
}

export function getUnacknowledgedAlerts(): DashboardAlert[] {
  return getAlerts().filter(alert => !alert.acknowledged);
}

export function getStats() {
  const data = getDashboardData();
  return {
    totalAgents: data.agents.length,
    activeAgents: data.agents.filter(a => a.status === 'active').length,
    totalTasks: data.tasks.length,
    pendingTasks: data.tasks.filter(t => t.status === 'pending').length,
    inProgressTasks: data.tasks.filter(t => t.status === 'in-progress').length,
    completedTasks: data.tasks.filter(t => t.status === 'completed').length,
    totalAlerts: data.alerts.length,
    unacknowledgedAlerts: data.alerts.filter(a => !a.acknowledged).length,
    criticalTasks: data.tasks.filter(t => t.priority === 'critical').length,
  };
}
