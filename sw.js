// ============================================
// SERVICE WORKER — Cache-First for Static Assets
// ============================================

const CACHE_NAME = 'np-factory-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/index.css',
  './css/components.css',
  './css/pages.css',
  './css/print.css',
  './js/db.js',
  './js/i18n.js',
  './js/auth.js',
  './js/toast.js',
  './js/sync.js',
  './js/router.js',
  './js/app.js',
  './js/pages/login.js',
  './js/pages/dashboard.js',
  './js/pages/stock.js',
  './js/pages/customers.js',
  './js/pages/transactions.js',
  './js/pages/receipt.js',
  './js/pages/admin-payments.js',
  './i18n/en.json',
  './i18n/ne.json'
];

// Install — cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch — cache-first for static, network-first for others
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip external requests (like CDN)
  if (url.origin !== location.origin) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for our static assets
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        // Return cached, but also update in background
        const fetchPromise = fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        }).catch(() => cached);

        return cached;
      }
      return fetch(event.request);
    })
  );
});
