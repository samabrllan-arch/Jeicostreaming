
// SW versión: 1782174205036
// ESTRATEGIA: Cache-first SÓLO para assets estáticos.
// index.html y app.min.js SIEMPRE van a la red (nunca se cachean).
const CACHE_NAME = 'jeico-static-1782174205036';

// Solo assets que NUNCA cambian entre sesiones
const STATIC_ASSETS = [
  './estilo1.min.css',
  './assets/mascot/idle.png',
  './assets/mascot/Caminar de lado.png',
  './assets/mascot/volteo.png'
];

// Rutas que NUNCA deben cachearse (siempre red)
const NEVER_CACHE = [
  'index.html',
  'app.min.js',
  'sw.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cachear sólo los assets estáticos, ignorando errores individuales
      return Promise.allSettled(STATIC_ASSETS.map(url => cache.add(url)));
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. Ignorar peticiones que NO son GET (POST, etc.) — NO llamar respondWith
  if (event.request.method !== 'GET') return;

  // 2. Ignorar peticiones a otros orígenes (API backend, CDN externos)
  if (url.origin !== self.location.origin) return;

  // 3. Nunca cachear archivos críticos de la app (index.html, app.min.js)
  const pathname = url.pathname;
  if (NEVER_CACHE.some(f => pathname.endsWith(f))) return;

  // 4. Para el resto (CSS, imágenes): cache-first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Solo cachear respuestas válidas
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached); // Si falla la red, devolver caché si existe
    })
  );
});
  