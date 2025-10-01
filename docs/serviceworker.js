const CACHE_VERSION = 'v4';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;
const RUNTIME_MAX_ENTRIES = 40;

const PRECACHE_URLS = [
  // Liste der Dateien, die beim Installieren vorab in den Cache gelegt werden
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
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://aframe.io/releases/1.6.0/aframe.min.js',
  'https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar.js'
];

self.addEventListener('install', event => {
  // Installationsphase: legt statische Assets in den Cache und aktiviert sofort
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting(); // Neue Version sofort aktivieren
});

self.addEventListener('activate', event => {
  // Aktivierungsphase: entfernt veraltete Cache-Versionen und übernimmt Clients
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => ![STATIC_CACHE, RUNTIME_CACHE].includes(k)) // Fremde Cache-Namen ignorieren
          .map(k => caches.delete(k)) // Alte Caches aufräumen
      )
    )
  );
  self.clients.claim(); // Kontrolle über offene Tabs übernehmen
});

self.addEventListener('fetch', event => {
  // Hauptroutine für jede Netzwerkanfrage aus der PWA
  const req = event.request;

  if (req.method !== 'GET') return; // Schreibende Requests nicht cachen

  event.respondWith(
    fetch(req, { cache: 'reload' })
      .catch(() => caches.match(req) || caches.match('./offline.html'))
  );
});

function relativePath(url) {
  // Erzeugt einen relativen Pfad für gleiche Herkunft, sonst komplette URL
  if (self.location.origin === url.origin) { // Nur interne Pfade relativieren
    let p = url.pathname;
    if (p.endsWith('/')) return './'; // Root-Ordner abdecken
    if (p.startsWith('/')) p = '.' + p; // Voranstellen für relative Referenzen
    return p;
  }
  return url.href; // Externe Ressourcen unverändert lassen
}

function trimCache(cacheName, maxEntries) {
  // Hilfsroutine zum Begrenzen der Cache-Größe durch Entfernen ältester Einträge
  caches.open(cacheName).then(cache =>
    cache.keys().then(keys => {
      if (keys.length <= maxEntries) return; // Grenzen eingehalten: nichts tun
      cache.delete(keys[0]).then(() => trimCache(cacheName, maxEntries)); // Rekursiv älteste Einträge entfernen
    })
  );
}

self.addEventListener('message', event => {
  // Reagiert auf Steuerbefehle (z. B. SKIP_WAITING) aus dem Client
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting(); // Manuelles Upgrade auslösen
  }
});

self.addEventListener('push', event => { // Empfang von Push-Nachrichten
  const data = event.data?.json() ?? { title: 'T-Rex AR', body: 'Der Dino ist live!' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: './icons/icon-192.png',
      data: data.url ?? './'
    })
  );
});

self.addEventListener('notificationclick', event => { // Reaktion auf Klicks in Benachrichtigungen
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientsArr => {
      const target = event.notification.data;
      const existing = clientsArr.find(c => c.url === target && 'focus' in c);
      if (existing) return existing.focus();
      if (clients.openWindow && target) return clients.openWindow(target);
    })
  );
});