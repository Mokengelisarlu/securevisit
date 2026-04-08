import { type Metadata } from 'next'
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { Geist, Geist_Mono, Sora, Inter } from 'next/font/google'
import './globals.css'
import { SyncWrapper } from '@/components/SyncWrapper'
import QueryProvider from '@/components/ReactQueryProvider'
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const sora = Sora({
  variable: '--font-sora',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'SecureVisit',
  description: 'Powered by Mokengeli Sarlu',
  icons: {
    icon: [
      { url: '/icon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icon-144x144.png', sizes: '144x144', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} ${sora.variable} ${inter.variable} antialiased`}>
          <QueryProvider>
            {children}
            <Toaster />
            <SyncWrapper />
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}