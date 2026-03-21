'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, GitBranch, Clock, CheckCircle2, Users, AlertCircle, Activity, Zap } from 'lucide-react';
import Link from 'next/link';
import { DashboardTask } from '@/lib/types';
import { DashboardTaskCard } from '@/components/DashboardTaskCard';
import { AgentCard } from '@/components/AgentCard';

interface ProjectDetailData {
  project: {
    id: string;
    name: string;
    description: string;
    status: 'active' | 'paused' | 'completed' | 'archived';
    tags: string[];
    metadata?: {
      repo?: string;
      priority?: string;
    };
  } | null;
  tasks: DashboardTask[];
  agents: {
    id: string;
    name: string;
    emoji: string;
    status: 'active' | 'idle' | 'busy' | 'offline' | 'error';
    currentTask?: string;
    projectId?: string;
    projectName?: string;
    lastActivity: string;
    description: string;
  }[];
  stats: {
    totalTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    completedTasks: number;
    activeAgents: number;
  };
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<ProjectDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${params.id}`);
      if (!res.ok) throw new Error('Failed to fetch project data');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data?.project) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/projects" className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Project Not Found</h1>
            </div>
          </div>
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">{error || `Project "${params.id}" not found`}</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const { project, tasks, agents, stats } = data;

  const statusColors = {
    active: 'bg-green-500/10 text-green-500',
    paused: 'bg-yellow-500/10 text-yellow-500',
    completed: 'bg-blue-500/10 text-blue-500',
    archived: 'bg-gray-500/10 text-gray-500',
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Link href="/projects" className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[project.status]}`}>
                  {project.status}
                </span>
              </div>
              <p className="text-muted-foreground text-sm mt-1">{project.description}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalTasks}</p>
                  <p className="text-sm text-muted-foreground">Total Tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.inProgressTasks}</p>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.completedTasks}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeAgents}</p>
                  <p className="text-sm text-muted-foreground">Active Agents</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Metadata */}
        {project.metadata?.repo && (
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm">
                <GitBranch className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Repository:</span>
                <code className="bg-muted px-2 py-0.5 rounded text-xs">{project.metadata.repo}</code>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Agents */}
        {agents.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Active Agents
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map(agent => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          </section>
        )}

        {/* Tasks */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Tasks
          </h2>
          {tasks.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.map(task => (
                <DashboardTaskCard key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No tasks found for this project</p>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
