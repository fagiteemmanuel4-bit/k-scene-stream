const CACHE = "kscene-v1";
const STATIC = ["/", "/manifest.json"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(STATIC)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  // Network-first for API calls
  if (url.hostname !== location.hostname) {
    e.respondWith(fetch(e.request).catch(() => new Response("", { status: 503 })));
    return;
  }
  // Cache-first for assets, network-first for HTML
  if (e.request.headers.get("accept")?.includes("text/html")) {
    e.respondWith(
      fetch(e.request)
        .then((r) => { const clone = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, clone)); return r; })
        .catch(() => caches.match("/") || new Response("Offline"))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then((cached) => cached || fetch(e.request).then((r) => {
        const clone = r.clone();
        caches.open(CACHE).then((c) => c.put(e.request, clone));
        return r;
      }))
    );
  }
});
