"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";

interface TenantAuthGuardProps {
  tenantSlug: string;
  children: React.ReactNode;
}

export function TenantAuthGuard({ tenantSlug, children }: TenantAuthGuardProps) {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isLoaded || !userId) {
      if (isLoaded && !userId) {
        router.push("/sign-in");
      }
      setIsChecking(false);
      return;
    }

    const verifyAccess = async () => {
      try {
        const response = await fetch(`/api/tenants/${tenantSlug}/verify`);
        if (!response.ok) {
          // If it's 401, Clerk middleware might have already handled it, 
          // but we handle it here just in case.
          if (response.status === 401) {
            router.push("/sign-in");
            return;
          }
        }

        const data = await response.json();

        if (data.authorized) {
          setIsAuthorized(true);
        } else {
          toast.error(data.error || "Access denied");
          router.push(`/`); // Go back to tenant landing page (root of subdomain)
          setIsAuthorized(false);
        }
      } catch (err: any) {
        console.error("Auth verification failed:", err);
        setIsAuthorized(false);
      } finally {
        setIsChecking(false);
      }
    };

    verifyAccess();
  }, [isLoaded, userId, tenantSlug, router]);

  if (isChecking) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-medium animate-pulse">Vérification de l'accès en cours...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    // Return null while redirecting to avoid showing "Access Denied" content briefly
    return null;
  }

  return <>{children}</>;
}
