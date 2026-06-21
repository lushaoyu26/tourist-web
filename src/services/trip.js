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

// ===== 行程分享：把行程編碼進網址，朋友點開連結就看到你排好的行程 =====
// 格式：每站 countryId~regionId~days，多站以逗號相連。
// id 皆為 kebab/單字，不含 ~ 或 , ，故可安全分隔。
const STOP_SEP = ','
const FIELD_SEP = '~'

export function serializeTrip(items) {
  return (items || [])
    .map((it) => [it.countryId, it.regionId, it.days ?? ''].join(FIELD_SEP))
    .join(STOP_SEP)
}

export function parseTripParam(str) {
  if (!str) return []
  return String(str)
    .split(STOP_SEP)
    .map((chunk) => {
      const [countryId, regionId, days] = chunk.split(FIELD_SEP)
      if (!countryId || !regionId) return null
      const d = Number(days)
      return { countryId, regionId, days: Number.isFinite(d) && d > 0 ? d : null }
    })
    .filter(Boolean)
}

// ===== 行程匯出：產生 iCalendar(.ics)，每一站是一段跨日的全天事件，依序串接 =====
const pad2 = (n) => String(n).padStart(2, '0')
const icsDate = (d) => `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`
const icsEsc = (s) => String(s).replace(/[\\;,]/g, (m) => '\\' + m).replace(/\n/g, '\\n')

export function buildICS(stops, startDateStr) {
  let cursor = new Date(`${startDateStr}T00:00:00`)
  if (isNaN(cursor.getTime())) cursor = new Date()
  const stamp = icsDate(new Date()) + 'T000000Z'
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//WanderGlobe//Trip//ZH-Hant',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:漫遊地球行程',
  ]
  stops.forEach((s, i) => {
    const start = new Date(cursor)
    const end = new Date(cursor)
    end.setDate(end.getDate() + Math.max(1, s.days))
    lines.push(
      'BEGIN:VEVENT',
      `UID:wanderglobe-${i}-${s.countryId}-${s.regionId}@wanderglobe.app`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${icsDate(start)}`,
      `DTEND;VALUE=DATE:${icsDate(end)}`,
      `SUMMARY:${icsEsc(`${s.country.flag} ${s.region.name}（${s.days} 天）`)}`,
      `DESCRIPTION:${icsEsc(`第 ${i + 1} 站 · ${s.region.en || ''}${s.region.tagline ? ' — ' + s.region.tagline : ''}`)}`,
      'END:VEVENT'
    )
    cursor = end
  })
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}
