// 航班估價服務
// 目前為「示範估價」：以各航線的市場行情基準價 + 季節係數 + 確定性偽隨機產生，
// 之後可在 fetchFlightOptions() 內改接真實 API（如 Skyscanner RapidAPI、Amadeus、Kiwi Tequila）。

export const ORIGINS = [
  { id: 'TPE', city: '台北', flag: '🇹🇼', mult: 1.0 },
  { id: 'KHH', city: '高雄', flag: '🇹🇼', mult: 1.12 },
  { id: 'HKG', city: '香港', flag: '🇭🇰', mult: 0.95 },
  { id: 'SIN', city: '新加坡', flag: '🇸🇬', mult: 1.05 },
  { id: 'ICN', city: '首爾', flag: '🇰🇷', mult: 1.0 },
]

const AIRLINES = {
  japan: ['星宇航空', '長榮航空', '中華航空', '日本航空', '樂桃航空', '台灣虎航'],
  korea: ['中華航空', '長榮航空', '大韓航空', '韓亞航空', '台灣虎航', '德威航空'],
  thailand: ['長榮航空', '中華航空', '泰國航空', '星宇航空', '台灣虎航', '泰國獅航'],
  france: ['長榮航空（直飛）', '中華航空（直飛）', '法國航空', '國泰航空（轉機）', '新加坡航空（轉機）', '土耳其航空（轉機）'],
  italy: ['中華航空（直飛）', '長榮航空', '國泰航空（轉機）', '阿聯酋航空（轉機）', '卡達航空（轉機）'],
  iceland: ['冰島航空（轉機）', '北歐航空（轉機）', '英國航空（轉機）', '芬蘭航空（轉機）', '荷蘭皇家航空（轉機）'],
}

// 1-12 月的淡旺季係數（過年、暑假、年底較貴）
const SEASON = [1.2, 1.05, 0.92, 0.95, 1.0, 1.08, 1.25, 1.2, 0.92, 1.0, 1.02, 1.18]

export const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

// 確定性偽隨機：同一條航線同一個月，每次看到的價格一致
function seeded(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return (h >>> 0) / 4294967296
  }
}

const pad = (n) => String(n).padStart(2, '0')

export function getFlightOptions({ countryId, region, originId, month }) {
  const origin = ORIGINS.find((o) => o.id === originId) || ORIGINS[0]
  const airlines = AIRLINES[countryId] || AIRLINES.japan
  const rand = seeded(`${originId}-${region.id}-${month}`)
  const base = region.flight.base * origin.mult * SEASON[month - 1]

  const options = airlines.slice(0, 4).map((airline, i) => {
    const isLcc = /虎航|樂桃|獅航|德威/.test(airline)
    const transfer = /轉機/.test(airline) || !region.flight.direct
    let price = base * (0.85 + rand() * 0.45)
    if (isLcc) price *= 0.72
    if (transfer && region.flight.direct) price *= 0.88
    const depH = 6 + Math.floor(rand() * 16)
    const depM = Math.floor(rand() * 12) * 5
    return {
      id: `${region.id}-${originId}-${month}-${i}`,
      airline,
      depart: `${pad(depH)}:${pad(depM)}`,
      duration: region.flight.hours,
      stops: transfer ? '轉機 1 次' : '直飛',
      isLcc,
      price: Math.round(price / 100) * 100,
    }
  })
  options.sort((a, b) => a.price - b.price)
  return options
}

export function estimateFlightPrice({ region, originId, month }) {
  const opts = getFlightOptions({ countryId: 'x', region, originId, month })
  return Math.round((opts[0].price + opts[opts.length - 1].price) / 2 / 100) * 100
}

export function skyscannerUrl(region, originId = 'TPE') {
  const dest = region.airport?.sky || ''
  return `https://www.skyscanner.com.tw/transport/flights/${originId.toLowerCase()}/${dest}/`
}

export function googleFlightsUrl(region, originId = 'TPE') {
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(
    `flights from ${originId} to ${region.airport?.code?.split(' ')[0] || region.en}`
  )}`
}
