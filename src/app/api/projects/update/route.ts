import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';

const MISSION_CONTROL_DIR = process.env.MISSION_CONTROL_DIR || '/home/siju/WORK/GINA/mission-control';
const PROJECTS_FILE = join(MISSION_CONTROL_DIR, 'data/projects.json');

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

async function readProjects(): Promise<Project[]> {
  try {
    const data = await fs.readFile(PROJECTS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed.projects || [];
  } catch (error) {
    return [];
  }
}

async function writeProjects(projects: Project[]): Promise<void> {
  await fs.mkdir(join(MISSION_CONTROL_DIR, 'data'), { recursive: true });
  await fs.writeFile(PROJECTS_FILE, JSON.stringify({ projects }, null, 2));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, status, tags, metadata } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const projects = await readProjects();
    const projectIndex = projects.findIndex(p => p.id === id);
    
    if (projectIndex === -1) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Update fields
    const updatedProject: Project = {
      ...projects[projectIndex],
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status: status as Project['status'] }),
      ...(tags !== undefined && { tags: Array.isArray(tags) ? tags : projects[projectIndex].tags }),
      ...(metadata !== undefined && { metadata: { ...projects[projectIndex].metadata, ...metadata } }),
      updated_at: new Date().toISOString(),
    };

    projects[projectIndex] = updatedProject;
    await writeProjects(projects);

    return NextResponse.json({ project: updatedProject });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}
