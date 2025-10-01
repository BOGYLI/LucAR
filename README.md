# psem-ar

## Überblick
Augmented-Reality-Web-App für das Anzeigen eines T-Rex-Modells mittels AR.js und A-Frame. Die Anwendung läuft browserbasiert, bietet Offline-Unterstützung durch einen Service Worker und lässt sich als PWA installieren.

## Anforderungen
- Moderner Chromium- oder Firefox-Browser mit WebXR/WebRTC-Unterstützung
- Marker-Papier mit Hiro-Preset

## Lokales Testing
```bash


## Offline-Verhalten
- `serviceworker.js` nutzt getrennte Caches für statische und Laufzeit-Ressourcen (`static-v3`, `runtime-v3`).
- Bei Navigationsanfragen wird nach dem Netzwerk gegriffen; bei Ausfall liefert der Cache `offline.html`.
- Runtime-Cache wird auf 40 Einträge begrenzt und bei neuen Ressourcen getrimmt.

## Assets & Struktur
- `docs/trex/` enthält GLTF-Modell und Texturen.
- `docs/manifest.json` definiert PWA-Metadaten samt Icons.
- `docs/index.html` bindet A-Frame (1.6.0) und AR.js über CDN.

## Updates & Wartung
- `PRECACHE_URLS` in `serviceworker.js` bei neuen Assets ergänzen.
- `CACHE_VERSION` erhöhen, um alte Caches zu invalidieren.
- Bereits laufende Clients können über die Update-Leiste den neuen Service Worker aktivieren (`SKIP_WAITING`).

## Lizenz
MIT-Lizenz, siehe `LICENSE`.