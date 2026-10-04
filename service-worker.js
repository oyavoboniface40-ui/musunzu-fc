const CACHE_NAME = 'musunzu-fc-v3';
const APP_SHELL = ['.', 'index.html', 'manifest.webmanifest', 'club.svg']
  .map(path => new URL(path, self.registration.scope).href);
const INDEX_URL = new URL('index.html', self.registration.scope).href;

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key.startsWith('musunzu-fc-') && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(async response => {
          if (response.ok) {
            await caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
          }
          return response;
        })
        .catch(async () => (await caches.match(request)) || caches.match(INDEX_URL))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(async cached => {
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) {
        await caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
      }
      return response;
    })
  );
});
