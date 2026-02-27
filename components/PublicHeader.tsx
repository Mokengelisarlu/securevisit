"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export function PublicHeader() {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-bold text-primary">
            VMS
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/features" className="text-sm font-semibold text-gray-500 hover:text-primary transition-colors">
              Fonctionnalités
            </Link>
          </nav>
        </div>

        <nav className="flex items-center gap-4">
          <SignedOut>
            <Button variant="ghost" asChild>
              <Link href="/sign-in">Se connecter</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">S'inscrire</Link>
            </Button>
          </SignedOut>

          <SignedIn>
            <Button asChild variant="outline">
              <Link href="/tenants">Dashboard</Link>
            </Button>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </nav>
      </div>
    </header>
  );
}
