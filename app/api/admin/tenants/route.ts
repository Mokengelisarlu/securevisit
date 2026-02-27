import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { master_db } from "@/db/master";
import { tenants, users } from "@/db/master/schema";
import { eq } from "drizzle-orm";

async function verifyAdminAccess(userId: string | null) {
  if (!userId) {
    return false;
  }

  // MVP: Any authenticated user has access
  // TODO: Implement proper admin role verification
  return true;
}

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const isAdmin = await verifyAdminAccess(userId);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Fetch all tenants with owner information
    const allTenants = await master_db
      .select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        createdAt: tenants.createdAt,
        ownerEmail: users.email,
        status: tenants.isActive,
      })
      .from(tenants)
      .leftJoin(users, eq(tenants.ownerId, users.id));

    return NextResponse.json({ data: allTenants, error: null });
  } catch (error: any) {
    console.error("Error fetching tenants:", error);
    return NextResponse.json(
      { data: null, error: error?.message || "Failed to fetch tenants" },
      { status: 500 }
    );
  }
}
