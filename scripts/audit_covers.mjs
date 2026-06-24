// 體檢每個國家的封面圖：用與 WikiImage 相同的邏輯查 Wikipedia 縮圖，
// 找出「查不到圖、只會顯示國旗 emoji」的國家。
// 加了 User-Agent + 節流 + 重試，避免被 Wikimedia 限流造成誤判。
// 用法：node scripts/audit_covers.mjs
import { COUNTRIES } from '../src/data/index.js'

const UA = 'WanderGlobe-CoverAudit/1.0 (https://wanderglobe.app; dev@wanderglobe.app)'

const apiHost = (title) =>
  /[一-鿿぀-ヿ가-힯]/.test(title) ? 'https://zh.wikipedia.org' : 'https://en.wikipedia.org'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// 回傳 { thumb: string|null, errored: bool }
async function thumb(title) {
  const url = `${apiHost(title)}/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, accept: 'application/json' } })
      if (res.status === 429 || res.status >= 500) {
        await sleep(500 * (attempt + 1))
        continue
      }
      if (res.status === 404) return { thumb: null, errored: false } // 條目不存在 = 真的沒圖
      if (!res.ok) {
        await sleep(400 * (attempt + 1))
        continue
      }
      const d = await res.json()
      return { thumb: d.thumbnail?.source || null, errored: false }
    } catch {
      await sleep(400 * (attempt + 1))
    }
  }
  return { thumb: null, errored: true } // 多次都失敗 = 不確定（限流/網路），不算真破
}

async function checkCountry(c) {
  const titles = Array.isArray(c.wiki) ? c.wiki : [c.wiki].filter(Boolean)
  let anyErrored = false
  for (const t of titles) {
    const { thumb: img, errored } = await thumb(t)
    if (img) return { ok: true }
    if (errored) anyErrored = true
    await sleep(120)
  }
  return { ok: false, errored: anyErrored }
}

const broken = [] // 確定沒圖
const unknown = [] // 限流/網路，不確定
let done = 0
// 低併發（2）逐國檢查
const CONC = 2
for (let i = 0; i < COUNTRIES.length; i += CONC) {
  const slice = COUNTRIES.slice(i, i + CONC)
  const res = await Promise.all(slice.map(checkCountry))
  res.forEach((r, j) => {
    const c = slice[j]
    if (r.ok) process.stdout.write('·')
    else if (r.errored) {
      process.stdout.write('?')
      unknown.push(c)
    } else {
      process.stdout.write('✗')
      broken.push(c)
    }
    done++
  })
}

console.log(`\n\n總共 ${COUNTRIES.length} 國`)
console.log(`✗ 確定查無圖（顯示國旗）：${broken.length} 國`)
for (const b of broken) console.log(`   ${b.id.padEnd(16)} ${b.name.padEnd(8)} wiki=${JSON.stringify(b.wiki)}`)
console.log(`\n? 限流/網路錯誤、不確定（需重跑）：${unknown.length} 國`)
for (const u of unknown) console.log(`   ${u.id.padEnd(16)} ${u.name.padEnd(8)} wiki=${JSON.stringify(u.wiki)}`)
