import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production';
const secret = new TextEncoder().encode(JWT_SECRET); 

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Define paths that don't need authentication
  const isAuthPage = pathname.startsWith('/login') || 
                    pathname.startsWith('/forgot-password') || 
                    pathname.startsWith('/reset-password');
  
  const isPublicApi = pathname.startsWith('/api/auth');
  const isStaticAsset = pathname.includes('.') || pathname.startsWith('/_next');

  if (isAuthPage || isPublicApi || isStaticAsset) {
    return NextResponse.next();
  }

  // 2. Check for auth token
  const token = req.cookies.get('auth-token')?.value;

  if (!token) {
    if (pathname.startsWith('/dashboard')) {
      const url = new URL('/login', req.url);
      url.searchParams.set('callbackUrl', encodeURI(pathname));
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  try {
    // 3. Verify token
    const { payload } = await jose.jwtVerify(token, secret);
    const userRole = (payload.role as string)?.toLowerCase();

    // 4. Role-based access control (RBAC)
    if (pathname.startsWith('/dashboard')) {
      // Admin only routes
      if (pathname.startsWith('/dashboard/settings') && userRole !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }

      // Admin & Internal (Manager) routes
      const managerRoutes = [
        '/dashboard/products',
        '/dashboard/plans',
        '/dashboard/recurring-plans',
        '/dashboard/invoices',
        '/dashboard/payments',
        '/dashboard/reports'
      ];
      if (managerRoutes.some(route => pathname.startsWith(route)) && !['admin', 'internal'].includes(userRole)) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }

      // Customer only routes
      const customerRoutes = [
        '/dashboard/my-invoices',
        '/dashboard/my-payments',
        '/dashboard/shop',
        '/dashboard/help'
      ];
      if (customerRoutes.some(route => pathname.startsWith(route)) && userRole !== 'customer') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    // 5. If already logged in and trying to access login page, redirect to dashboard
    if (isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  } catch (err) {
    // Token is invalid or expired
    const response = NextResponse.redirect(new URL('/login', req.url));
    response.cookies.delete('auth-token');
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
