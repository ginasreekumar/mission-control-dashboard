import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';

const BASE_DIR = '/home/siju/WORK/GINA';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get('path');
  
  if (!filePath) {
    return NextResponse.json({ error: 'Path required' }, { status: 400 });
  }
  
  // Security: ensure path doesn't escape base directory
  const sanitizedPath = filePath.replace(/\.\./g, '').replace(/^\//, '');
  const fullPath = join(BASE_DIR, sanitizedPath);
  
  // Additional security check
  if (!fullPath.startsWith(BASE_DIR)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 403 });
  }
  
  try {
    const content = await fs.readFile(fullPath, 'utf-8');
    return NextResponse.json({ content });
  } catch (error) {
    console.error(`Failed to read file ${fullPath}:`, error);
    return NextResponse.json({ error: 'Failed to read file' }, { status: 500 });
  }
}
