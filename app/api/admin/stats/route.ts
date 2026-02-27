import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { master_db } from "@/db/master";
import { users, tenants } from "@/db/master/schema";
import { count } from "drizzle-orm";

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

    // Get statistics from master database
    const tenantCountResult = await master_db
      .select({ count: count() })
      .from(tenants);

    const userCountResult = await master_db
      .select({ count: count() })
      .from(users);

    const totalTenants = tenantCountResult[0]?.count || 0;
    const totalUsers = userCountResult[0]?.count || 0;
    const activeSessions = totalUsers; // Approximate

    return NextResponse.json({
      data: {
        totalTenants,
        totalUsers,
        activeSessions,
        systemStatus: "healthy",
      },
      error: null,
    });
  } catch (error: any) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { data: null, error: error?.message || "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
