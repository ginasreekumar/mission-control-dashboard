import { NextResponse } from 'next/server';
import { createSession, setSessionCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    
    const expectedPassword = process.env.DASHBOARD_PASSWORD;
    
    if (!expectedPassword) {
      console.error('DASHBOARD_PASSWORD environment variable not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    if (password !== expectedPassword) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }
    
    // Create session
    const token = await createSession();
    
    const response = NextResponse.json({ success: true });
    response.headers.set('Set-Cookie', setSessionCookie(token));
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
