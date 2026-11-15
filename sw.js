// Lingcam offline cache
const V = 'lingcam-1.1.0';
const FILES = ['./', 'index.html', 'css/app.css', 'js/app.js', 'js/data.js', 'js/render.js', 'js/store.js', 'js/native.js', 'vendor/gifenc.esm.js', 'manifest.webmanifest', 'img/icon-192.png', 'img/icon-512.png',
  'fonts/fredoka-latin-600-normal.woff2', 'fonts/fredoka-latin-700-normal.woff2', 'fonts/caveat-latin-700-normal.woff2', 'fonts/dm-sans-latin-400-normal.woff2', 'fonts/dm-sans-latin-700-normal.woff2', 'fonts/special-elite-latin-400-normal.woff2', 'fonts/playfair-display-latin-700-italic.woff2'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.includes('/api/') || u.pathname.startsWith('/s/') || u.pathname.endsWith('version.json') || u.pathname.endsWith('.apk')) return;
  // network first for pages so updates show quickly, cache first for the rest
  if (e.request.mode === 'navigate') { e.respondWith(fetch(e.request).then((r) => { const cp = r.clone(); caches.open(V).then((c) => c.put('index.html', cp)); return r; }).catch(() => caches.match('index.html'))); return; }
  e.respondWith(caches.match(e.request).then((m) => m || fetch(e.request).then((r) => { if (r.ok) { const cp = r.clone(); caches.open(V).then((c) => c.put(e.request, cp)); } return r; })));
});
