import { CreateTenantForm } from "@/features/tenants/forms/createTenant.form";


export default function CreateTenantPage() {
  return (
    <div className="max-w-md mx-auto mt-10 space-y-4">
      <h1 className="text-2xl font-semibold">Setup your Company</h1>
      <CreateTenantForm />
    </div>
  );
}
