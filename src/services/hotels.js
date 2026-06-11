// 住宿行情服務
// 行情區間來自各區域資料的市場參考價（TWD／雙人房／晚），
// 之後可改接 Booking.com Affiliate API 或 RapidAPI 的飯店比價資料。

export const HOTEL_TIERS = [
  {
    id: 'budget',
    name: '青旅・商務',
    emoji: '🛏️',
    desc: '青年旅館床位、膠囊旅館或平價商務旅店，乾淨舒適為主',
  },
  {
    id: 'mid',
    name: '舒適三四星',
    emoji: '🏨',
    desc: '連鎖飯店或設計旅店，地點便利、含早餐選擇多',
  },
  {
    id: 'luxury',
    name: '五星・度假村',
    emoji: '✨',
    desc: '國際五星、溫泉旅館或海濱度假村，享受本身就是行程',
  },
]

export function getHotelTiers(region) {
  return HOTEL_TIERS.map((tier) => ({
    ...tier,
    range: region.hotels[tier.id],
  }))
}

export function bookingUrl(region) {
  return `https://www.booking.com/searchresults.zh-tw.html?ss=${encodeURIComponent(region.hotels.query)}`
}

export function agodaUrl(region) {
  return `https://www.agoda.com/zh-tw/search?textToSearch=${encodeURIComponent(region.hotels.query)}`
}

export function airbnbUrl(region) {
  return `https://www.airbnb.com.tw/s/${encodeURIComponent(region.hotels.query)}/homes`
}

export const fmt = (n) => `NT$${Math.round(n).toLocaleString('en-US')}`
export const fmtRange = ([a, b]) => `${fmt(a)} - ${fmt(b)}`
