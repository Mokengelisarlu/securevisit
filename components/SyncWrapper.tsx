"use client";

import { useEffect } from "react";

export function SyncWrapper() {
  useEffect(() => {
    // Call a server API route that performs the server-side sync.
    fetch("/api/sync-user").catch(() => {
      // swallow errors silently; server route will return proper status
    });
  }, []);

  return null;
}
