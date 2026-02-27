import { extractSubdomain } from './subdomain-utils';

/**
 * Get tenant slug from subdomain
 * For use in server-side contexts where headers are available
 */
export function getTenantSlugFromHost(headers: Headers): string | null {
  const host = headers.get("host")!;
  return extractSubdomain(host);
}

/**
 * Get tenant slug on the client side from hostname
 */
export function getTenantSlugClient(): string | null {
  if (typeof window === 'undefined') return null;

  const hostname = window.location.hostname;
  return extractSubdomain(hostname);
}
