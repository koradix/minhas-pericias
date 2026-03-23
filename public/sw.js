// PeriLaB Service Worker — cache-first para assets, network-first para dados
const CACHE = 'perilab-v1'

// Assets que ficam disponíveis offline
const PRECACHE = [
  '/',
  '/rotas/pericias',
  '/manifest.json',
  '/icon.svg',
]

// ── Install: pré-cache do shell ───────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE))
  )
  self.skipWaiting()
})

// ── Activate: limpa caches antigos ───────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// ── Fetch: estratégia por tipo de request ────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignora requests não-GET e cross-origin (ex: Tile do mapa OpenStreetMap)
  if (request.method !== 'GET') return
  if (url.origin !== self.location.origin && !url.hostname.includes('tile.openstreetmap')) return

  // Tiles do mapa: cache-first (não mudam)
  if (url.hostname.includes('tile.openstreetmap')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          const clone = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, clone))
          return response
        }).catch(() => new Response('', { status: 503 }))
      })
    )
    return
  }

  // API / Server Actions: sempre network, sem cache
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/data/')) {
    event.respondWith(fetch(request).catch(() => caches.match(request)))
    return
  }

  // Assets estáticos Next.js: cache-first
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          const clone = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, clone))
          return response
        })
      })
    )
    return
  }

  // Páginas: network-first com fallback para cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone()
        caches.open(CACHE).then((cache) => cache.put(request, clone))
        return response
      })
      .catch(() => caches.match(request))
  )
})
