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

function generateProjectId(name: string): string {
  return 'proj-' + name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, status = 'active', tags = [], metadata } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    const projects = await readProjects();
    
    // Generate ID from name
    const id = generateProjectId(name);
    
    // Check for duplicate
    if (projects.some(p => p.id === id)) {
      return NextResponse.json(
        { error: 'A project with this name already exists' },
        { status: 409 }
      );
    }

    const newProject: Project = {
      id,
      name,
      description: description || '',
      status: status as Project['status'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tags: Array.isArray(tags) ? tags : [],
      metadata: metadata || {},
    };

    projects.push(newProject);
    await writeProjects(projects);

    return NextResponse.json({ project: newProject }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
