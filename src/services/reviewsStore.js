// 城市評論／照片：本機儲存層（localStorage）。
// 未連接資料庫時，評論存在使用者自己的瀏覽器；連接 Vercel KV 後改走 /api/reviews 成為社群共享。

const KEY = 'wanderglobe-reviews-v1'
const slug = (countryId, regionId) => `${countryId}:${regionId}`

function readAll() {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeAll(obj) {
  try {
    localStorage.setItem(KEY, JSON.stringify(obj))
  } catch {
    // 隱私模式或容量不足略過
  }
}

export function getLocalReviews(countryId, regionId) {
  const all = readAll()
  const list = all[slug(countryId, regionId)]
  return Array.isArray(list) ? list : []
}

export function addLocalReview(countryId, regionId, review) {
  const all = readAll()
  const k = slug(countryId, regionId)
  const list = Array.isArray(all[k]) ? all[k] : []
  const next = [{ ...review, id: `${Date.now()}-${Math.round(Math.random() * 1e4)}` }, ...list].slice(0, 50)
  all[k] = next
  writeAll(all)
  return next
}
