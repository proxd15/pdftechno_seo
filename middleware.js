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
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/api/')
  ) {
    return NextResponse.next();
  }

  // Check if the path starts with a non-default locale
  const pathnameHasLocale = locales
    .filter(locale => locale !== defaultLocale)
    .some(locale => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));

  // Extract locale from pathname or use default
  let locale = defaultLocale;
  let pathWithoutLocale = pathname;

  if (pathnameHasLocale) {
    const segments = pathname.split('/');
    locale = segments[1];
    pathWithoutLocale = '/' + segments.slice(2).join('/') || '/';
  }

  // Set locale cookie
  const response = NextResponse.next();
  response.cookies.set('NEXT_LOCALE', locale, {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/'
  });

  // Add locale to headers for server components
  response.headers.set('x-locale', locale);

  // Check if it's a public route
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
    const loginPath = locale === defaultLocale ? '/login' : `/${locale}/login`;
    const loginUrl = new URL(loginPath, origin);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)',
  ],
};