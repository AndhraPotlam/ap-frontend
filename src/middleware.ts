import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Add paths that don't require authentication
const PUBLIC_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/signup',
  '/auth/forgot-password',
];

// Add paths that require admin access
const ADMIN_PATHS = [
  '/admin',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token');
  const role = request.cookies.get('role')?.value;

  // Debug logging
  console.log('🔍 Middleware check:', {
    pathname,
    hasToken: !!token,
    role,
    url: request.url
  });

  // Handle RSC requests
  if (request.nextUrl.searchParams.has('_rsc')) {
    console.log('🔄 Middleware: RSC request, skipping');
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

  console.log('🔍 Middleware path checks:', {
    isPublicPath,
    isAdminPath,
    pathname
  });

  // If user is authenticated and tries to access auth pages, redirect to home
  if (token && isPublicPath) {
    console.log('🔄 Middleware: Authenticated user on auth page, redirecting to home');
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If no token and trying to access protected route (except public paths)
  if (!token && !isPublicPath) {
    console.log('🔄 Middleware: Unauthenticated user on protected route, redirecting to login');
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // If trying to access admin routes without admin role
  if (isAdminPath && role !== 'admin') {
    console.log('🔄 Middleware: Non-admin user on admin route, redirecting to home');
    return NextResponse.redirect(new URL('/', request.url));
  }

  console.log('✅ Middleware: Allowing request to proceed');
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/auth/:path*',
    '/admin/:path*',
    '/profile',
    '/cart',
    '/orders',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};