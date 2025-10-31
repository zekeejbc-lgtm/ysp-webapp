// Service Worker for cache management
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `ysp-webapp-${CACHE_VERSION}`;

// Clean up old caches on activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
});

// Always fetch from network for HTML to avoid stale pages
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // For HTML files, always fetch from network
  if (event.request.destination === 'document' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          // Fallback to cache if offline
          return caches.match(event.request);
        })
    );
  }
});
