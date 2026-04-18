// Service Worker — Mascotas Memorias
const CACHE_VERSION = 'v3';
const CACHE_NAME = `mascotas-memorias-${CACHE_VERSION}`;

const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/mascotas.json',
  '/icons/main.png',
];

// Install: cache the app shell (skip assets that return errors)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        SHELL_ASSETS.map(url =>
          fetch(new Request(url, { cache: 'reload' }))
            .then(res => { if (res.ok) return cache.put(url, res); })
            .catch(() => {}) // ignore missing files (e.g. icons not yet uploaded)
        )
      )
    ).then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first for Drive URLs, cache-first for everything else
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and cross-origin Drive requests (don't cache them)
  if (event.request.method !== 'GET') return;
  if (url.hostname === 'drive.google.com' || url.hostname === 'lh3.googleusercontent.com') return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      if (cached) return cached;

      try {
        const response = await fetch(event.request);
        // Cache successful same-origin responses
        if (response.ok && url.origin === self.location.origin) {
          cache.put(event.request, response.clone());
        }
        return response;
      } catch {
        return cached || new Response('Offline', { status: 503 });
      }
    })
  );
});
