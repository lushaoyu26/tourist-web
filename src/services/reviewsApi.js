// 前端適配：向 /api/reviews 讀寫「社群共享」評論（需在 Vercel 連接 KV 資料庫）。
// 未連接資料庫、本機 dev、或任何錯誤 → 回傳 null，由元件回退本機 localStorage。

export async function fetchSharedReviews({ countryId, regionId }) {
  try {
    const res = await fetch(`/api/reviews?country=${encodeURIComponent(countryId)}&region=${encodeURIComponent(regionId)}`)
    if (!res.ok) return null
    const data = await res.json()
    if (!data?.configured || !Array.isArray(data.reviews)) return null
    return data.reviews
  } catch {
    return null
  }
}

// 成功回傳 true（已寫入社群資料庫）；無資料庫／錯誤回傳 false（由呼叫端改存本機）
export async function postSharedReview({ countryId, regionId, review }) {
  try {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: countryId, region: regionId, review }),
    })
    if (!res.ok) return false
    const data = await res.json()
    return !!data?.ok
  } catch {
    return false
  }
}
