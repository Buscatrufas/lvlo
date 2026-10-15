// Service worker: permite usar la app sin conexión y la actualiza en cuanto hay versión nueva.
importScripts("/config.js");
const CACHE = "lvlo-" + self.LVLO_CONFIG.VERSION;

const SHELL = [
  "/", "/index.html", "/styles.css", "/config.js", "/i18n.js", "/app.js",
  "/vendor/pocketbase.umd.js", "/manifest.webmanifest",
  "/icons/icon-192.png", "/icons/icon-512.png",
  "/fonts/figtree-latin-400-normal.woff2", "/fonts/figtree-latin-600-normal.woff2",
  "/fonts/figtree-latin-700-normal.woff2", "/fonts/pixelify-sans-latin-700-normal.woff2",
  "/fonts/jetbrains-mono-latin-500-normal.woff2",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("lvlo-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  // Solo gestionamos peticiones GET de la propia web; la API y la analítica van siempre a la red.
  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  // Navegación: red primero, caché si no hay conexión
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match("/index.html")));
    return;
  }
  // Resto: caché primero y se refresca en segundo plano
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req).then((res) => {
        if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
