self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Check if this is a request for a dynamic kiosk manifest
  if (event.request.url.includes('/manifest.webmanifest')) {
    // Let the network handle it, but we can intercept if needed
    return;
  }
  
  // Standard fetch handler
  event.respondWith(fetch(event.request).catch(() => {
    // Offline fallback could go here
  }));
});
