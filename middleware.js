// middleware.js
import { NextResponse } from 'next/server';
import { locales, defaultLocale } from './src/i18n/config';

// List of public routes that don't require authentication
const publicRoutes = ['/login', '/register', '/about', '/privacy', '/terms', '/'];

export function middleware(request) {
  const { pathname, origin } = request.nextUrl;

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  // Check if the URL already has a valid locale
  const pathnameHasLocale = locales.some(
    locale => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );

  // If URL doesn't have locale, redirect to add the default locale
  if (!pathnameHasLocale) {
    // For root path, redirect to default locale
    if (pathname === '/') {
      return NextResponse.redirect(new URL(`/${defaultLocale}`, request.url));
    }
    
    // For other paths, add the locale prefix
    return NextResponse.redirect(new URL(`/${defaultLocale}${pathname}`, request.url));
  }

  // Handle API authentication
  if (pathname.startsWith('/api/auth/')) {
    // Public API endpoints don't need authentication
    if (pathname === '/api/auth/login/' ||
        pathname === '/api/auth/register/' ||
        pathname === '/api/auth/refresh/') {
      return NextResponse.next();
    }
   
    // Check for authentication token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { detail: 'Authentication required' },
        { status: 401 }
      );
    }
   
    return NextResponse.next();
  }

  // Extract the locale from the pathname
  const locale = pathnameHasLocale ? pathname.split('/')[1] : defaultLocale;

  // Set locale cookie
  const response = NextResponse.next();
  response.cookies.set('NEXT_LOCALE', locale, {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/'
  });

  // Extract the path without the locale prefix for route matching
  const pathWithoutLocale = pathnameHasLocale 
    ? pathname.substring(locale.length + 1) || '/'
    : pathname;

  // Check if it's a public route that doesn't require authentication
  const isPublicRoute = publicRoutes.some(route =>
    pathWithoutLocale === route || pathWithoutLocale.startsWith(`${route}/`)
  );

  if (isPublicRoute) {
    return response;
  }

  // For protected routes, check if user is authenticated
  const hasToken = request.cookies.has('accessToken') ||
                   request.headers.get('authorization')?.startsWith('Bearer ');

  // If not authenticated, redirect to login
  if (!hasToken) {
    const loginUrl = new URL(`/${locale}/login`, origin);
    // Add the 'from' parameter to redirect back after login
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // User is authenticated, proceed
  return response;
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    // Apply to all routes except specific static assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)',
    // Include API auth routes
    '/api/auth/:path*'
  ],
};