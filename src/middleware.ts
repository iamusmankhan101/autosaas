import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect from /en/path to /path
  if (pathname.startsWith('/en/')) {
    const newPath = pathname.replace('/en/', '/');
    return NextResponse.redirect(new URL(newPath, request.url));
  }
  
  if (pathname === '/en') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/en/:path*', '/en']
};
