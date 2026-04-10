"use client";

import { useEffect } from "react";

export function SyncWrapper() {
  useEffect(() => {
    // Call a server API route that performs the server-side sync.
    fetch("/api/sync-user").catch(() => {
      // swallow errors silently; server route will return proper status
    });

    // Register service worker
    if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then((registration) => {
          console.log('SW registered: ', registration);
        }).catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
      });
    } else if ('serviceWorker' in navigator && window.location.hostname === 'localhost') {
      // Also register on localhost for development testing
      navigator.serviceWorker.register('/sw.js');
    }
  }, []);

  return null;
}
