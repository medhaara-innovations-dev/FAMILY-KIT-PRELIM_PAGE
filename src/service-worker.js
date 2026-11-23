/* CACHE and ASSETS are supplied by Vite for each production build. */
const offlinePage = "/offline.html";
const staticPaths = new Set(ASSETS);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll([offlinePage, ...ASSETS])));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key.startsWith("familykit-shell-") && key !== CACHE)
      .map((key) => caches.delete(key))
  )));
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(async () => {
      const cache = await caches.open(CACHE);
      return (await cache.match(offlinePage)) || Response.error();
    }));
  } else if (staticPaths.has(url.pathname)) {
    event.respondWith(caches.open(CACHE).then(async (cache) =>
      (await cache.match(request)) || fetch(request)
    ));
  }
});
