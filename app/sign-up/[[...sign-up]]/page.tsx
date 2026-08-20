"use client";

import { SignUp, useUser } from '@clerk/nextjs'
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SignUpPage() {
    const router = useRouter();
    const params = useSearchParams();
    const after = params?.get('after');
    const { isLoaded, isSignedIn } = useUser();

    useEffect(() => {
        if (!isLoaded) return;
        if (isSignedIn && after === 'setup') {
            router.push('/setup-tenant');
        }
    }, [isLoaded, isSignedIn, after, router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#F0FDFA]">
            <SignUp
                forceRedirectUrl="/setup-tenant"
                appearance={{
                    elements: {
                        rootBox: "mx-auto",
                        card: "bg-white shadow-lg",
                    },
                }}
            />
        </div>
    )
}
