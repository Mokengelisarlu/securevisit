import { NextRequest, NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

/**
 * Extracts subdomain from hostname
 * @param hostname - The request hostname (e.g., "admin.example.com", "localhost:3000")
 * @returns The subdomain string, or empty string for main domain
 */
function extractSubdomain(hostname: string): string {
  // Handle localhost cases
  if (hostname.includes('localhost')) {
    // Remove port number if present (e.g., "admin.localhost:3000" -> "admin.localhost")
    const hostWithoutPort = hostname.split(':')[0];

    // If it's just "localhost", return 'localhost' (represents main domain)
    if (hostWithoutPort === 'localhost') {
      return 'localhost';
    }

    // Otherwise, extract subdomain (e.g., "admin.localhost" -> "admin")
    const parts = hostWithoutPort.split('.');
    return parts[0];
  }

  // Handle domain cases (e.g., example.com, admin.example.com)
  const parts = hostname.split('.');

  // If only one part (just domain), return empty string
  if (parts.length <= 1) {
    return '';
  }

  // Get the first part (potential subdomain)
  const subdomain = parts[0];

  // If subdomain is 'www', treat as main domain (return empty)
  if (subdomain === 'www') {
    return '';
  }

  return subdomain;
}

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/public(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/sync-user(.*)',
  '/kiosk(.*)',
]);

// Define shared routes that always route to /public regardless of subdomain
const isGlobalSharedRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const hostname = request.headers.get('host') || '';
  const subdomain = extractSubdomain(hostname);

  const url = request.nextUrl.clone();

  // 🚀 Skip subdomain logic for API routes to avoid 404s
  if (url.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Route based on subdomain
  if (subdomain === 'admin') {
    // Admin subdomain → route to /admin
    url.pathname = `/admin${url.pathname}`;
  } else if (
    subdomain === '' ||
    subdomain === 'www' ||
    subdomain === 'localhost' ||
    subdomain === 'app' ||
    isGlobalSharedRoute(request)
  ) {
    // Main domain OR global shared route → route to /public
    url.pathname = `/public${url.pathname}`;
  } else {
    // Tenant subdomain → route to /tenants/[slug] and set tenant slug header
    url.pathname = `/tenants/${subdomain}${url.pathname}`;
  }

  // Create response and set tenant slug header
  const response = NextResponse.rewrite(url);

  // Set tenant slug in header for dashboard routes (tenant subdomains only)
  if (
    subdomain !== 'admin' &&
    subdomain !== '' &&
    subdomain !== 'www' &&
    subdomain !== 'localhost'
  ) {
    response.headers.set('x-tenant-slug', subdomain);
  }

  // Protect non-public routes (enforce Clerk authentication)
  if (!isPublicRoute(request)) {
    await auth.protect()
  }

  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
