const CACHE_NAME = 'institute-user-v6';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/app-icon.svg',
  '/icons/app-icon-192.png',
  '/icons/app-icon-512.png'
];

self.addEventListener('install', (event) => {
  // Do not let one missing optional icon prevent index.html from being cached.
  // A failed addAll() leaves a newly installed worker without a navigation
  // fallback, which Android Chrome reports as ERR_FAILED on routed URLs.
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => Promise.allSettled(
    APP_SHELL.map((url) => cache.add(url))
  )));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
  )));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response && response.ok) return response;
      } catch (error) {
        // The cached app shell below handles temporary mobile/network failures.
      }

      const cachedShell = await caches.match('/index.html', { ignoreSearch: true });
      if (cachedShell) return cachedShell;

      // Always return a valid Response. Returning undefined from respondWith()
      // causes Chrome's generic ERR_FAILED page on every client-side route.
      try {
        const shellResponse = await fetch('/index.html', { cache: 'no-store' });
        if (shellResponse && shellResponse.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put('/index.html', shellResponse.clone());
          return shellResponse;
        }
      } catch (error) {
        // Fall through to a small offline response instead of browser ERR_FAILED.
      }

      return new Response(
        '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Institute App</title><main style="font-family:sans-serif;padding:24px"><h1>You are offline</h1><p>Please check your connection and try again.</p><button onclick="location.reload()">Try again</button></main>',
        { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    })());
    return;
  }

  if (['script', 'style', 'image', 'font'].includes(request.destination)) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    })));
  }
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch (error) {
    data = { body: event.data?.text() || 'You have a new update.' };
  }
  event.waitUntil(self.registration.showNotification(data.title || 'Institute App', {
    body: data.body || 'You have a new update.',
    icon: '/icons/app-icon-192.png',
    badge: '/icons/app-icon-192.png',
    tag: data.tag || 'institute-notification',
    data: { url: data.url || '/notifications' },
    silent: false,
    renotify: true,
    timestamp: Date.now(),
    vibrate: [180, 80, 180],
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || '/notifications', self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    const existingClient = clients.find((client) => client.url.startsWith(self.location.origin));
    if (existingClient) {
      return existingClient.navigate(targetUrl).then(() => existingClient.focus());
    }
    return self.clients.openWindow(targetUrl);
  }));
});
