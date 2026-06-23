// 旅遊優惠券後端（在 Vercel Serverless 端執行）。
// 用 Vercel KV（Upstash Redis）儲存營運方管理的優惠券，讓所有訪客看到同一份即時優惠。
// 連接方式：Vercel 專案 → Storage → 建立 KV（免費）→ 自動注入 KV_REST_API_URL / KV_REST_API_TOKEN。
// 未連接時回傳 { configured: false }，前端改用示範優惠券（src/services/coupons.js）。
//
// GET  /api/coupons?country=japan&region=tokyo
//        → { configured, coupons:[...] }  （含全站通用 + 該國 + 該城市適用的券）
// POST /api/coupons   header x-admin-token: <COUPONS_ADMIN_TOKEN>
//        body { coupon:{partner,title,discount,desc?,code?,url,cta?,expires?,scope?} }
//        → { ok:true }
//   scope（選填）控制適用範圍：
//     不填 = 全站通用；{ countries:['japan'] } = 限該國；
//     { regions:['japan/tokyo'] } = 限該城市。

const KV_URL = process.env.KV_REST_API_URL
const KV_TOKEN = process.env.KV_REST_API_TOKEN
const ADMIN_TOKEN = process.env.COUPONS_ADMIN_TOKEN

const LIST_KEY = 'coupons:list'

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

const clip = (s, n) => String(s || '').slice(0, n)

function sanitize(coupon) {
  const partner = clip(coupon?.partner, 40).trim()
  const title = clip(coupon?.title, 80).trim()
  let url = clip(coupon?.url, 400).trim()
  if (url && !/^https?:\/\//i.test(url)) url = '' // 只允許 http(s)
  if (!partner || !title || !url) return null // 必填：合作夥伴、標題、連結
  const scope = coupon?.scope && typeof coupon.scope === 'object' ? coupon.scope : null
  return {
    id: clip(coupon?.id, 40).trim() || `c${Date.now()}`,
    partner,
    emoji: clip(coupon?.emoji, 8).trim() || '🎟️',
    title,
    discount: clip(coupon?.discount, 40).trim(),
    desc: clip(coupon?.desc, 160).trim(),
    code: clip(coupon?.code, 40).trim(),
    cat: clip(coupon?.cat, 12).trim(),
    cta: clip(coupon?.cta, 24).trim(),
    url,
    expires: clip(coupon?.expires, 24).trim(),
    scope: scope
      ? {
          countries: Array.isArray(scope.countries) ? scope.countries.map((s) => clip(s, 40)) : [],
          regions: Array.isArray(scope.regions) ? scope.regions.map((s) => clip(s, 80)) : [],
        }
      : null,
  }
}

// 是否適用於該城市：無 scope = 全站；否則比對國家或 國家/城市。
function applies(coupon, country, region) {
  const s = coupon.scope
  if (!s || (!s.countries?.length && !s.regions?.length)) return true
  if (s.countries?.includes(country)) return true
  if (s.regions?.includes(`${country}/${region}`) || s.regions?.includes(region)) return true
  return false
}

function notExpired(coupon) {
  if (!coupon.expires) return true
  const t = Date.parse(coupon.expires)
  if (Number.isNaN(t)) return true
  return t >= Date.now()
}

export default async function handler(req, res) {
  if (!KV_URL || !KV_TOKEN) {
    res.status(200).json({ configured: false })
    return
  }
  try {
    if (req.method === 'GET') {
      const { country, region } = req.query || {}
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
      const raw = (await kv(['LRANGE', LIST_KEY, '0', '199'])) || []
      const all = raw
        .map((s) => {
          try {
            return JSON.parse(s)
          } catch {
            return null
          }
        })
        .filter(Boolean)
        .filter(notExpired)
      const coupons = country && region ? all.filter((c) => applies(c, country, region)) : all
      res.status(200).json({ configured: true, coupons })
      return
    }

    if (req.method === 'POST') {
      if (!ADMIN_TOKEN || req.headers['x-admin-token'] !== ADMIN_TOKEN) {
        res.status(401).json({ ok: false, error: 'unauthorized' })
        return
      }
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
      const clean = sanitize(body?.coupon)
      if (!clean) {
        res.status(400).json({ ok: false, error: 'invalid coupon (need partner/title/url)' })
        return
      }
      await kv(['LPUSH', LIST_KEY, JSON.stringify(clean)])
      await kv(['LTRIM', LIST_KEY, '0', '199']) // 最多保留 200 張
      res.status(200).json({ ok: true, id: clean.id })
      return
    }

    res.status(405).json({ ok: false, error: 'method not allowed' })
  } catch (e) {
    res.status(200).json({ configured: false, error: 'kv_error' })
  }
}
