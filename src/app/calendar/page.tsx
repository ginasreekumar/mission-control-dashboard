'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Task, formatRecurrence } from '@/lib/tasks';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
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

const PRIORITY_COLORS = {
  low: 'bg-slate-500',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
};

export default function CalendarPage() {
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <div className="flex items-center gap-4">
          <Tabs value={view} onValueChange={(v) => setView(v as any)}>
            <TabsList>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="day">Day</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium min-w-[140px] text-center]">
              {formatMonth(currentDate)}
            </span>
            <Button variant="outline" size="icon" onClick={() => navigateMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium">Scheduled Jobs</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {cronJobs.length === 0 && (
              <span className="text-sm text-muted-foreground">No cron jobs configured</span>
            )}
            {cronJobs.map((job, i) => (
              <Badge key={i} variant="outline" className="gap-1 bg-background">
                <span className="font-mono text-xs">{job.schedule}</span>
                <span className="text-muted-foreground">•</span>
                <span>{job.agent || 'system'}</span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b border-border">
            {weekDays.map(day => (
              <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7">
            {days.map((day, index) => {
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const isToday = day.toDateString() === new Date().toDateString();
              const dayTasks = getTasksForDate(day);
              
              return (
                <div
                  key={index}
                  className={cn(
                    'min-h-[100px] p-2 border-r border-b border-border last:border-r-0',
                    !isCurrentMonth && 'bg-muted/30',
                    isToday && 'bg-primary/5'
                  )}
                >
                  <div className={cn(
                    'text-sm font-medium mb-1',
                    !isCurrentMonth && 'text-muted-foreground',
                    isToday && 'text-primary'
                  )}>
                    {day.getDate()}
                  </div>
                  
                  <div className="space-y-1">
                    {dayTasks.map(task => (
                      <div
                        key={task.id}
                        className={cn(
                          'text-xs p-1 rounded border truncate cursor-pointer',
                          'bg-primary/10 border-primary/30'
                        )}
                        title={task.title}
                      >
                        <div className="flex items-center gap-1">
                          <div className={cn('w-1.5 h-1.5 rounded-full', PRIORITY_COLORS[task.priority])} />
                          {task.is_recurring && <Repeat className="h-3 w-3" />}
                          <span className="truncate">{task.title}</span>
                        </div>
                      </div>
                    ))}
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
