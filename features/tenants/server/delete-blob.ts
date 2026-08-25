"use server";

import { del } from "@vercel/blob";

/**
 * Delete a file from Vercel Blob by its URL.
 * Safe to call with null/undefined — no-ops in those cases.
 */
export async function deleteFromBlob(url: string | null | undefined) {
  if (!url || !url.includes("blob.vercel-storage.com")) return;
  try {
    await del(url);
  } catch (err) {
    console.warn("Failed to delete blob:", url, err);
  }
}
