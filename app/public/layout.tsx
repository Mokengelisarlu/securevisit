"use client";

import { ClerkProvider } from '@clerk/nextjs'
import QueryProvider from '@/components/ReactQueryProvider'
import { Toaster } from "sonner"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <QueryProvider>
        {children}
        <Toaster />
      </QueryProvider>
    </ClerkProvider>
  )
}
