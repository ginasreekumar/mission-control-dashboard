import { NextResponse } from 'next/server';
import { getCronJobs } from '@/lib/tasks-server';

export async function GET() {
  try {
    const jobs = await getCronJobs();
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Failed to fetch cron jobs:', error);
    return NextResponse.json({ jobs: [] });
  }
}
