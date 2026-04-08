'use client';

import { SignIn } from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';

export default function SignInPage() {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-slate-100 px-6">

      {/* Centered Content Stack */}
      <div className="relative z-10 w-full max-w-[480px] flex flex-col items-center">
        {/* Brand Header */}
        <Link
          href="/"
          className="flex items-center gap-2 mb-10 hover:opacity-80 transition-opacity"
        >
          <Image
            src="/icon-96x96.png"
            alt="SecureVisit"
            width={36}
            height={36}
            className="object-contain"
          />
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
                formFieldInput: 'bg-[#F9FAFB] border-[#E5E7EB] focus:border-[#0DBDB5] focus:ring-[#0DBDB5]/20 rounded-xl py-3',
                formButtonPrimary: 'bg-[#0DBDB5] hover:bg-[#0CA8A0] text-white py-3 rounded-xl font-medium shadow-lg shadow-[#0DBDB5]/20 transition-all active:scale-[0.98]',
                footerActionLink: 'text-[#0DBDB5] hover:text-[#0CA8A0] font-medium',
                identityPreviewText: 'text-[#0E1116]',
                identityPreviewEditButtonIcon: 'text-[#0DBDB5]',
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
