import { NextResponse } from "next/server";
import { syncUser } from "@/features/users/server/syncUser";

export async function GET() {
  try {
    await syncUser();
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? String(err) },
      { status: 401 }
    );
  }
}

export async function POST() {
  return GET();
}
