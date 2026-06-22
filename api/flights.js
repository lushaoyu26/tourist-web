// GET /api/flights?origin=TPE&dest=NRT&departMonth=2026-08&departDate=2026-08-15&returnDate=2026-08-22&adults=1
// 回傳正規化的機票報價；未設定 provider 金鑰時回傳 { configured: false }，前端改用示範估價。
import { getFlights } from './_providers.js'

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')
  try {
    const { origin, dest, departMonth, departDate, returnDate, adults } = req.query || {}
    if (!origin || !dest) {
      res.status(400).json({ configured: false, error: 'missing origin/dest' })
      return
    }
    const data = await getFlights({
      origin: String(origin).toUpperCase(),
      dest: String(dest).toUpperCase(),
      departMonth: departMonth ? String(departMonth) : undefined, // Travelpayouts 用月份
      returnMonth: departMonth ? String(departMonth) : undefined,
      departureDate: departDate ? String(departDate) : undefined, // Amadeus 用日期
      returnDate: returnDate ? String(returnDate) : undefined,
      adults: Number(adults) || 1,
    })
    res.status(200).json(data)
  } catch (e) {
    // 任何錯誤都讓前端優雅回退（不讓使用者看到爆掉）
    res.status(200).json({ configured: false, error: 'provider_error' })
  }
}
