const CACHE = 'bottle-master-v1'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

self.addEventListener('fetch', e => {
  // ナビゲーションリクエストはネットワーク優先
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match('/')))
    return
  }
  // 静的アセットはキャッシュ優先
  if (e.request.destination === 'image' || e.request.destination === 'style' || e.request.destination === 'script') {
    e.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(e.request).then(hit => hit ?? fetch(e.request).then(res => {
          cache.put(e.request, res.clone())
          return res
        }))
      )
    )
    return
  }
  e.respondWith(fetch(e.request))
})
