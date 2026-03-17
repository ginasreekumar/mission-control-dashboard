import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';

const BASE_DIR = '/home/siju/WORK/GINA';

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified: string;
  extension?: string;
}

async function scanDirectory(dir: string, basePath: string = ''): Promise<FileItem[]> {
  const items: FileItem[] = [];
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      
      const fullPath = join(dir, entry.name);
      const relativePath = join(basePath, entry.name);
      
      if (entry.isDirectory()) {
        items.push({
          name: entry.name,
          path: relativePath,
          type: 'directory',
          modified: new Date().toISOString(),
        });
        if (basePath.split('/').length < 3) {
          const subItems = await scanDirectory(fullPath, relativePath);
          items.push(...subItems);
        }
      } else {
        const stats = await fs.stat(fullPath);
        const ext = entry.name.split('.').pop()?.toLowerCase();
        items.push({
          name: entry.name,
          path: relativePath,
          type: 'file',
          size: stats.size,
          modified: stats.mtime.toISOString(),
          extension: ext,
        });
      }
    }
  } catch (error) {
    console.error(`Error scanning ${dir}:`, error);
  }
  
  return items;
}

export async function GET() {
  try {
    const files = await scanDirectory(BASE_DIR);
    return NextResponse.json({ files });
  } catch (error) {
    console.error('Failed to scan files:', error);
    return NextResponse.json({ files: [] }, { status: 500 });
  }
}
