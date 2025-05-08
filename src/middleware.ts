import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthPage = pathname.startsWith('/auth/');
  const isAdminPage = pathname.startsWith('/admin/');
  const token = request.cookies.get('token');

  // Handle RSC requests first
  if (request.nextUrl.searchParams.has('_rsc')) {
    // For auth pages, don't prefetch
    if (isAuthPage) {
      return new NextResponse(null, { status: 404 });
    }
    
    return NextResponse.next({
      headers: {
        'Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
        'CDN-Cache-Control': 'no-store',
      },
    });
  }

  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  if (token && isAuthPage) {
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
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};