const CACHE_VERSION = 'v3';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;
const RUNTIME_MAX_ENTRIES = 40;

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './offline.html',
  './trex/scene.gltf',
  './trex/scene.bin',
  './trex/textures/Material_21_baseColor.png',
  './trex/textures/Material_21_normal.png',
  './trex/textures/Material_22_baseColor.png',
  './trex/textures/Material_22_normal.png',
  './trex/textures/Scene_-_Root_diffuse.jpeg',
  './trex/textures/Scene_-_Root_normal.png',
  './trex/trex-image/trex.fset',
  './trex/trex-image/trex.fset3',
  './trex/trex-image/trex.iset',
  'https://aframe.io/releases/1.6.0/aframe.min.js',
  'https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => ![STATIC_CACHE, RUNTIME_CACHE].includes(k))
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;

  if (req.method !== 'GET') return;

  const accept = req.headers.get('accept') || '';
  const isHTML = req.mode === 'navigate' || accept.includes('text/html');

  if (isHTML) {
    event.respondWith(
      fetch(req)
        .then(res => {
          const clone = res.clone();
          caches.open(RUNTIME_CACHE).then(cache => cache.put(req, clone));
          return res;
        })
        .catch(() =>
          caches.match(req).then(match => match || caches.match('./offline.html'))
        )
    );
    return;
  }

  const url = new URL(req.url);
  const rel = relativePath(url);

  if (PRECACHE_URLS.includes(rel) || PRECACHE_URLS.includes(req.url)) {
    event.respondWith(
      caches.match(req).then(cached => cached || fetch(req))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      const fetchPromise = fetch(req)
        .then(res => {
          const clone = res.clone();
          caches.open(RUNTIME_CACHE).then(cache => {
            cache.put(req, clone);
            trimCache(RUNTIME_CACHE, RUNTIME_MAX_ENTRIES);
          });
          return res;
        })
        .catch(() => cached);

      if (cached) {
        event.waitUntil(fetchPromise);
        return cached;
      }

      return fetchPromise;
    })
  );
});

function relativePath(url) {
  if (self.location.origin === url.origin) {
    let p = url.pathname;
    if (p.endsWith('/')) return './';
    if (p.startsWith('/')) p = '.' + p;
    return p;
  }
  return url.href;
}

function trimCache(cacheName, maxEntries) {
  caches.open(cacheName).then(cache =>
    cache.keys().then(keys => {
      if (keys.length <= maxEntries) return;
      cache.delete(keys[0]).then(() => trimCache(cacheName, maxEntries));
    })
  );
}

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});