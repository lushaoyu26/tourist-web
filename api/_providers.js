// 真實機票／住宿價格的 provider 適配層（在 Vercel Serverless 端執行，金鑰不外洩）。
// 支援兩家、可用環境變數切換，未設定金鑰時回傳 { configured: false } 讓前端回退示範估價。
//
// 環境變數（在 Vercel 專案 → Settings → Environment Variables 設定）：
//   PRICE_PROVIDER          = travelpayouts | amadeus   （未設＝不啟用，前端用示範估價）
//   TRAVELPAYOUTS_TOKEN     = Travelpayouts API token
//   TRAVELPAYOUTS_MARKER    = （選填）你的分潤 marker
//   AMADEUS_CLIENT_ID       = Amadeus Self-Service API Key
//   AMADEUS_CLIENT_SECRET   = Amadeus Self-Service API Secret
//   AMADEUS_ENV             = test | production （預設 test）
//
// 注：本檔以 _ 開頭，Vercel 不會把它當成可呼叫的端點，僅供 api/flights.js、api/hotels.js 匯入。

const IATA_AIRLINE = {
  BR: '長榮航空', CI: '中華航空', JX: '星宇航空', JL: '日本航空', NH: '全日空',
  KE: '大韓航空', OZ: '韓亞航空', TG: '泰國航空', SQ: '新加坡航空', CX: '國泰航空',
  EK: '阿聯酋航空', QR: '卡達航空', TK: '土耳其航空', AF: '法國航空', KL: '荷蘭皇家航空',
  FI: '冰島航空', AY: '芬蘭航空', IT: '台灣虎航', JW: '萬那杜航空', VN: '越南航空',
  MH: '馬來西亞航空', PR: '菲律賓航空', GA: '印尼鷹航', CZ: '中國南方', MU: '東方航空',
}
const airlineName = (code) => IATA_AIRLINE[code] || code || '航空公司'

// ISO8601 期間（PT13H30M）→「13 小時 30 分」
function durISO(d) {
  const m = /PT(?:(\d+)H)?(?:(\d+)M)?/.exec(d || '')
  if (!m) return ''
  const h = m[1] ? `${m[1]} 小時` : ''
  const mm = m[2] ? `${m[2]} 分` : ''
  return `${h}${h && mm ? ' ' : ''}${mm}`.trim()
}

function provider() {
  return (process.env.PRICE_PROVIDER || '').toLowerCase()
}

// ========== Amadeus ==========
let amadeusToken = { value: null, exp: 0 }
async function amadeusBase() {
  return (process.env.AMADEUS_ENV || 'test') === 'production'
    ? 'https://api.amadeus.com'
    : 'https://test.api.amadeus.com'
}
async function amadeusAuth() {
  const now = Date.now()
  if (amadeusToken.value && amadeusToken.exp > now + 30000) return amadeusToken.value
  const base = await amadeusBase()
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.AMADEUS_CLIENT_ID || '',
    client_secret: process.env.AMADEUS_CLIENT_SECRET || '',
  })
  const r = await fetch(`${base}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!r.ok) throw new Error('amadeus auth failed')
  const j = await r.json()
  amadeusToken = { value: j.access_token, exp: now + (j.expires_in || 1700) * 1000 }
  return amadeusToken.value
}

async function amadeusFlights({ origin, dest, departureDate, returnDate, adults }) {
  const base = await amadeusBase()
  const token = await amadeusAuth()
  const qs = new URLSearchParams({
    originLocationCode: origin,
    destinationLocationCode: dest,
    departureDate,
    adults: String(adults || 1),
    currencyCode: 'TWD',
    max: '6',
  })
  if (returnDate) qs.set('returnDate', returnDate)
  const r = await fetch(`${base}/v2/shopping/flight-offers?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!r.ok) throw new Error('amadeus flights failed')
  const j = await r.json()
  const offers = (j.data || []).slice(0, 6).map((o) => {
    const it = o.itineraries?.[0]
    const segs = it?.segments || []
    const code = o.validatingAirlineCodes?.[0] || segs[0]?.carrierCode
    const dep = segs[0]?.departure?.at || ''
    return {
      airline: airlineName(code),
      price: Math.round(Number(o.price?.grandTotal || o.price?.total || 0)),
      currency: o.price?.currency || 'TWD',
      depart: dep ? dep.slice(11, 16) : '',
      duration: durISO(it?.duration),
      stops: segs.length > 1 ? `轉機 ${segs.length - 1} 次` : '直飛',
    }
  })
  return { source: 'amadeus', currency: 'TWD', offers: offers.filter((o) => o.price > 0) }
}

