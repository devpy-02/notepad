const CACHE_NAME = 'notebook-v1';
const FILES_TO_CACHE = [
  './notebook.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker نصب شد');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker فعال شد');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  if (url.includes('127.0.0.1') || 
      url.includes('localhost') || 
      url.includes('allorigins') ||
      url.includes('openai') ||
      url.includes('googleapis')) {
    return;
  }

  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then((cached) => {
        if (cached) return cached;
        return fetch(event.request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type === 'opaque') {
              return response;
            }
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
            return response;
          })
          .catch(() => {
            if (event.request.destination === 'document') {
              return caches.match('./notebook.html');
            }
          });
      })
  );
});