/* DEV-012: versioned, same-origin, static offline shell; never cache user archives or mutations. */
const CACHE = 'metamodel-studio-__CACHE_VERSION__';
const FILES = __PRECACHE_FILES__;
const ROOT = self.registration.scope;
const URLS = FILES.map(path => new URL(path, ROOT).href);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(URLS)));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith('metamodel-studio-') && key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || request.mode === 'no-cors') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(ROOT)) return;
  // Do not cache arbitrary imports, API endpoints or private resources.
  const target = request.mode === 'navigate' ? new URL('index.html', ROOT).href : url.href;
  if (!URLS.includes(target)) return;
  event.respondWith((async () => {
    const cached = await caches.match(target);
    if (cached) return cached;
    return fetch(request);
  })());
});
