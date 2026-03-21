'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DashboardLayout } from '@/components/DashboardLayout';
import { formatRelativeTime } from '@/lib/utils';
import { Activity, CheckCircle2, AlertCircle, Cpu, Wrench, Clock, FolderKanban, AlertTriangle } from 'lucide-react';

interface AgentInfo {
  name: string;
  role: string;
  model: string;
  description: string;
  status: 'idle' | 'working' | 'error';
  currentTask?: string;
  lastUpdate?: string;
  stale?: boolean;
  staleMinutes?: number;
  emoji: string;
  workload?: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    pendingTasks: number;
    byProject: Array<{
      projectId: string;
      projectName: string;
      taskCount: number;
      lastActivity: string;
    }>;
  };
}

const AGENT_CONFIG: Record<string, Partial<AgentInfo>> = {
  gina: { name: 'Gina', role: 'Coordinator', model: 'kimi-k2.5', emoji: '🌟',
    description: 'Lead orchestrator. Delegates to specialists and manages workflow.' },
  geordi: { name: 'Geordi', role: 'Builder', model: 'kimi-k2.5', emoji: '🔧',
    description: 'Coding specialist. Implements features and builds tools.' },
  finch: { name: 'Finch', role: 'Researcher', model: 'kimi-k2.5', emoji: '🔍',
    description: 'Research analyst. Gathers information and analyzes data.' },
  r00t: { name: 'R00t', role: 'Monitor', model: 'kimi-k2.5', emoji: '📡',
    description: 'Signal hunter. Monitors sources and tracks changes.' },
};

function TeamContent() {
  const [agents, setAgents] = useState<AgentInfo[]>([]);

  const fetchAgentData = useCallback(async () => {
    try {
      const res = await fetch('/api/agents/status');
      const data = await res.json();
      const agentList: AgentInfo[] = [];
      for (const [agentId, config] of Object.entries(AGENT_CONFIG)) {
        const statusData = data.agents?.find((a: any) => a.agent === agentId);
        agentList.push({
          name: config.name || agentId,
          role: config.role || 'Agent',
          model: config.model || 'unknown',
          description: config.description || '',
          emoji: config.emoji || '🤖',
          status: statusData?.status || 'idle',
          currentTask: statusData?.current_task,
          lastUpdate: statusData?.last_update,
          stale: statusData?.stale,
          staleMinutes: statusData?.staleMinutes,
          workload: statusData?.workload,
        });
      }
      setAgents(agentList);
    } catch (error) {
      setAgents(Object.values(AGENT_CONFIG).map(c => ({...c, status: 'idle'}) as AgentInfo));
    }
  }, []);

  useEffect(() => {
    fetchAgentData();
    const interval = setInterval(fetchAgentData, 30000);
    return () => clearInterval(interval);
  }, [fetchAgentData]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working': return <Activity className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
      case 'error': return 'bg-red-500/10 text-red-500 border-red-500/30';
      default: return 'bg-green-500/10 text-green-500 border-green-500/30';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team</h1>
        <p className="text-muted-foreground text-sm mt-1">Agent roster and workload</p>
      </div>

      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-2">Mission</h2>
          <p className="text-muted-foreground">
            A coordinated team of AI agents working together to assist Srijit.
            Gina orchestrates, Geordi builds, Finch researches, and R00t monitors.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agents.map((agent) => (
          <Card key={agent.name} className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="text-2xl bg-primary/10">{agent.emoji}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{agent.name}</h3>
                    <Badge variant="outline" className={getStatusColor(agent.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(agent.status)}
                        {agent.status}
                      </span>
                    </Badge>
                    {agent.stale && (
                      <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/30">
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          stale
                        </span>
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <span className="font-medium text-foreground">{agent.role}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Cpu className="h-3 w-3" />
                      {agent.model}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{agent.description}</p>
                  {agent.currentTask && (
                    <div className="flex items-center gap-2 text-sm">
                      <Wrench className="h-4 w-4 text-yellow-500" />
                      <span className="text-muted-foreground truncate">{agent.currentTask}</span>
                    </div>
                  )}
                  {agent.lastUpdate && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                      <Clock className="h-3 w-3" />
                      <span>Updated {formatRelativeTime(agent.lastUpdate)}</span>
                    </div>
                  )}
                </div>

              {/* Workload Stats */}
              {agent.workload && agent.workload.totalTasks > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    <div className="text-center p-2 bg-muted/30 rounded-lg">
                      <p className="text-lg font-semibold">{agent.workload.totalTasks}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div className="text-center p-2 bg-green-500/10 rounded-lg">
                      <p className="text-lg font-semibold text-green-600">{agent.workload.completedTasks}</p>
                      <p className="text-xs text-muted-foreground">Done</p>
                    </div>
                    <div className="text-center p-2 bg-yellow-500/10 rounded-lg">
                      <p className="text-lg font-semibold text-yellow-600">{agent.workload.inProgressTasks}</p>
                      <p className="text-xs text-muted-foreground">Active</p>
                    </div>
                    <div className="text-center p-2 bg-blue-500/10 rounded-lg">
                      <p className="text-lg font-semibold text-blue-600">{agent.workload.pendingTasks}</p>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                  </div>

                  {agent.workload.byProject?.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <FolderKanban className="w-3 h-3" />
                        Work by Project
                      </p>
                      {agent.workload.byProject.slice(0, 3).map((proj) => (
                        <div key={proj.projectId} className="flex items-center justify-between text-sm">
                          <span className="truncate">{proj.projectName}</span>
                          <span className="text-xs text-muted-foreground">{proj.taskCount} tasks</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function TeamPage() {
  return (
    <DashboardLayout>
      <TeamContent />
    </DashboardLayout>
  );
}
