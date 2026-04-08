import { headers } from "next/headers";
import { getTenantSlugFromHost } from "@/lib/getTenantSlug";
import { TenantProvider } from "@/lib/tenant-provider";
import { CreateVisitorForm } from "@/features/tenants/forms/createVisitor.form";

function VisitorKioskContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-500 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 md:p-12 max-w-md w-full">
        {/* Heading */}
        <h1 className="text-4xl md:text-5xl font-bold text-center text-gray-800 mb-3">
          Welcome
        </h1>

        {/* Subtitle */}
        <p className="text-center text-gray-600 text-lg mb-8">
          Please check in below
        </p>

        {/* Form */}
        <div>
          <CreateVisitorForm />
        </div>

        {/* Footer message */}
        <p className="text-center text-sm text-gray-500 mt-8">
          Questions? Speak with reception
        </p>
      </div>
    </div>
  );
}

export default async function VisitorPage() {
  // Get tenant slug from subdomain (Server Component safe)
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const tenantSlug = getTenantSlugFromHost(new Headers([['host', host]]));

  if (!tenantSlug) {
    return <div className="p-6 text-center">Error: Could not determine tenant</div>;
  }

  return (
    <TenantProvider slug={tenantSlug} name={null}>
      <VisitorKioskContent />
    </TenantProvider>
  );
}
