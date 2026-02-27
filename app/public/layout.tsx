"use client";

import { ClerkProvider } from '@clerk/nextjs'
import QueryProvider from '@/components/ReactQueryProvider'
import { Toaster } from "sonner"
import { PublicHeader } from '@/components/PublicHeader'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <QueryProvider>
        <PublicHeader />
        {children}
        <Toaster />
      </QueryProvider>
    </ClerkProvider>
  )
}
