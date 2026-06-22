// 前端適配：向 /api/hotels 取真實飯店房價。
// 沒設定 provider 金鑰、在本機 dev、或任何錯誤 → 回傳 null，由面板回退示範行情。

const p2 = (n) => String(n).padStart(2, '0')
const fmtDate = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`

export async function fetchRealHotels({ region }) {
  const query = region?.hotels?.query || ''
  const [lat, lng] = region?.center || []
  if (!query && lat == null) return null
  // 預設查 30 天後入住、住 3 晚（給個合理的未來日期區間）
  const ci = new Date()
  ci.setDate(ci.getDate() + 30)
  const co = new Date(ci)
  co.setDate(co.getDate() + 3)
  try {
    const url =
      `/api/hotels?query=${encodeURIComponent(query)}` +
      `&lat=${lat ?? ''}&lng=${lng ?? ''}&checkIn=${fmtDate(ci)}&checkOut=${fmtDate(co)}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    if (!data?.configured || !Array.isArray(data.hotels) || data.hotels.length === 0) return null
    return data // { source, currency, hotels:[{name,price,currency,stars?}] }
  } catch {
    return null
  }
}
