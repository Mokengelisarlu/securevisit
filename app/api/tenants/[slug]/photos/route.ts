import { NextResponse } from "next/server";
import { verifyTenantOwnership } from "@/features/tenants/server/authorization";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const { searchParams } = new URL(request.url);
        const blobUrl = searchParams.get("url");

        if (!blobUrl) {
            return new NextResponse("Missing URL", { status: 400 });
        }

        // Security check: User must have access to the tenant
        try {
            await verifyTenantOwnership(slug);
        } catch (error) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Fetch from Vercel Blob using the server-side token
        // The token is automatically used by fetch if it's available in process.env.BLOB_READ_WRITE_TOKEN?
        // Actually, Vercel Blob documentation says we should use the SDK or provide the header.
        const response = await fetch(blobUrl, {
            headers: {
                Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
            },
        });

        if (!response.ok) {
            return new NextResponse("Failed to fetch blob", { status: response.status });
        }

        const data = await response.arrayBuffer();
        const contentType = response.headers.get("content-type") || "image/jpeg";

        return new NextResponse(data, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch (error: any) {
        console.error("Error proxying photo:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
