'use client';

import { useState, useCallback, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderKanban, Clock, CheckCircle2, AlertCircle, Users, GitBranch, Plus, Edit2 } from 'lucide-react';
import { ProjectModal } from '@/components/ProjectModal';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
  tags: string[];
  metadata?: {
    repo?: string;
    priority?: string;
  };
}

interface ProjectStats {
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
}

interface ProjectsData {
  projects: Project[];
  projectStats: Record<string, ProjectStats>;
  recentTasks: Record<string, Array<{ id: string; title: string; status: string }>>;
}

function ProjectsContent() {
  const [data, setData] = useState<ProjectsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      const json = await res.json();
      
      // Fetch stats for each project
      const stats: Record<string, ProjectStats> = {};
      const tasks: Record<string, Array<{ id: string; title: string; status: string }>> = {};
      
      for (const project of json.projects) {
        const detailRes = await fetch(`/api/projects/${project.id}`);
        if (detailRes.ok) {
          const detail = await detailRes.json();
          stats[project.id] = detail.stats;
          tasks[project.id] = detail.tasks?.slice(0, 3) || [];
        }
      }
      
      setData({
        projects: json.projects,
        projectStats: stats,
        recentTasks: tasks,
      });
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingProject(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const projects = data?.projects || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage projects and track progress</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <FolderKanban className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{projects.length}</p>
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
                <p className="text-2xl font-bold">{projects.filter(p => p.status === 'active').length}</p>
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
                <p className="text-2xl font-bold">{projects.filter(p => p.status === 'completed').length}</p>
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
                <p className="text-2xl font-bold">{projects.filter(p => p.status === 'paused').length}</p>
                <p className="text-sm text-muted-foreground">Blocked</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((project) => {
          const stats = data?.projectStats[project.id] || { totalTasks: 0, pendingTasks: 0, inProgressTasks: 0, completedTasks: 0 };
          const tasks = data?.recentTasks[project.id] || [];
          
          return (
            <Card key={project.id} className="bg-card border-border shadow-sm hover:border-primary/50 transition-colors h-full">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <Link href={`/projects/${project.id}`} className="flex-1">
                    <CardTitle className="text-lg hover:text-primary transition-colors">{project.name}</CardTitle>
                  </Link>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(project)}
                      className="p-1.5 rounded-md hover:bg-muted transition-colors"
                      title="Edit project"
                    >
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      project.status === 'active' ? 'bg-green-500/10 text-green-500' :
                      project.status === 'paused' ? 'bg-yellow-500/10 text-yellow-500' :
                      project.status === 'completed' ? 'bg-blue-500/10 text-blue-500' :
                      'bg-gray-500/10 text-gray-500'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-ibold mt-1">{project.description}</p>
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
                    <GitBranch className="h-3 w-3" />
                    <span>{project.metadata.repo}</span>
                  </div>
                )}
                
                {tasks.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-2">Recent tasks:</p>
                    <div className="space-y-1">
                      {tasks.map((task) => (
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
          );
        })}
      </div>

      <ProjectModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        project={editingProject}
        onSuccess={fetchData}
      />
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <DashboardLayout>
      <ProjectsContent />
    </DashboardLayout>
  );
}
