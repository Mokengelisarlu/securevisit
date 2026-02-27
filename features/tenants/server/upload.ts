"use server";

import { put } from "@vercel/blob";
import { verifyTenantOwnership } from "./authorization";

/**
 * Upload a file to Vercel Blob.
 * Used for visitor and vehicle photos.
 */
export async function uploadToBlob(
    tenantSlug: string,
    fileName: string,
    fileData: string | Buffer
) {
    // Ensure the user has access to this tenant before uploading
    await verifyTenantOwnership(tenantSlug);

    // Convert base64 to Buffer if needed
    let content: Buffer | string = fileData;
    if (typeof fileData === "string" && fileData.startsWith("data:image")) {
        const base64Data = fileData.split(",")[1];
        content = Buffer.from(base64Data, "base64");
    }

    const blob = await put(`tenants/${tenantSlug}/photos/${Date.now()}-${fileName}`, content, {
        access: "private",
        addRandomSuffix: true,
    });

    return blob.url;
}
