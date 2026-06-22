// GET /api/hotels?query=Tokyo&lat=35.68&lng=139.76&checkIn=2026-08-15&checkOut=2026-08-18&adults=2
// 回傳正規化的飯店即時房價；未設定 provider 金鑰時回傳 { configured: false }，前端改用示範行情。
import { getHotels } from './_providers.js'

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')
  try {
    const { query, lat, lng, checkIn, checkOut, adults } = req.query || {}
    const data = await getHotels({
      query: query ? String(query) : '',
      lat: lat ? Number(lat) : undefined,
      lng: lng ? Number(lng) : undefined,
      checkInDate: checkIn ? String(checkIn) : undefined,
      checkOutDate: checkOut ? String(checkOut) : undefined,
      adults: Number(adults) || 2,
    })
    res.status(200).json(data)
  } catch (e) {
    res.status(200).json({ configured: false, error: 'provider_error' })
  }
}
