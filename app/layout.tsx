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