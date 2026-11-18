/* Sophit service worker
 * - Páginas: rede primeiro; sem conexão, mostra a última versão guardada ou /offline.html
 * - Arquivos estáticos do Next (/_next/static) e ícones: cache primeiro (têm hash no nome)
 * - Supabase, APIs e qualquer requisição que não seja GET: nunca passam pelo cache
 */
const VERSION = 'sophit-v3'
const STATIC_CACHE = `${VERSION}-static`
const PAGES_CACHE = `${VERSION}-pages`
const PRECACHE = ['/offline.html', '/icons/icon-192.png?v=2', '/icons/icon-512.png?v=2', '/icons/favicon.svg?v=2']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return          // Supabase, Google Fonts etc.
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) return

  // Estáticos com hash: cache primeiro
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(STATIC_CACHE).then((c) => c.put(req, copy)) }
        return res
      }))
    )
    return
  }

  // Navegação: rede primeiro, com fallback offline
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then((res) => {
        if (res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(PAGES_CACHE).then((c) => c.put(req, copy)) }
        return res
      }).catch(() => caches.match(req).then((hit) => hit || caches.match('/offline.html')))
    )
  }
})
