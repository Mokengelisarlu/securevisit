import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { master_db } from "@/db/master";
import { users, tenants } from "@/db/master/schema";
import { eq, count } from "drizzle-orm";

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

    // Fetch all users
    const allUsers = await master_db.select().from(users);

    // Get tenant count for each user
    const usersList = await Promise.all(
      allUsers.map(async (user) => {
        const tenantCount = await master_db
          .select({ count: count() })
          .from(tenants)
          .where(eq(tenants.ownerId, user.id));

        return {
          id: user.id,
          name: user.nom,
          email: user.email,
          role: user.role,
          tenantsCount: tenantCount[0]?.count || 0,
          createdAt: user.createdAt,
        };
      })
    );

    return NextResponse.json({ data: usersList, error: null });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { data: null, error: error?.message || "Failed to fetch users" },
      { status: 500 }
    );
  }
}
