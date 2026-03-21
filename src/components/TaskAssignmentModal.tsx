'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FolderKanban, User, X } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
}

interface Agent {
  id: string;
  name: string;
  emoji: string;
  status: 'active' | 'idle' | 'busy' | 'offline' | 'error';
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  projectId?: string;
  agentId?: string;
}

interface TaskAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  projects: Project[];
  agents: Agent[];
  onSuccess: () => void;
}

export function TaskAssignmentModal({ isOpen, onClose, task, projects, agents, onSuccess }: TaskAssignmentModalProps) {
  const [selectedProject, setSelectedProject] = useState<string | null>(task.projectId || null);
  const [selectedAgents, setSelectedAgents] = useState<string[]>(task.agentId ? [task.agentId] : []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Update project assignment
      if (selectedProject !== task.projectId) {
        const res = await fetch('/api/tasks/assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId: task.id,
            projectId: selectedProject,
          }),
        });
        if (!res.ok) throw new Error('Failed to update project assignment');
      }

      // Update agent assignments
      // First unassign any agents that were removed
      const currentAgents = task.agentId ? [task.agentId] : [];
      const agentsToRemove = currentAgents.filter(a => !selectedAgents.includes(a));
      const agentsToAdd = selectedAgents.filter(a => !currentAgents.includes(a));

      for (const agentId of agentsToRemove) {
        await fetch('/api/tasks/assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId: task.id, agentId, unassign: true }),
        });
      }

      for (const agentId of agentsToAdd) {
        await fetch('/api/tasks/assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId: task.id, agentId }),
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const toggleAgent = (agentId: string) => {
    if (selectedAgents.includes(agentId)) {
      setSelectedAgents(selectedAgents.filter(id => id !== agentId));
    } else {
      setSelectedAgents([...selectedAgents, agentId]);
    }
  };

  const activeProjects = projects.filter(p => p.status === 'active');
  const activeAgents = agents.filter(a => a.status !== 'offline');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5" />
            Assign Task
          </DialogTitle>
          <DialogDescription>
            Assign "{task.title}" to a project and agents.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Project Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <FolderKanban className="w-4 h-4" />
              Project
            </label>
            <select
              value={selectedProject || ''}
              onChange={(e) => setSelectedProject(e.target.value || null)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="">Unassigned</option>
              {activeProjects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Agent Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4" />
              Assigned Agents
            </label>
            <div className="grid grid-cols-2 gap-2">
              {activeAgents.map(agent => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => toggleAgent(agent.id)}
                  className={`flex items-center gap-2 p-2 rounded-lg border transition-colors text-left ${
                    selectedAgents.includes(agent.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className="text-lg">{agent.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{agent.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{agent.status}</p>
                  </div>
                  {selectedAgents.includes(agent.id) && (
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
            {selectedAgents.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedAgents.map(agentId => {
                  const agent = agents.find(a => a.id === agentId);
                  if (!agent) return null;
                  return (
                    <span key={agentId} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                      {agent.emoji} {agent.name}
                      <button
                        type="button"
                        onClick={() => toggleAgent(agentId)}
                        className="hover:text-primary/70"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/50 rounded-md">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Assignment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
