import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { master_db } from "@/db/master";
import { users } from "@/db/master/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { data: { isAdmin: false }, error: null },
        { status: 200 }
      );
    }

    // Check if user exists
    const user = await master_db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // MVP: Any authenticated user is considered admin
    // TODO: Restrict to only SUPER or Admin roles
    const isAdmin = user.length > 0;

    return NextResponse.json({
      data: { isAdmin },
      error: null,
    });
  } catch (error: any) {
    console.error("Error verifying admin:", error);
    return NextResponse.json(
      { data: null, error: error?.message || "Failed to verify admin status" },
      { status: 500 }
    );
  }
}
