"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { getTenantUrl } from "@/lib/subdomain-utils";

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

export default function TenantsPage() {
  const router = useRouter();
  const { isLoaded } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    const fetchTenants = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/tenants");

        if (!response.ok) {
          throw new Error("Failed to fetch tenants");
        }

        const data = await response.json();
        const tenantsList = data.data || [];
        setTenants(tenantsList);

        // If no tenants, redirect to create tenant
        if (tenantsList.length === 0) {
          toast.info("No tenants found. Redirecting to create tenant...");
          setTimeout(() => router.push("/setup-tenant"), 1000);
          return;
        }

        // If exactly one tenant, auto-redirect to its dashboard
        if (tenantsList.length === 1) {
          router.push(`/tenants/${tenantsList[0].slug}`);
          return;
        }

        // If multiple tenants, show selector (do nothing, just load state)
      } catch (err: any) {
        setError(err.message || "Failed to load tenants");
        toast.error(err.message || "Failed to load tenants");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenants();
  }, [isLoaded, router]);

  const handleTenantSelect = (tenant: Tenant) => {
    // We must use window.location.href for a full page load to the subdomain
    const tenantUrl = getTenantUrl(tenant.slug);
    window.location.href = tenantUrl;
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-b from-background to-muted">
        <div className="text-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-b from-background to-muted">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  // Multiple tenants - show selector
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">Select Your Company</h1>
          <p className="text-gray-600">You have access to multiple companies</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {tenants.map((tenant) => (
            <Card
              key={tenant.id}
              className="cursor-pointer hover:shadow-lg transition"
              onClick={() => handleTenantSelect(tenant)}
            >
              <CardHeader>
                <CardTitle>{tenant.name}</CardTitle>
                <CardDescription>{tenant.slug}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Open Dashboard</Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/setup-tenant">
            <Button variant="outline">Create New Company</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
