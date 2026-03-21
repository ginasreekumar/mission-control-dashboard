'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { DashboardAgent, DashboardTask, DashboardAlert, ViewMode, Project } from '@/lib/types';
import { DashboardHeader } from './DashboardHeader';
import { TabNav } from './TabNav';
import { StatsGrid } from './StatsGrid';
import { AgentCard } from './AgentCard';
import { DashboardTaskCard } from './DashboardTaskCard';
import { AlertCard } from './AlertCard';
import { Sidebar } from './Sidebar';
import { Activity, ArrowRight, Zap, Database, Radio, Wifi, FolderKanban, Users, CheckCircle2, Clock, AlertCircle, Filter, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface DashboardDataResponse {
  agents: DashboardAgent[];
  tasks: DashboardTask[];
  alerts: DashboardAlert[];
  projects: Project[];
  lastUpdated: string;
  dataSource?: 'live' | 'static' | 'bridge';
  stats: {
    totalAgents: number;
    activeAgents: number;
    totalTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    completedTasks: number;
    totalAlerts: number;
    unacknowledgedAlerts: number;
    criticalTasks: number;
    totalProjects: number;
    activeProjects: number;
  };
}

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<ViewMode>('overview');
  const [data, setData] = useState<DashboardDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string | null>(null);

  const fetchData = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) {
        setRefreshing(true);
      }
      
      const timestamp = Date.now();
      const res = await fetch(`/api/dashboard?t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
      
      if (!res.ok) throw new Error('Failed to fetch data');
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    
    const interval = setInterval(() => {
      fetchData(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchData]);

  const tasksByProject = useMemo(() => {
    if (!data?.tasks) return {};
    const grouped: Record<string, DashboardTask[]> = {};
    for (const task of data.tasks) {
      const projectId = task.projectId || 'unassigned';
      if (!grouped[projectId]) {
        grouped[projectId] = [];
      }
      grouped[projectId].push(task);
    }
    return grouped;
  }, [data?.tasks]);

  const getProjectName = useCallback((projectId: string) => {
    if (!data?.projects) return projectId === 'unassigned' ? 'Unassigned' : projectId;
    const project = data.projects.find(p => p.id === projectId);
    return project?.name || (projectId === 'unassigned' ? 'Unassigned' : projectId);
  }, [data?.projects]);

  const filteredTasks = useMemo(() => {
    if (!data?.tasks) return [];
    if (!selectedProjectFilter) return data.tasks;
    return data.tasks.filter(t => (t.projectId || 'unassigned') === selectedProjectFilter);
  }, [data?.tasks, selectedProjectFilter]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-destructive">{error || 'Failed to load dashboard'}</p>
          <button
            onClick={() => fetchData()}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const isLive = data.dataSource === 'live' || data.dataSource === 'bridge';
  const isBridge = data.dataSource === 'bridge';

  const renderOverview = () => (
    <div className="space-y-6">
      <StatsGrid stats={data.stats} />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm">Agent Status</h2>
              </div>
              <button 
                onClick={() => setActiveTab('agents')}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                View all
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="p-4">
              <div className="grid sm:grid-cols-2 gap-3">
                {data.agents.map(agent => (
                  <AgentCard key={agent.id} agent={agent} compact />
                ))}
              </div>
            </div>
          </section>
          
          <section className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm">In Progress</h2>
              </div>
              <button 
                onClick={() => setActiveTab('tasks')}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                View all tasks
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="p-4">
              <div className="grid sm:grid-cols-2 gap-3">
                {data.tasks
                  .filter(t => t.status === 'in-progress')
                  .slice(0, 4)
                  .map(task => (
                    <DashboardTaskCard key={task.id} task={task} projects={data.projects} agents={data.agents} onUpdate={fetchData} />
                  ))}
                {data.tasks.filter(t => t.status === 'in-progress').length === 0 && (
                  <div className="col-span-full py-8 text-center text-muted-foreground text-sm">
                    No tasks in progress
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
        
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm">Recent Alerts</h2>
              </div>
              {data.stats.unacknowledgedAlerts > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 rounded-full font-medium">
                  {data.stats.unacknowledgedAlerts} new
                </span>
              )}
            </div>
            <div className="p-3 space-y-2">
              {data.alerts.slice(0, 5).map(alert => (
                <AlertCard key={alert.id} alert={alert} compact />
              ))}
              {data.alerts.length === 0 && (
                <div className="py-6 text-center text-muted-foreground text-sm">
                  No alerts
                </div>
              )}
            </div>
          </section>
          
          <section className={`rounded-xl border overflow-hidden ${isLive ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20' : 'border-border bg-muted/30'} p-4`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${isLive ? 'bg-green-100 dark:bg-green-900/50' : 'bg-amber-100 dark:bg-amber-950/50'}`}>
                {isLive ? (
                  isBridge ? (
                    <Wifi className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <Radio className="w-4 h-4 text-green-600 dark:text-green-400" />
                  )
                ) : (
                  <Database className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                )}
              </div>
              <div>
                <h3 className={`font-medium text-sm ${isLive ? 'text-green-800 dark:text-green-200' : ''}`}>
                  {isBridge ? 'Bridge Connected' : isLive ? 'Live Data Mode' : 'Demo Data Mode'}
                </h3>
                <p className={`text-xs mt-1 ${isLive ? 'text-green-700 dark:text-green-300' : 'text-muted-foreground'}`}>
                  {isBridge 
                    ? 'Connected via bridge API. Real-time data from host.'
                    : isLive 
                    ? 'Connected to live agent status and task feeds. Data updates every 30 seconds.' 
                    : 'Live data unavailable. Displaying sample data for UI preview.'}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );

  const renderAgents = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">All Agents</h2>
        <span className="text-sm text-muted-foreground">{data.agents.length} total</span>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.agents.map(agent => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  );

  const renderTasks = () => {
    const projectIds = Object.keys(tasksByProject).sort();
    
    return (
      <div className="space-y-6">
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter by project:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedProjectFilter(null)}
              className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                selectedProjectFilter === null
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              All ({data.tasks.length})
            </button>
            {projectIds.map(projectId => {
              const count = tasksByProject[projectId]?.length || 0;
              const isActive = selectedProjectFilter === projectId;
              return (
                <button
                  key={projectId}
                  onClick={() => setSelectedProjectFilter(isActive ? null : projectId)}
                  className={`px-3 py-1.5 text-xs rounded-full transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }`}
                >
                  {isActive && <X className="w-3 h-3" />}
                  {getProjectName(projectId)} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Tasks Display */}
        {selectedProjectFilter ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{getProjectName(selectedProjectFilter)} Tasks</h2>
              <span className="text-sm text-muted-foreground">{filteredTasks.length} tasks</span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTasks.map(task => (
                <DashboardTaskCard key={task.id} task={task} projects={data.projects} agents={data.agents} onUpdate={fetchData} />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {projectIds.map(projectId => {
              const projectTasks = tasksByProject[projectId] || [];
              if (projectTasks.length === 0) return null;
              
              return (
                <div key={projectId} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold flex items-center gap-2">
                      <FolderKanban className="w-4 h-4 text-muted-foreground" />
                      {getProjectName(projectId)}
                    </h3>
                    <button
                      onClick={() => setSelectedProjectFilter(projectId)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      View only
                    </button>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projectTasks.slice(0, 6).map(task => (
                      <DashboardTaskCard key={task.id} task={task} projects={data.projects} agents={data.agents} onUpdate={fetchData} />
                    ))}
                  </div>
                  {projectTasks.length > 6 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      +{projectTasks.length - 6} more tasks
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderProjects = () => {
    const getProjectStats = (projectId: string) => {
      const tasks = data.tasks.filter(t => (t.projectId || 'unassigned') === projectId);
      const agents = data.agents.filter(a => a.projectId === projectId);
      return {
        totalTasks: tasks.length,
        pendingTasks: tasks.filter(t => t.status === 'pending').length,
        inProgressTasks: tasks.filter(t => t.status === 'in-progress').length,
        completedTasks: tasks.filter(t => t.status === 'completed').length,
        activeAgents: agents.filter(a => a.status === 'active' || a.status === 'busy').length,
      };
    };

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground text-sm mt-1">Active projects and their status</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <FolderKanban className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{data.projects.length}</p>
                  <p className="text-sm text-muted-foreground">Total Projects</p>
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
                  <p className="text-2xl font-bold">{data.projects.filter(p => p.status === 'active').length}</p>
                  <p className="text-sm text-muted-foreground">Active</p>
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
                  <p className="text-2xl font-bold">{data.projects.filter(p => p.status === 'completed').length}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{data.projects.filter(p => p.status === 'paused').length}</p>
                  <p className="text-sm text-muted-foreground">Blocked</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.projects.map((project) => {
            const stats = getProjectStats(project.id);
            const projectTasks = data.tasks.filter(t => (t.projectId || 'unassigned') === project.id).slice(0, 3);
            
            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="bg-card border-border shadow-sm hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        project.status === 'active' ? 'bg-green-500/10 text-green-500' :
                        project.status === 'paused' ? 'bg-yellow-500/10 text-yellow-500' :
                        project.status === 'completed' ? 'bg-blue-500/10 text-blue-500' :
                        'bg-gray-500/10 text-gray-500'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        <span>{stats.completedTasks} done</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{stats.inProgressTasks} in progress</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        <span>{stats.pendingTasks} pending</span>
                      </div>
                    </div>
                    
                    {project.metadata?.repo && (
                      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                        <span className="font-mono">{project.metadata.repo}</span>
                      </div>
                    )}
                    
                    {projectTasks.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-2">Recent tasks:</p>
                        <div className="space-y-1">
                          {projectTasks.map((task) => (
                            <div key={task.id} className="flex items-center gap-2 text-sm">
                              <span className={`w-2 h-2 rounded-full ${
                                task.status === 'completed' ? 'bg-green-500' :
                                task.status === 'in-progress' ? 'bg-yellow-500' :
                                task.status === 'blocked' ? 'bg-red-500' :
                                'bg-gray-500'
                              }`} />
                              <span className="truncate">{task.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAlerts = () => (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">All Alerts</h2>
        <span className="text-sm text-muted-foreground">{data.alerts.length} total</span>
      </div>
      <div className="space-y-3">
        {data.alerts.map(alert => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'agents':
        return renderAgents();
      case 'tasks':
        return renderTasks();
      case 'projects':
        return renderProjects();
      case 'alerts':
        return renderAlerts();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="lg:pl-60 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <DashboardHeader
            onRefresh={() => fetchData()}
            refreshing={refreshing}
            lastUpdated={data.lastUpdated}
            isLive={isLive}
          />
          <TabNav
            activeTab={activeTab}
            onTabChange={setActiveTab}
            alertCount={data.stats.unacknowledgedAlerts}
          />
          <main>{renderContent()}</main>
        </div>
      </div>
    </div>
  );
}
