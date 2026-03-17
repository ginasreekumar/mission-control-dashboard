import { NextResponse } from 'next/server';
import { getDashboardData, getStats } from '@/lib/data';

export async function GET() {
  try {
    const data = getDashboardData();
    const stats = getStats();
    
    return NextResponse.json({
      ...data,
      stats,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
