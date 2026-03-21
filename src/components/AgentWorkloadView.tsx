'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, FolderKanban, CheckCircle2, Clock, AlertCircle, BarChart3 } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  emoji: string;
  status: 'active' | 'idle' | 'busy' | 'offline' | 'error';
  currentTask?: string;
  projectId?: string;
  projectName?: string;
  lastActivity: string;
  description: string;
}

interface Task {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  agentId?: string;
  agentName?: string;
  projectId?: string;
  projectName?: string;
}

interface Project {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
}

interface AgentWorkload {
  agent: Agent;
  tasksByProject: Record<string, Task[]>;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
}

interface AgentWorkloadViewProps {
  agents?: Agent[];
  tasks?: Task[];
  projects?: Project[];
}

export function AgentWorkloadView({ agents = [], tasks = [], projects = [] }: AgentWorkloadViewProps) {
  const [workloads, setWorkloads] = useState<AgentWorkload[]>([]);
  const [loading, setLoading] = useState(true);

  const calculateWorkloads = useCallback(() => {
    const agentWorkloads: AgentWorkload[] = [];

    for (const agent of agents) {
      const agentTasks = tasks.filter(t => t.agentId === agent.id);
      const tasksByProject: Record<string, Task[]> = {};

      for (const task of agentTasks) {
        const projectId = task.projectId || 'unassigned';
        if (!tasksByProject[projectId]) {
          tasksByProject[projectId] = [];
        }
        tasksByProject[projectId].push(task);
      }

      agentWorkloads.push({
        agent,
        tasksByProject,
        totalTasks: agentTasks.length,
        completedTasks: agentTasks.filter(t => t.status === 'completed').length,
        inProgressTasks: agentTasks.filter(t => t.status === 'in-progress').length,
        pendingTasks: agentTasks.filter(t => t.status === 'pending').length,
      });
    }

    // Sort by total tasks (most busy first)
    agentWorkloads.sort((a, b) => b.totalTasks - a.totalTasks);
    setWorkloads(agentWorkloads);
    setLoading(false);
  }, [agents, tasks]);

  useEffect(() => {
    calculateWorkloads();
  }, [calculateWorkloads]);

  const getProjectName = (projectId: string) => {
    if (projectId === 'unassigned') return 'Unassigned';
    const project = projects.find(p => p.id === projectId);
    return project?.name || projectId;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'busy':
        return 'bg-green-500/10 text-green-500';
      case 'idle':
        return 'bg-blue-500/10 text-blue-500';
      case 'error':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Agent Workload
        </h2>
        <span className="text-sm text-muted-foreground">
          {workloads.filter(w => w.totalTasks > 0).length} agents with active tasks
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {workloads.map((workload) => (
          <Card key={workload.agent.id} className="bg-card border-border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{workload.agent.emoji}</span>
                  <div>
                    <CardTitle className="text-base">{workload.agent.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{workload.agent.description}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(workload.agent.status)}`}>
                  {workload.agent.status}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Task Stats */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="text-center p-2 bg-muted rounded-lg">
                  <p className="text-lg font-bold">{workload.totalTasks}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Total</p>
                </div>
                <div className="text-center p-2 bg-green-500/5 rounded-lg">
                  <p className="text-lg font-bold text-green-600">{workload.completedTasks}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Done</p>
                </div>
                <div className="text-center p-2 bg-yellow-500/5 rounded-lg">
                  <p className="text-lg font-bold text-yellow-600">{workload.inProgressTasks}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Active</p>
                </div>
                <div className="text-center p-2 bg-blue-500/5 rounded-lg">
                  <p className="text-lg font-bold text-blue-600">{workload.pendingTasks}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Pending</p>
                </div>
              </div>

              {/* Current Task */}
              {workload.agent.currentTask && (
                <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg mb-3">
                  <Activity className="w-4 h-4 text-primary" />
                  <span className="text-sm truncate">{workload.agent.currentTask}</span>
                </div>
              )}

              {/* Tasks by Project */}
              {Object.keys(workload.tasksByProject).length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <FolderKanban className="w-3 h-3" />
                    Tasks by Project
                  </p>
                  {Object.entries(workload.tasksByProject).map(([projectId, projectTasks]) => (
                    <div key={projectId} className="flex items-center justify-between text-sm">
                      <span className="truncate flex-1">{getProjectName(projectId)}</span>
                      <div className="flex items-center gap-2">
                        {projectTasks.filter(t => t.status === 'completed').length > 0 && (
                          <span className="flex items-center gap-0.5 text-xs text-green-600">
                            <CheckCircle2 className="w-3 h-3" />
                            {projectTasks.filter(t => t.status === 'completed').length}
                          </span>
                        )}
                        {projectTasks.filter(t => t.status === 'in-progress').length > 0 && (
                          <span className="flex items-center gap-0.5 text-xs text-yellow-600">
                            <Clock className="w-3 h-3" />
                            {projectTasks.filter(t => t.status === 'in-progress').length}
                          </span>
                        )}
                        {projectTasks.filter(t => t.status === 'pending').length > 0 && (
                          <span className="flex items-center gap-0.5 text-xs text-blue-600">
                            <AlertCircle className="w-3 h-3" />
                            {projectTasks.filter(t => t.status === 'pending').length}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {workload.totalTasks === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No assigned tasks
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
