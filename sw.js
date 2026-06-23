
const CACHE_NAME = 'jeico-cache-1782173144037';
const urlsToCache = [
  './',
  './index.html',
  './estilo1.min.css',
  './app.min.js?v=1782173144037'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Fuerza a que este SW se active de inmediato
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', event => {
  // Limpia cachés antiguos cuando hay una nueva versión
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Solo interceptamos peticiones GET de nuestra propia app
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(response => {
      // Si está en el caché, lo devuelve instantáneamente
      if (response) {
        return response;
      }
      // Si no, va a la red normalmente
      return fetch(event.request);
    })
  );
});
  