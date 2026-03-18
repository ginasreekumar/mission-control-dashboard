import { NextResponse } from 'next/server';
import { getDashboardData, getStats } from '@/lib/data';
import { getLiveDashboardData } from '@/lib/live-data';

export async function GET() {
  try {
    // Try live data first
    const liveData = await getLiveDashboardData();
    
    if (liveData) {
      // Calculate stats from live data
      const stats = {
        totalAgents: liveData.agents.length,
        activeAgents: liveData.agents.filter(a => a.status === 'active').length,
        totalTasks: liveData.tasks.length,
        pendingTasks: liveData.tasks.filter(t => t.status === 'pending').length,
        inProgressTasks: liveData.tasks.filter(t => t.status === 'in-progress').length,
        completedTasks: liveData.tasks.filter(t => t.status === 'completed').length,
        totalAlerts: liveData.alerts.length,
        unacknowledgedAlerts: liveData.alerts.filter(a => !a.acknowledged).length,
        criticalTasks: liveData.tasks.filter(t => t.priority === 'critical').length,
      };
      
      return NextResponse.json({
        ...liveData,
        stats,
        dataSource: 'live',
      });
    }
    
    // Fallback to static data
    const data = getDashboardData();
    const stats = getStats();
    
    return NextResponse.json({
      ...data,
      stats,
      dataSource: 'static',
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
