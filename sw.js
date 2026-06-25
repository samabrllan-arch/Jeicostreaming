self.addEventListener('install', (e) => {
  self.skipWaiting(); // Fuerza a instalarse de inmediato y tomar control
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      // Eliminar TODAS las cachés almacenadas por el Service Worker anterior
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName)) 
      );
    }).then(() => {
      // Tomar control de los clientes abiertos inmediatamente
      return self.clients.claim();
    }).then(() => {
      // Auto-destrucción del Service Worker
      return self.registration.unregister();
    })
  );
});
