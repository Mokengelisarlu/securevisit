/**
 * Utility functions for subdomain extraction and validation
 */

export function extractSubdomain(hostname: string): string | null {
  // Remove port for processing
  const domain = hostname.split(':')[0].toLowerCase();

  // Check if it's localhost
  if (domain === 'localhost') {
    return null;
  }

  // For production domains, extract subdomain
  const parts = domain.split('.');

  // If only one part, it's the root domain
  if (parts.length <= 2) {
    return null;
  }

  // Return the first part (subdomain)
  return parts[0];
}

export function isValidSubdomain(slug: string): boolean {
  // Must be lowercase alphanumeric with hyphens
  return /^[a-z0-9-]+$/.test(slug) && slug.length >= 2 && slug.length <= 20;
}

export function isReservedSubdomain(
  slug: string,
  reserved: string[] = []
): boolean {
  const defaultReserved = [
    'www',
    'mail',
    'ftp',
    'admin',
    'api',
    'app',
    'dashboard',
    'chat',
    'files',
    'blog',
    'docs',
    'support',
    'help',
  ];

  const allReserved = [...defaultReserved, ...reserved];
  return allReserved.includes(slug.toLowerCase());
}

export function getTenantUrl(
  slug: string,
  domain: string = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost',
  protocol?: string
): string {
  // Localhost dev runs on port 3000 over http; production defaults to https
  if (domain.includes('localhost')) {
    return `${protocol ?? 'http'}://${slug}.localhost:3000`;
  }

  return `${protocol ?? 'https'}://${slug}.${domain}`;
}

export function getMainAppUrl(
  domain: string = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000',
  protocol?: string
): string {
  if (domain.includes('localhost')) {
    return `${protocol ?? 'http'}://localhost:3000`;
  }

  return `${protocol ?? 'https'}://${domain}`;
}
