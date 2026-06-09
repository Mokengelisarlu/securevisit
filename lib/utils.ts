import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getBlobUrl(url: string | null | undefined) {
  if (!url) return "";
  if (url.includes('blob.vercel-storage.com')) {
    return `/api/blob?url=${encodeURIComponent(url)}`;
  }
  return url;
}
