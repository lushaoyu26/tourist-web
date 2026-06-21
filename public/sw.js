// 漫遊地球 — Service Worker：離線可瀏覽。
// - 同源導覽：網路優先、離線回退快取的 index.html（SPA）
// - 同源靜態資源：快取優先、背景更新
// - 地圖圖磚（CARTO）與維基照片：跨域執行期快取（cache-first + 上限），已看過的地圖/照片離線也能顯示
const CACHE = 'wanderglobe-v2'
const TILE_CACHE = 'wanderglobe-tiles-v1'
const TILE_LIMIT = 400
const CORE = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg']

// 需要離線快取的跨域資源主機（地圖圖磚、維基圖片）
const OFFLINE_HOSTS = ['basemaps.cartocdn.com', 'cartocdn.com', 'upload.wikimedia.org', 'tile.openstreetmap.org']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(CORE))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  const keep = [CACHE, TILE_CACHE]
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !keep.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

// 控制單一快取的大小：超過上限時刪掉最舊的項目
async function trimCache(name, limit) {
  const cache = await caches.open(name)
  const keys = await cache.keys()
  if (keys.length > limit) {
    for (let i = 0; i < keys.length - limit; i++) await cache.delete(keys[i])
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  // 跨域：地圖圖磚 / 維基照片 → 快取優先，背景更新，限制大小
  if (url.origin !== self.location.origin) {
    if (OFFLINE_HOSTS.some((h) => url.hostname.endsWith(h))) {
      event.respondWith(
        caches.open(TILE_CACHE).then((cache) =>
          cache.match(request).then((cached) => {
            const network = fetch(request)
              .then((res) => {
                if (res && (res.status === 200 || res.type === 'opaque')) {
                  cache.put(request, res.clone())
                  trimCache(TILE_CACHE, TILE_LIMIT)
                }
                return res
              })
              .catch(() => cached)
            return cached || network
          })
        )
      )
    }
    return // 其餘跨域資源走預設網路
  }

  // 同源導覽（HTML 頁面）：網路優先，離線回退快取的 SPA 殼
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put('/index.html', copy))
          return res
        })
        .catch(() => caches.match('/index.html'))
    )
    return
  }

  // 同源靜態資源：快取優先，背景更新
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(request, copy))
          }
          return res
        })
        .catch(() => cached)
      return cached || network
    })
  )
})
