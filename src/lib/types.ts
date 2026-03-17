// Dashboard-specific types (separate from Kanban task types)

export interface DashboardAgent {
  id: string;
  name: string;
  emoji: string;
  status: 'active' | 'idle' | 'busy' | 'offline' | 'error';
  currentTask?: string;
  lastActivity: string;
  description: string;
}

export interface DashboardTask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  agentId?: string;
  agentName?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface DashboardAlert {
  id: string;
  level: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  source?: string;
}

export interface DashboardData {
  agents: DashboardAgent[];
  tasks: DashboardTask[];
  alerts: DashboardAlert[];
  lastUpdated: string;
}

export type ViewMode = 'agents' | 'tasks' | 'alerts' | 'overview';

// Alias exports for backward compatibility
export type Agent = DashboardAgent;
export type Task = DashboardTask;
export type Alert = DashboardAlert;
