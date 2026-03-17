'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { Task, AgentStatus, formatRecurrence } from '@/lib/tasks';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Repeat } from 'lucide-react';

const COLUMNS = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'review', title: 'Review' },
  { id: 'done', title: 'Done' },
];

const AGENTS = ['gina', 'geordi', 'finch', 'r00t'];

export function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    assigned_to: [] as string[],
    is_recurring: false,
    recurrence_type: 'daily' as const,
    recurrence_time: '09:00',
  });

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  }, []);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/agents/status');
      const data = await res.json();
      setAgents(data.agents || []);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchAgents();
    
    const eventSource = new EventSource('/api/sse');
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.tasks) setTasks(data.tasks);
        if (data.agents) setAgents(data.agents);
      } catch (error) {
        console.error('SSE parse error:', error);
      }
    };
    
    eventSource.onerror = () => {
      console.log('SSE connection lost, retrying...');
    };
    
    return () => eventSource.close();
  }, [fetchData, fetchAgents]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as string;

    if (COLUMNS.some(col => col.id === newStatus)) {
      try {
        await fetch(`/api/tasks/${taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        fetchData();
      } catch (error) {
        console.error('Failed to update task:', error);
      }
    }
  };

  const handleCreateTask = async () => {
    try {
      const taskData: any = {
        title: newTask.title,
        description: newTask.description,
        status: 'backlog',
        priority: newTask.priority,
        assigned_to: newTask.assigned_to,
        created_by: 'user',
        tags: [],
      };

      if (newTask.is_recurring) {
        taskData.is_recurring = true;
        taskData.recurrence = {
          type: newTask.recurrence_type,
          time_of_day: newTask.recurrence_time,
        };
      }

      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });
      
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        assigned_to: [],
        is_recurring: false,
        recurrence_type: 'daily',
        recurrence_time: '09:00',
      });
      setIsCreateOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const toggleAgentAssignment = (agent: string) => {
    setNewTask(prev => ({
      ...prev,
      assigned_to: prev.assigned_to.includes(agent)
        ? prev.assigned_to.filter(a => a !== agent)
        : [...prev.assigned_to, agent]
    }));
  };

  const activeTask = tasks.find(t => t.id === activeId);

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-6">
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background text-foreground border-border max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Task title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="bg-background"
              />
              <Textarea
                placeholder="Description"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="bg-background"
              />
              <Select
                value={newTask.priority}
                onValueChange={(v) => setNewTask({ ...newTask, priority: v as any })}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Agent Assignment */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Assign to Agents</label>
                <div className="flex flex-wrap gap-2">
                  {AGENTS.map(agent => (
                    <Button
                      key={agent}
                      type="button"
                      variant={newTask.assigned_to.includes(agent) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleAgentAssignment(agent)}
                    >
                      @{agent}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Recurring Task */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="recurring"
                  checked={newTask.is_recurring}
                  onCheckedChange={(checked) => 
                    setNewTask({ ...newTask, is_recurring: checked as boolean })
                  }
                />
                <label htmlFor="recurring" className="text-sm font-medium flex items-center gap-1">
                  <Repeat className="h-4 w-4" />
                  Recurring Task
                </label>
              </div>
              
              {newTask.is_recurring && (
                <div className="flex gap-2">
                  <Select
                    value={newTask.recurrence_type}
                    onValueChange={(v) => setNewTask({ ...newTask, recurrence_type: v as any })}
                  >
                    <SelectTrigger className="bg-background flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="interval">Interval (hours)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="time"
                    value={newTask.recurrence_time}
                    onChange={(e) => setNewTask({ ...newTask, recurrence_time: e.target.value })}
                    className="bg-background w-24"
                  />
                </div>
              )}
              
              <Button onClick={handleCreateTask} className="w-full">
                Create Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Agent Status Bar */}
      <div className="flex gap-4 mb-6 p-4 bg-muted rounded-lg border border-border">
        {agents.map((agent) => (
          <div key={agent.agent} className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                agent.status === 'working' ? 'bg-yellow-500' :
                agent.status === 'error' ? 'bg-red-500' :
                'bg-green-500'
              }`}
            />
            <span className="text-sm font-medium text-foreground">{agent.agent}</span>
            <span className="text-xs text-muted-foreground">
              {agent.status === 'working' && agent.current_task
                ? `• ${agent.current_task.slice(0, 20)}...`
                : `• ${agent.status}`}
            </span>
          </div>
        ))}
        {agents.length === 0 && (
          <span className="text-sm text-muted-foreground">No agents connected</span>
        )}
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 h-[calc(100vh-280px)]">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              tasks={tasks.filter((t) => t.status === column.id)}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
