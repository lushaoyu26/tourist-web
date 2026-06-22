// 前端適配：向 /api/flights 取真實機票報價。
// 沒設定 provider 金鑰、在本機 dev（無 serverless）、或任何錯誤 → 回傳 null，由面板回退示範估價。

function monthDates(month) {
  const now = new Date()
  const cm = now.getMonth() + 1
  const year = month >= cm ? now.getFullYear() : now.getFullYear() + 1
  const mm = String(month).padStart(2, '0')
  const departDate = `${year}-${mm}-15`
  const ret = new Date(`${departDate}T00:00:00`)
  ret.setDate(ret.getDate() + 7)
  const p2 = (n) => String(n).padStart(2, '0')
  const returnDate = `${ret.getFullYear()}-${p2(ret.getMonth() + 1)}-${p2(ret.getDate())}`
  return { departMonth: `${year}-${mm}`, departDate, returnDate }
}

export async function fetchRealFlights({ region, originId, month }) {
  const dest = region?.airport?.code?.split(' ')[0]
  if (!dest) return null
  const { departMonth, departDate, returnDate } = monthDates(month)
  try {
    const url =
      `/api/flights?origin=${encodeURIComponent(originId)}&dest=${encodeURIComponent(dest)}` +
      `&departMonth=${departMonth}&departDate=${departDate}&returnDate=${returnDate}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    if (!data?.configured || !Array.isArray(data.offers) || data.offers.length === 0) return null
    return data // { source, currency, offers:[{airline,price,currency,depart,duration,stops,url?}] }
  } catch {
    return null
  }
}
