const CACHE_NAME = 'shape-survivor-offline-v3';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './app-icon.png',
  './sounds/select.wav',
  './sounds/start.wav',
  './sounds/pickup.wav',
  './sounds/level.wav',
  './sounds/damage.wav',
  './sounds/boss.wav',
  './sounds/relic.wav',
  './sounds/achievement.wav',
  './sounds/shield.wav',
  './sounds/gameover.wav'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response && response.ok && new URL(request.url).origin === location.origin) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }).catch(() => {
      if (request.mode === 'navigate') return caches.match('./index.html');
      return caches.match(request);
    })
  );
});
