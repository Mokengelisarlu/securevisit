"use server";

import { put } from "@vercel/blob";
import { verifyTenantOwnership } from "./authorization";
import { verifyDeviceToken } from "../queries/tenant-data";

/**
 * Upload a file to Vercel Blob.
 * Used for visitor and vehicle photos.
 */
export async function uploadToBlob(
    tenantSlug: string,
    fileName: string,
    fileData: string | Buffer,
    deviceToken?: string
) {
    // Ensure the user has access to this tenant before uploading
    // We allow access if either the user is authenticated (admin)
    // or if a valid kiosk device token is provided.
    if (deviceToken) {
        await verifyDeviceToken(tenantSlug, deviceToken);
    } else {
        await verifyTenantOwnership(tenantSlug);
    }

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
