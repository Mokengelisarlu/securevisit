import { NextRequest, NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

/**
 * Extracts subdomain from hostname
 * @param hostname - The request hostname (e.g., "admin.example.com", "localhost:3000")
 * @returns The subdomain string, or empty string for main domain
 */
function extractSubdomain(hostname: string): string {
  const host = hostname.split(':')[0]; // remove port
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;

  // Localhost handling
  if (host.includes('localhost')) {
    const parts = host.split('.');
    return parts.length > 1 ? parts[0] : '';
  }

  // If host equals root domain → no tenant
  if (host === rootDomain) {
    return '';
  }

  // If host ends with root domain → extract tenant
  if (host.endsWith(`.${rootDomain}`)) {
    return host.replace(`.${rootDomain}`, '');
  }

  // Otherwise → custom domain tenant (optional advanced feature)
  return '';
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
    // Tenant subdomain
    // /kiosk stays as /kiosk (no path modification)
    if (!url.pathname.startsWith('/kiosk')) {
      // Other routes → route to /tenants/[slug]
      url.pathname = `/tenants/${subdomain}${url.pathname}`;
    }
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
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
