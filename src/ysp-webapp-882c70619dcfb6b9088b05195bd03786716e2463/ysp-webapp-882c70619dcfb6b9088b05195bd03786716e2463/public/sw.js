// Service Worker for cache management
const CACHE_VERSION = 'v1.2.0';
const CACHE_NAME = `ysp-webapp-${CACHE_VERSION}`;
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/ysp-72.png',
  '/icons/ysp-96.png',
  '/icons/ysp-192.png',
  '/icons/ysp-512.png',
  '/offline.html'
];

// Clean up old caches on activation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

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
  self.clients.claim();
});

// Always fetch from network for HTML to avoid stale pages
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle share target
  if (url.pathname === '/share' && event.request.method === 'POST') {
    event.respondWith(
      (async () => {
        const formData = await event.request.formData();
        const title = formData.get('title') || '';
        const text = formData.get('text') || '';
        const shareUrl = formData.get('url') || '';
        
        // Redirect to app with shared data
        return Response.redirect(`/?share=${encodeURIComponent(JSON.stringify({ title, text, url: shareUrl }))}`, 303);
      })()
    );
    return;
  }
  
  // For HTML files, always fetch from network
  if (event.request.destination === 'document' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          // Fallback to cache if offline, or show offline page
          return caches.match(event.request).then((cached) => {
            return cached || caches.match('/offline.html');
          });
        })
    );
    return;
  }
  // Cache-first for static assets (built files)
  if (
    event.request.destination === 'style' ||
    event.request.destination === 'script' ||
    url.pathname.startsWith('/assets/')
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((resp) => {
          const respClone = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, respClone));
          return resp;
        });
      })
    );
    return;
  }

  // Stale-while-revalidate for images (including cross-origin)
  if (event.request.destination === 'image') {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request)
          .then((resp) => {
            const respClone = resp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, respClone));
            return resp;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }
});

// Listen for skipWaiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Push notification handler
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'You have a new notification',
      icon: '/icons/ysp-192.png',
      badge: '/icons/ysp-192.png',
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/',
        dateOfArrival: Date.now()
      },
      actions: [
        { action: 'open', title: 'Open App' },
        { action: 'close', title: 'Close' }
      ],
      tag: data.tag || 'ysp-notification',
      requireInteraction: false
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'YSP Notification', options)
    );
  } catch (error) {
    console.error('Push notification error:', error);
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'close') return;
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Open a new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-attendance') {
    event.waitUntil(syncAttendance());
  } else if (event.tag === 'sync-feedback') {
    event.waitUntil(syncFeedback());
  } else if (event.tag === 'sync-forms') {
    event.waitUntil(syncAllForms());
  }
});

async function syncAttendance() {
  try {
    const cache = await caches.open('ysp-pending-sync');
    const requests = await cache.keys();
    const attendanceRequests = requests.filter(req => req.url.includes('attendance'));
    
    for (const request of attendanceRequests) {
      try {
        const response = await fetch(request.clone());
        if (response.ok) {
          await cache.delete(request);
        }
      } catch (error) {
        console.error('Sync attendance failed:', error);
      }
    }
  } catch (error) {
    console.error('Background sync error:', error);
    throw error; // Retry sync
  }
}

async function syncFeedback() {
  try {
    const cache = await caches.open('ysp-pending-sync');
    const requests = await cache.keys();
    const feedbackRequests = requests.filter(req => req.url.includes('feedback'));
    
    for (const request of feedbackRequests) {
      try {
        const response = await fetch(request.clone());
        if (response.ok) {
          await cache.delete(request);
        }
      } catch (error) {
        console.error('Sync feedback failed:', error);
      }
    }
  } catch (error) {
    console.error('Background sync error:', error);
    throw error;
  }
}

async function syncAllForms() {
  await Promise.allSettled([
    syncAttendance(),
    syncFeedback()
  ]);
}

// Periodic Background Sync
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncAllForms());
  }
});

