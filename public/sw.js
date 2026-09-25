const CACHE = 'proformas-v1';

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const root = new URL('./', self.registration.scope);
    const response = await fetch(root);
    await cache.put(root, response.clone());
    const html = await response.text();
    const assets = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
      .map((match) => new URL(match[1], root))
      .filter((url) => url.origin === root.origin);
    await cache.addAll(assets);
  })());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request);
        await (await caches.open(CACHE)).put(new URL('./', self.registration.scope), response.clone());
        return response;
      } catch {
        return caches.match(new URL('./', self.registration.scope));
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    const response = await fetch(event.request);
    if (new URL(event.request.url).origin === self.location.origin) {
      await (await caches.open(CACHE)).put(event.request, response.clone());
    }
    return response;
  })());
});
