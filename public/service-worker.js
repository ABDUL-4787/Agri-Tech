// AgriGrade Service Worker
const CACHE_NAME = "agrigrade-v5";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/css/style.css",
  "/js/config.js",
  "/js/flags.js",
  "/js/match.js",
  "/js/wilson.js",
  "/js/verdict.js",
  "/js/i18n.js",
  "/js/api.js",
  "/js/app.js",
  "/manifest.json"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  // Let /api/ requests pass through to network
  if (e.request.url.includes("/api/")) {
    return;
  }

  // Network-first strategy: fetches latest version online, falls back to offline cache
  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(e.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (e.request.mode === "navigate") {
            return caches.match("/index.html");
          }
        });
      })
  );
});
