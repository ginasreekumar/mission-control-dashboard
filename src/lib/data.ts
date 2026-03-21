import { DashboardData, DashboardAgent, DashboardTask, DashboardAlert, Project } from './types';

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

export function getProjects(): Project[] {
  return getDashboardData().projects || [];
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

export function getProjectById(id: string): Project | undefined {
  return getProjects().find(project => project.id === id);
}

export function getTasksByAgent(agentId: string): DashboardTask[] {
  return getTasks().filter(task => task.agentId === agentId);
}

export function getTasksByProject(projectId: string): DashboardTask[] {
  return getTasks().filter(task => task.projectId === projectId);
}

export function getAgentsByProject(projectId: string): DashboardAgent[] {
  return getAgents().filter(agent => agent.projectId === projectId);
}

export function getUnacknowledgedAlerts(): DashboardAlert[] {
  return getAlerts().filter(alert => !alert.acknowledged);
}

export function getStats() {
  const data = getDashboardData();
  const tasks = data.tasks;
  const projects = data.projects || [];
  
  return {
    totalAgents: data.agents.length,
    activeAgents: data.agents.filter(a => a.status === 'active').length,
    totalTasks: tasks.length,
    pendingTasks: tasks.filter(t => t.status === 'pending').length,
    inProgressTasks: tasks.filter(t => t.status === 'in-progress').length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    totalAlerts: data.alerts.length,
    unacknowledgedAlerts: data.alerts.filter(a => !a.acknowledged).length,
    criticalTasks: tasks.filter(t => t.priority === 'critical').length,
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'active').length,
  };
}

export function getTasksByProjectGrouped(): Record<string, DashboardTask[]> {
  const tasks = getTasks();
  const grouped: Record<string, DashboardTask[]> = {};
  
  for (const task of tasks) {
    const projectId = task.projectId || 'unassigned';
    if (!grouped[projectId]) {
      grouped[projectId] = [];
    }
    grouped[projectId].push(task);
  }
  
  return grouped;
}

export function getProjectStats(projectId: string) {
  const tasks = getTasksByProject(projectId);
  const agents = getAgentsByProject(projectId);
  
  return {
    totalTasks: tasks.length,
    pendingTasks: tasks.filter(t => t.status === 'pending').length,
    inProgressTasks: tasks.filter(t => t.status === 'in-progress').length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    activeAgents: agents.filter(a => a.status === 'active' || a.status === 'busy').length,
  };
}
