import { type Metadata } from 'next'
import { getPublicTenantBySlug } from '@/features/tenants/queries/tenant-data'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const tenant = await getPublicTenantBySlug(slug).catch(() => null)
  const tenantName = tenant?.name ?? 'Kiosk'

  return {
    title: `${tenantName} — Kiosk`,
    description: `Borne d'accueil visiteurs — ${tenantName}`,
    manifest: `/tenants/${slug}/kiosk/manifest.webmanifest`,
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: tenantName,
    },
    other: {
      // Prevent phone number detection on kiosk
      'format-detection': 'telephone=no',
      // Keep screen on hint (browser-level, tablets may honor it)
      'mobile-web-app-capable': 'yes',
    },
    viewport: {
      width: 'device-width',
      initialScale: 1,
      maximumScale: 1,
      userScalable: false,
      viewportFit: 'cover',
    },
    icons: {
      apple: [
        { url: '/icon-152x152.png', sizes: '152x152', type: 'image/png' },
        { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      ],
    },
  }
}

export default function KioskLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Prevent zoom / pull-to-refresh on touch devices */}
      <style>{`
        html, body {
          overscroll-behavior: none;
          touch-action: manipulation;
          -webkit-user-select: none;
          user-select: none;
        }
      `}</style>
      {children}
    </>
  )
}
