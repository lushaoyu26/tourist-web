import { estimateFlightPrice } from './flights.js'

// 行程預算計算：把多個停留點的每人花費加總，給出一趟自由行的估算總價。

const mid = ([a, b]) => (a + b) / 2

// 取得區域的建議天數（從 suggestedDays 字串解析，取下限；解析失敗給 3）
export function defaultDays(region) {
  const m = String(region?.suggestedDays || '').match(/\d+/)
  return m ? Number(m[0]) : 3
}

// 單一停留點的每人花費（住宿以雙人房均分計）
export function stopCost(region, days) {
  const nights = Math.max(days, 1)
  const hotelPerPerson = mid(region.hotels.mid) / 2
  const perDay = mid(region.dailyCost.food) + mid(region.dailyCost.transport) + mid(region.dailyCost.activity)
  return Math.round(hotelPerPerson * nights + perDay * days)
}

// 整趟行程估算（每人）：國際機票（飛第一站來回）+ 各站地面花費
export function tripEstimate(stops, originId = 'TPE', month = new Date().getMonth() + 1) {
  let ground = 0
  let totalDays = 0
  for (const { region, days } of stops) {
    ground += stopCost(region, days)
    totalDays += days
  }
  const flight = stops.length ? estimateFlightPrice({ region: stops[0].region, originId, month }) : 0
  return { flight, ground, total: flight + ground, totalDays, count: stops.length }
}
