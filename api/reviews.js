// 城市社群評論／照片的後端（在 Vercel Serverless 端執行）。
// 用 Vercel KV（Upstash Redis）儲存，讓所有訪客共享評論。
// 連接方式：Vercel 專案 → Storage → 建立 KV（免費）→ 會自動注入 KV_REST_API_URL / KV_REST_API_TOKEN。
// 未連接時回傳 { configured: false }，前端改用本機 localStorage。
//
// GET  /api/reviews?country=japan&region=tokyo  → { configured, reviews:[...] }
// POST /api/reviews  body { country, region, review:{nickname,rating,text,photo?} } → { ok:true }

const KV_URL = process.env.KV_REST_API_URL
const KV_TOKEN = process.env.KV_REST_API_TOKEN

async function kv(command) {
  const res = await fetch(KV_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  })
  if (!res.ok) throw new Error('kv error')
  const j = await res.json()
  return j.result
}

const keyOf = (country, region) => `reviews:${country}:${region}`
const clip = (s, n) => String(s || '').slice(0, n)

function sanitize(review) {
  const rating = Math.max(1, Math.min(5, Math.round(Number(review?.rating) || 0)))
  const text = clip(review?.text, 600).trim()
  let photo = clip(review?.photo, 400).trim()
  if (photo && !/^https?:\/\//i.test(photo)) photo = '' // 只允許 http(s) 圖片連結
  const nickname = clip(review?.nickname, 24).trim() || '訪客'
  if (!text && !photo) return null // 至少要有文字或照片
  return { nickname, rating, text, photo, date: new Date().toISOString() }
}

export default async function handler(req, res) {
  if (!KV_URL || !KV_TOKEN) {
    res.status(200).json({ configured: false })
    return
  }
  try {
    if (req.method === 'GET') {
      const { country, region } = req.query || {}
      if (!country || !region) {
        res.status(400).json({ configured: true, reviews: [] })
        return
      }
      res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=60')
      const raw = (await kv(['LRANGE', keyOf(country, region), '0', '49'])) || []
      const reviews = raw
        .map((s) => {
          try {
            return JSON.parse(s)
          } catch {
            return null
          }
        })
        .filter(Boolean)
      res.status(200).json({ configured: true, reviews })
      return
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
      const { country, region, review } = body
      if (!country || !region) {
        res.status(400).json({ ok: false, error: 'missing country/region' })
        return
      }
      const clean = sanitize(review)
      if (!clean) {
        res.status(400).json({ ok: false, error: 'empty review' })
        return
      }
      const key = keyOf(country, region)
      await kv(['LPUSH', key, JSON.stringify(clean)])
      await kv(['LTRIM', key, '0', '199']) // 每個城市最多保留 200 則
      res.status(200).json({ ok: true })
      return
    }

    res.status(405).json({ ok: false, error: 'method not allowed' })
  } catch (e) {
    res.status(200).json({ configured: false, error: 'kv_error' })
  }
}
