import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Add paths that don't require authentication
const PUBLIC_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
];

// Add paths that require admin access
const ADMIN_PATHS = [
  '/admin',
  '/admin/inventory',
  '/admin/categories',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token');
  const role = request.cookies.get('role')?.value;

  // Handle RSC requests
  if (request.nextUrl.searchParams.has('_rsc')) {
    return NextResponse.next({
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  }

  // Check if it's a public path
  const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));
  
  // Check if it's an admin path
  const isAdminPath = ADMIN_PATHS.some(path => pathname.startsWith(path));

  // If user is logged in and tries to access auth pages, redirect to home
  if (token && isPublicPath) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If no token and trying to access protected route
  if (!token && !isPublicPath) {
    const response = NextResponse.redirect(new URL('/auth/login', request.url));
    response.cookies.delete('token');
    response.cookies.delete('role');
    return response;
  }

  // If trying to access admin routes without admin role
  if (isAdminPath && role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public/*)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:jpg|jpeg|gif|png|svg|ico)).*)',
  ],
};