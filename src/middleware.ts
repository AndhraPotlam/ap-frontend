import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const role = request.cookies.get('role')?.value;
  const { pathname } = request.nextUrl;

  const isPublicAuthPath = pathname.startsWith('/auth/');
  const isAdminPath = pathname.startsWith('/admin/');
  const isDashboardPath = pathname.startsWith('/dashboard/');
  const isProtectedUserPath = 
    pathname.startsWith('/profile') || 
    pathname.startsWith('/orders') || 
    pathname.startsWith('/checkout');

  // 1. If logged in and trying to access auth pages (login, register, etc.), redirect to home or dashboard
  if (token && isPublicAuthPath) {
    if (role === 'admin' || role === 'employee') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 2. If NOT logged in and trying to access protected paths, redirect to login
  if (!token && (isAdminPath || isDashboardPath || isProtectedUserPath)) {
    const loginUrl = new URL('/auth/login', request.url);
    // Keep track of the page they wanted to visit
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. If logged in as non-admin trying to access admin paths, redirect to dashboard or home
  if (token && isAdminPath && role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (local images or public assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
};
