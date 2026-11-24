/* Sophit service worker
 * - Páginas: rede primeiro; sem conexão, mostra a última versão guardada ou /offline.html
 * - Arquivos estáticos do Next (/_next/static) e ícones: cache primeiro (têm hash no nome)
 * - Supabase, APIs e qualquer requisição que não seja GET: nunca passam pelo cache
 * - Push: mostra a notificação e, ao tocar, abre (ou foca) o app na página certa
 */
const VERSION = 'sophit-v4'
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

// ── Notificações push ─────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch { data = { body: event.data && event.data.text() } }
  const title = data.title || 'Sophit'
  event.waitUntil(self.registration.showNotification(title, {
    body: data.body || '',
    icon: '/icons/icon-192.png?v=2',
    badge: '/icons/icon-192.png?v=2',
    tag: data.tag || 'sophit',
    renotify: true,
    data: { url: data.url || '/dashboard' },
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL((event.notification.data && event.notification.data.url) || '/dashboard', self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((lista) => {
      // Se o app já está aberto, reaproveita a janela
      for (const c of lista) {
        if (new URL(c.url).origin === self.location.origin && 'focus' in c) {
          return c.focus().then((w) => (w && 'navigate' in w ? w.navigate(url) : w))
        }
      }
      return self.clients.openWindow(url)
    })
  )
})

// O navegador trocou a inscrição sozinho (raro): avisa o servidor da nova
self.addEventListener('pushsubscriptionchange', (event) => {
  const opts = event.oldSubscription && event.oldSubscription.options
  if (!opts) return
  event.waitUntil(
    self.registration.pushManager.subscribe(opts).then((sub) =>
      fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub), credentials: 'include' })
    )
  )
})
