// 前端適配：向 /api/coupons 讀取「營運方管理」的即時優惠券（需在 Vercel 連接 KV）。
// 未連接、本機 dev、或任何錯誤 → 回傳 null，由元件回退到示範優惠券（coupons.js）。

export async function fetchLiveCoupons({ countryId, regionId }) {
  try {
    const res = await fetch(
      `/api/coupons?country=${encodeURIComponent(countryId)}&region=${encodeURIComponent(regionId)}`
    )
    if (!res.ok) return null
    const data = await res.json()
    if (!data?.configured || !Array.isArray(data.coupons) || data.coupons.length === 0) return null
    return data.coupons
  } catch {
    return null
  }
}
