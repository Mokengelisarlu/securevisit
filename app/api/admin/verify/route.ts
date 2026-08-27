import { NextResponse } from "next/server";
import { verifyAdminAccess } from "@/features/tenants/server/authorization";

export async function GET() {
  try {
    const isAdmin = await verifyAdminAccess();

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
