'use client';

import { SignIn } from '@clerk/nextjs';
import { Shield } from 'lucide-react';
import Link from 'next/link';

export default function SignInPage() {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-slate-100 px-6">

      {/* Centered Content Stack */}
      <div className="relative z-10 w-full max-w-[480px] flex flex-col items-center">
        {/* Brand Header */}
        <Link
          href="/"
          className="flex flex-col items-center justify-center mb-10 hover:opacity-80 transition-opacity"
        >
          <span
            className="font-black text-3xl text-slate-900 tracking-tighter"
            style={{ fontFamily: 'Sora, sans-serif' }}
          >
            SecureVisit
          </span>
        </Link>

        {/* SignIn Container */}
        <div className="w-full place-items-center">
          <SignIn
            routing="path"
            path="/sign-in"
            forceRedirectUrl="/dashboard"
            appearance={{
              elements: {
                rootBox: 'w-full flex justify-center',
                card: 'bg-white shadow-2xl border-none rounded-3xl p-4 w-full',
                headerTitle: 'text-2xl font-semibold text-[#0E1116] text-center w-full',
                headerSubtitle: 'text-[#6B7280] text-center w-full',
                socialButtonsBlockButton: 'border-[#E5E7EB] hover:bg-gray-50 rounded-xl transition-colors',
                socialButtonsBlockButtonText: 'font-medium text-[#0E1116]',
                dividerLine: 'bg-[#E5E7EB]',
                dividerText: 'text-[#9CA3AF]',
                formFieldLabel: 'text-[#374151] font-medium mb-1.5',
                formFieldInput: 'bg-[#F9FAFB] border-[#E5E7EB] focus:border-[#1E6EE6] focus:ring-[#1E6EE6]/20 rounded-xl py-3',
                formButtonPrimary: 'bg-[#1E6EE6] hover:bg-[#1a5fcc] text-white py-3 rounded-xl font-medium shadow-lg shadow-[#1E6EE6]/20 transition-all active:scale-[0.98]',
                footerActionLink: 'text-[#1E6EE6] hover:text-[#1a5fcc] font-medium',
                identityPreviewText: 'text-[#0E1116]',
                identityPreviewEditButtonIcon: 'text-[#1E6EE6]',
              },
              layout: {
                shimmer: true,
                logoPlacement: 'none',
              },
            }}
          />
        </div>

        {/* Footer hint */}
        <p className="mt-8 text-sm text-[#6B7280] text-center">
          &copy; {new Date().getFullYear()} SecureVisit. Tous droits réservés.
        </p>
      </div>
    </div>
  );
}
