"use client";

import { useState } from "react";
import { CreateTenantForm } from "@/features/tenants/forms/createTenant.form";
import { getTenantUrl } from "@/lib/subdomain-utils";

export default function CreateTenantPage() {
  const [isCreating, setIsCreating] = useState(false);

  const handleTenantCreated = (slug: string) => {
    setIsCreating(true);
    
    // Redirect to the tenant's subdomain
    const tenantUrl = getTenantUrl(slug);
    window.location.href = tenantUrl;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12 px-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Setup your Company</h1>
          <p className="text-gray-600">Create your tenant to get started managing visitors.</p>
        </div>
        
        <CreateTenantForm onSuccess={handleTenantCreated} />

        {isCreating && (
          <p className="text-center text-sm text-gray-500">Redirecting to your tenant...</p>
        )}
      </div>
    </div>
  );
}
