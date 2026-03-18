'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Task } from '@/lib/tasks';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock,
  Repeat
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CronJob {
  schedule: string;
  command: string;
  comment?: string;
  agent?: string;
}

const PRIORITY_DOT_COLORS: Record<string, string> = {
  low: 'bg-slate-400',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
  critical: 'bg-red-600',
};

function CalendarContent() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  }, []);

  const fetchCronJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/calendar/cron');
      const data = await res.json();
      setCronJobs(data.jobs || []);
    } catch (error) {
      console.error('Failed to fetch cron jobs:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchCronJobs();
  }, [fetchData, fetchCronJobs]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days: Date[] = [];
    
    for (let i = 0; i < startingDay; i++) {
      days.push(new Date(year, month, -startingDay + i + 1));
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    return days;
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (task.due_date) {
        const due = new Date(task.due_date);
        return due.toDateString() === date.toDateString();
      }
      if (task.next_run) {
        const next = new Date(task.next_run);
        return next.toDateString() === date.toDateString();
      }
      return false;
    });
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground text-sm mt-1">View tasks and scheduled jobs</p>
        </div>
        <div className="flex items-center gap-4">
          <Tabs value={view} onValueChange={(v) => setView(v as any)}>
            <TabsList className="bg-muted">
              <TabsTrigger value="month" className="text-xs">Month</TabsTrigger>
              <TabsTrigger value="week" className="text-xs">Week</TabsTrigger>
              <TabsTrigger value="day" className="text-xs">Day</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium min-w-[140px] text-center text-sm">
              {formatMonth(currentDate)}
            </span>
            <Button variant="outline" size="icon" onClick={() => navigateMonth(1)} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Scheduled Jobs Card */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium text-sm">Scheduled Jobs</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {cronJobs.length === 0 && (
              <span className="text-sm text-muted-foreground">No cron jobs configured</span>
            )}
            {cronJobs.map((job, i) => (
              <Badge key={i} variant="outline" className="gap-2 bg-background/50 px-2.5 py-1">
                <span className="font-mono text-xs text-muted-foreground">{job.schedule}</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-xs">{job.agent || 'system'}</span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <Card className="bg-card border-border shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-border bg-muted/30">
            {weekDays.map(day => (
              <div key={day} className="p-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {days.map((day, index) => {
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const isToday = day.toDateString() === new Date().toDateString();
              const dayTasks = getTasksForDate(day);
              
              return (
                <div
                  key={index}
                  className={cn(
                    'min-h-[120px] p-2 border-r border-b border-border last:border-r-0',
                    'transition-colors hover:bg-muted/20',
                    !isCurrentMonth && 'bg-muted/20',
                    isToday && 'bg-primary/5'
                  )}
                >
                  {/* Day Number */}
                  <div className={cn(
                    'text-sm font-medium mb-2 w-7 h-7 flex items-center justify-center rounded-full',
                    !isCurrentMonth && 'text-muted-foreground/50',
                    isToday && 'bg-primary text-primary-foreground'
                  )}>
                    {day.getDate()}
                  </div>
                  
                  {/* Tasks */}
                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map(task => (
                      <div
                        key={task.id}
                        className={cn(
                          'text-xs p-1.5 rounded-md border cursor-pointer transition-all',
                          'hover:shadow-sm hover:scale-[1.02]',
                          'bg-primary/5 border-primary/20'
                        )}
                        title={task.title}
                      >
                        <div className="flex items-center gap-1.5">
                          <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', PRIORITY_DOT_COLORS[task.priority] || 'bg-gray-400')} />
                          {task.is_recurring && <Repeat className="h-3 w-3 flex-shrink-0 text-muted-foreground" />}
                          <span className="truncate font-medium">{task.title}</span>
                        </div>
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="text-xs text-muted-foreground text-center py-0.5">
                        +{dayTasks.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CalendarPage() {
  return (
    <DashboardLayout>
      <CalendarContent />
    </DashboardLayout>
  );
}
