'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardAgent, DashboardTask, DashboardAlert, ViewMode } from '@/lib/types';
import { DashboardHeader } from './DashboardHeader';
import { TabNav } from './TabNav';
import { StatsGrid } from './StatsGrid';
import { AgentCard } from './AgentCard';
import { DashboardTaskCard } from './DashboardTaskCard';
import { AlertCard } from './AlertCard';

interface DashboardDataResponse {
  agents: DashboardAgent[];
  tasks: DashboardTask[];
  alerts: DashboardAlert[];
  lastUpdated: string;
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

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/dashboard');
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
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
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
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <StatsGrid stats={data.stats} />
            
            <div className="grid lg:grid-cols-2 gap-6">
              <section>
                <h2 className="text-lg font-semibold mb-3">Active Agents</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {data.agents.slice(0, 4).map(agent => (
                    <AgentCard key={agent.id} agent={agent} />
                  ))}
                </div>
              </section>
              
              <section>
                <h2 className="text-lg font-semibold mb-3">Recent Alerts</h2>
                <div className="space-y-3">
                  {data.alerts.slice(0, 3).map(alert => (
                    <AlertCard key={alert.id} alert={alert} />
                  ))}
                </div>
              </section>
            </div>
            
            <section>
              <h2 className="text-lg font-semibold mb-3">In Progress Tasks</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.tasks
                  .filter(t => t.status === 'in-progress')
                  .slice(0, 3)
                  .map(task => (
                    <DashboardTaskCard key={task.id} task={task} />
                  ))}
              </div>
            </section>
          </div>
        );
        
      case 'agents':
        return (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.agents.map(agent => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        );
        
      case 'tasks':
        return (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.tasks.map(task => (
              <DashboardTaskCard key={task.id} task={task} />
            ))}
          </div>
        );
        
      case 'alerts':
        return (
          <div className="space-y-3 max-w-3xl">
            {data.alerts.map(alert => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <DashboardHeader
          onRefresh={fetchData}
          refreshing={refreshing}
          lastUpdated={data.lastUpdated}
        />
        <TabNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          alertCount={data.stats.unacknowledgedAlerts}
        />
        <main>{renderContent()}</main>
      </div>
    </div>
  );
}
