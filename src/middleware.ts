import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession, getCookieValue, COOKIE_NAME } from '@/lib/auth';

// Public paths that don't require authentication
const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout'];

// Static assets and PWA files
const STATIC_PATHS = ['/manifest.json', '/sw.js', '/icons/', '/favicon'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Allow static assets
  if (STATIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check for session cookie
  const cookieHeader = request.headers.get('cookie');
  const token = getCookieValue(cookieHeader, COOKIE_NAME);

  if (!token) {
    // Redirect to login if no token
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify token
  const session = await verifySession(token);

  if (!session || !session.authenticated) {
    // Clear invalid cookie and redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' });
    return response;
  }

  // Token valid, proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|.*\\.png$|.*\\.ico$|.*\\.svg$).*)',
  ],
};
