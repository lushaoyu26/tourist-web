// 從 region.bestSeason 文字推算 12 個月的旅遊適合度。
// 回傳長度 12 的陣列，每月為 'best' | 'ok' | 'low'：
//   best — bestSeason 點名的月份（含區間，可跨年如 12-2 月）
//   ok   — 最佳月份的相鄰月，或無法判斷時的中性值
//   low  — 其餘（淡季）
// 設計原則：只根據資料已有的 bestSeason 推算，不臆測「不可去」；
// 解析不到月份時全部給 ok（中性），避免誤導。

const wrapMonth = (m) => ((((m - 1) % 12) + 12) % 12) + 1 // 正規化到 1..12（環狀）

export function monthRatings(bestSeason) {
  const text = String(bestSeason || '')
  const yearRound = /全年|四季皆|整年|終年/.test(text)
  const best = new Set()
  let matched = false

  // 先比對所有「a-b 月 / a~b 月 / a至b 月」區間（含跨年）
  const rangeRe = /(\d{1,2})\s*[-~–—至到]\s*(\d{1,2})\s*月/g
  let m
  while ((m = rangeRe.exec(text))) {
    const a = Number(m[1])
    const b = Number(m[2])
    if (a < 1 || a > 12 || b < 1 || b > 12) continue
    const span = (b - a + 12) % 12 // 0=同月，跨年自動環繞
    for (let i = 0; i <= span; i++) best.add(wrapMonth(a + i))
    matched = true
  }

  // 再比對剩餘的單獨「n 月」（先移除區間，避免端點被重複計）
  const singleRe = /(\d{1,2})\s*月/g
  const stripped = text.replace(rangeRe, '')
  while ((m = singleRe.exec(stripped))) {
    const n = Number(m[1])
    if (n >= 1 && n <= 12) {
      best.add(n)
      matched = true
    }
  }

  if (yearRound) return Array.from({ length: 12 }, () => 'best')
  if (!matched) return Array.from({ length: 12 }, () => 'ok')

  // 最佳月份的左右相鄰月標為 ok（過渡季）
  const ok = new Set()
  for (const month of best) {
    ok.add(wrapMonth(month - 1))
    ok.add(wrapMonth(month + 1))
  }

  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    if (best.has(month)) return 'best'
    if (ok.has(month)) return 'ok'
    return 'low'
  })
}
