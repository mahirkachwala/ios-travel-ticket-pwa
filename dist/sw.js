/* Increment this version when deploying changed application assets. */
const CACHE_NAME = 'travel-ticket-v16';
const CACHE_PREFIX = 'travel-ticket-';
const PRECACHE = [
  './',
  './index.html',
  './styles.css',
  './typography.css',
  './assets/fonts/Montserrat.ttf',
  './screens.js',
  './screens.css',
  './journey.js',
  './route-picker.js',
  './assets/home-wordmark-railone.jpg',
  './mumbai-network.js',
  './mumbai-fares.js',
  './mumbai-journey.js',
  './data/mumbai-network.js',
  './data/mumbai-fares.js',
  './journey.css',
  './assets/home-reserved.svg',
  './assets/home-unreserved.svg',
  './assets/home-platform.svg',
  './assets/home-fact-train.svg',
  './assets/home-fact-bridge.svg',
  './assets/home-social.svg',
  './app.js',
  './timer.js',
  './components.js',
  './config.js',
  './manifest.webmanifest',
  './assets/brand-logo.svg',
  './assets/ticket-watermark.svg',
  './assets/ticket-pattern.svg',
  './assets/qr-ticket.svg',
  './assets/app-icon-blue-train-192.png',
  './assets/app-icon-blue-train-512.png',
  './assets/apple-touch-icon-blue-train.png',
  './assets/favicon-blue-train.png',
];
const APP_SHELL = new URL('./index.html', self.location.href).href;
const STATIC_URLS = new Set(PRECACHE.map(path => new URL(path, self.location.href).href));

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Cache.addAll rejects unsuccessful responses, so incomplete installs never activate.
    await cache.addAll(PRECACHE.map(path => new Request(path, { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        // Preserve normal network responses, including redirects and errors.
        if (response.ok && !response.redirected && STATIC_URLS.has(url.href)) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }
        return response;
      } catch {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match(request)) || (await cache.match(APP_SHELL)) || Response.error();
      }
    })());
    return;
  }

  // Only the app's known static files are cached; APIs and other URLs use the network normally.
  if (!STATIC_URLS.has(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok && !response.redirected) await cache.put(request, response.clone());
    return response;
  })());
});
