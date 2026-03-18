'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardAgent, DashboardTask, DashboardAlert, ViewMode } from '@/lib/types';
import { DashboardHeader } from './DashboardHeader';
import { TabNav } from './TabNav';
import { StatsGrid } from './StatsGrid';
import { AgentCard } from './AgentCard';
import { DashboardTaskCard } from './DashboardTaskCard';
import { AlertCard } from './AlertCard';
import { Sidebar } from './Sidebar';
import { Activity, ArrowRight, Zap, Database, Radio } from 'lucide-react';

interface DashboardDataResponse {
  agents: DashboardAgent[];
  tasks: DashboardTask[];
  alerts: DashboardAlert[];
  lastUpdated: string;
  dataSource?: 'live' | 'static';
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
  };
}

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<ViewMode>('overview');
  const [data, setData] = useState<DashboardDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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

  const isLive = data.dataSource === 'live';

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <StatsGrid stats={data.stats} />
      
      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Agents */}
        <div className="lg:col-span-2 space-y-6">
          {/* Agent Health Panel */}
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
          
          {/* Task Pipeline */}
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
                    <DashboardTaskCard key={task.id} task={task} />
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
        
        {/* Right Column - Alerts & Activity */}
        <div className="space-y-6">
          {/* Alerts Panel */}
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
          
          {/* Data Status */}
          <section className={`rounded-xl border overflow-hidden ${isLive ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20' : 'border-border bg-muted/30'} p-4`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${isLive ? 'bg-green-100 dark:bg-green-900/50' : 'bg-amber-100 dark:bg-amber-950/50'}`}>
                {isLive ? (
                  <Radio className="w-4 h-4 text-green-600 dark:text-green-400" />
                ) : (
                  <Database className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                )}
              </div>
              <div>
                <h3 className={`font-medium text-sm ${isLive ? 'text-green-800 dark:text-green-200' : ''}`}>
                  {isLive ? 'Live Data Mode' : 'Demo Data Mode'}
                </h3>
                <p className={`text-xs mt-1 ${isLive ? 'text-green-700 dark:text-green-300' : 'text-muted-foreground'}`}>
                  {isLive 
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

  const renderTasks = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">All Tasks</h2>
        <span className="text-sm text-muted-foreground">{data.tasks.length} total</span>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.tasks.map(task => (
          <DashboardTaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );

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