async function amadeusHotels({ lat, lng, checkInDate, checkOutDate, adults }) {
  const base = await amadeusBase()
  const token = await amadeusAuth()
  const listQs = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    radius: '20',
    radiusUnit: 'KM',
    hotelSource: 'ALL',
  })
  const list = await fetch(
    `${base}/v1/reference-data/locations/hotels/by-geocode?${listQs}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!list.ok) return { source: 'amadeus', currency: 'TWD', hotels: [] }
  const lj = await list.json()
  const ids = (lj.data || []).slice(0, 12).map((h) => h.hotelId).filter(Boolean)
  if (!ids.length) return { source: 'amadeus', currency: 'TWD', hotels: [] }
  const offQs = new URLSearchParams({
    hotelIds: ids.join(','),
    adults: String(adults || 2),
    checkInDate,
    checkOutDate,
    currency: 'TWD',
    bestRateOnly: 'true',
  })
  const off = await fetch(`${base}/v3/shopping/hotel-offers?${offQs}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!off.ok) return { source: 'amadeus', currency: 'TWD', hotels: [] }
  const oj = await off.json()
  const hotels = (oj.data || [])
    .map((d) => ({
      name: d.hotel?.name || '飯店',
      price: Math.round(Number(d.offers?.[0]?.price?.total || 0)),
      currency: d.offers?.[0]?.price?.currency || 'TWD',
      stars: d.hotel?.rating ? Number(d.hotel.rating) : null,
    }))
    .filter((h) => h.price > 0)
    .sort((a, b) => a.price - b.price)
    .slice(0, 6)
  return { source: 'amadeus', currency: 'TWD', hotels }
}

// ========== Travelpayouts ==========
async function tpFlights({ origin, dest, departMonth, returnMonth }) {
  const token = process.env.TRAVELPAYOUTS_TOKEN
  const qs = new URLSearchParams({
    origin,
    destination: dest,
    departure_at: departMonth,
    currency: 'twd',
    sorting: 'price',
    limit: '6',
    one_way: returnMonth ? 'false' : 'true',
    token: token || '',
  })
  if (returnMonth) qs.set('return_at', returnMonth)
  if (process.env.TRAVELPAYOUTS_MARKER) qs.set('marker', process.env.TRAVELPAYOUTS_MARKER)
  const r = await fetch(`https://api.travelpayouts.com/aviasales/v3/prices_for_dates?${qs}`)
  if (!r.ok) throw new Error('travelpayouts flights failed')
  const j = await r.json()
  const offers = (j.data || []).slice(0, 6).map((d) => ({
    airline: airlineName(d.airline),
    price: Math.round(Number(d.price || 0)),
    currency: (j.currency || 'twd').toUpperCase(),
    depart: d.departure_at ? d.departure_at.slice(11, 16) : '',
    duration: d.duration ? `${Math.floor(d.duration / 60)} 小時 ${d.duration % 60} 分` : '',
    stops: d.transfers ? `轉機 ${d.transfers} 次` : '直飛',
    url: d.link ? `https://www.aviasales.com${d.link}` : null,
  }))
  return { source: 'travelpayouts', currency: 'TWD', offers: offers.filter((o) => o.price > 0) }
}

async function tpHotels({ query, checkInDate, checkOutDate }) {
  const token = process.env.TRAVELPAYOUTS_TOKEN
  const qs = new URLSearchParams({
    location: query,
    currency: 'twd',
    checkIn: checkInDate,
    checkOut: checkOutDate,
    limit: '6',
    token: token || '',
  })
  const r = await fetch(`https://engine.hotellook.com/api/v2/cache.json?${qs}`)
  if (!r.ok) return { source: 'travelpayouts', currency: 'TWD', hotels: [] }
  const j = await r.json()
  const list = Array.isArray(j) ? j : j.hotels || []
  const hotels = list
    .map((h) => ({
      name: h.hotelName || h.name || '飯店',
      price: Math.round(Number(h.priceAvg || h.priceFrom || 0)),
      currency: 'TWD',
      stars: h.stars || null,
    }))
    .filter((h) => h.price > 0)
    .sort((a, b) => a.price - b.price)
    .slice(0, 6)
  return { source: 'travelpayouts', currency: 'TWD', hotels }
}

// ========== 對外統一介面 ==========
export async function getFlights(params) {
  const p = provider()
  if (p === 'amadeus' && process.env.AMADEUS_CLIENT_ID) {
    return { configured: true, ...(await amadeusFlights(params)) }
  }
  if (p === 'travelpayouts' && process.env.TRAVELPAYOUTS_TOKEN) {
    return { configured: true, ...(await tpFlights(params)) }
  }
  return { configured: false }
}

export async function getHotels(params) {
  const p = provider()
  if (p === 'amadeus' && process.env.AMADEUS_CLIENT_ID) {
    return { configured: true, ...(await amadeusHotels(params)) }
  }
  if (p === 'travelpayouts' && process.env.TRAVELPAYOUTS_TOKEN) {
    return { configured: true, ...(await tpHotels(params)) }
  }
  return { configured: false }
}
