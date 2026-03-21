import { NextResponse } from 'next/server';
import { getProjects, getProjectStats } from '@/lib/data';

export async function GET() {
  try {
    const projects = getProjects();
    
    // Enhance with stats
    const projectsWithStats = projects.map(project => ({
      ...project,
      stats: getProjectStats(project.id)
    }));
    
    return NextResponse.json({ 
      projects: projectsWithStats,
      count: projects.length 
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}
