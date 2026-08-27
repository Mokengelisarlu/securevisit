import { NextRequest, NextResponse } from "next/server";
import { uploadToBlob } from "@/features/tenants/server/upload";
import { getBearerToken } from "@/lib/device-auth";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const token = getBearerToken(request);

    if (!token) {
      return NextResponse.json(
        { ok: false, error: "Missing Authorization header" },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const filename = url.searchParams.get("filename");

    if (!filename) {
      return NextResponse.json(
        { ok: false, error: "Missing filename" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = (formData as any).get("file");

    if (!file || typeof (file as any).arrayBuffer !== "function") {
      return NextResponse.json(
        { ok: false, error: 'No valid file provided in "file" field' },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await (file as any).arrayBuffer());
    const finalFilename = (file as any).name || filename;
    const blobUrl = await uploadToBlob(slug, finalFilename, fileBuffer, token);

    return NextResponse.json({ ok: true, url: blobUrl });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}
