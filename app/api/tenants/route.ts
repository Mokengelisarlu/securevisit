import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { master_db } from "@/db/master";
import { users, tenants } from "@/db/master/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch all tenants owned by the current user
    const userTenants = await master_db
      .select()
      .from(tenants)
      .where(eq(tenants.ownerId, userId));

    return NextResponse.json({ data: userTenants });
  } catch (error: any) {
    console.error("Error fetching tenants:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch tenants" },
      { status: 500 }
    );
  }
}
