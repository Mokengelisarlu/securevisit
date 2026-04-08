import { MetadataRoute } from 'next'
import { getPublicTenantBySlug } from '@/features/tenants/queries/tenant-data'

export default async function manifest({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<MetadataRoute.Manifest> {
  const { slug } = await params
  const tenant = await getPublicTenantBySlug(slug).catch(() => null)
  const tenantName = tenant?.name ?? 'Kiosk'

  return {
    name: `${tenantName} — Kiosk`,
    short_name: tenantName,
    description: `Borne d'accueil visiteurs — ${tenantName}`,
    start_url: `/tenants/${slug}/kiosk`,
    scope: `/tenants/${slug}/kiosk`,
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0f172a',
    theme_color: '#0DBDB5',
    icons: [
      {
        src: '/icon-48x48.png',
        sizes: '48x48',
        type: 'image/png',
      },
      {
        src: '/icon-72x72.png',
        sizes: '72x72',
        type: 'image/png',
      },
      {
        src: '/icon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
      },
      {
        src: '/icon-128x128.png',
        sizes: '128x128',
        type: 'image/png',
      },
      {
        src: '/icon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
      },
      {
        src: '/icon-152x152.png',
        sizes: '152x152',
        type: 'image/png',
      },
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-256x256.png',
        sizes: '256x256',
        type: 'image/png',
      },
      {
        src: '/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
