// 開發輔助腳本：驗證所有國家資料檔的結構完整性，並比對 admin 是否存在於 GeoJSON
import { readFileSync } from 'node:fs'
import { COUNTRIES } from '../src/data/index.js'

const geo = JSON.parse(readFileSync(new URL('../public/data/countries.geojson', import.meta.url)))
const admins = new Set(geo.features.map((f) => f.properties.ADMIN))

// 110m 地圖沒有形狀的微型目的地（地球上不會亮起，但其他頁面正常）
const NO_POLYGON_OK = new Set(['singapore', 'hongkong', 'macau', 'maldives'])

const COUNTRY_FIELDS = ['id', 'name', 'en', 'admin', 'flag', 'color', 'tagline', 'description', 'highlights', 'wiki', 'facts', 'regions']
const REGION_FIELDS = ['id', 'name', 'en', 'emoji', 'tagline', 'description', 'wiki', 'center', 'zoom', 'suggestedDays', 'bestSeason', 'bestFor', 'airport', 'flight', 'attractions', 'foods', 'localTransport', 'hotels', 'itinerary', 'dailyCost']
const FACT_FIELDS = ['currency', 'language', 'visa', 'timezone', 'bestSeason', 'plug']

let errors = 0
const err = (msg) => {
  console.log('❌', msg)
  errors++
}

const ids = new Set()
let regionCount = 0

for (const c of COUNTRIES) {
  if (ids.has(c.id)) err(`${c.id}: 重複的國家 id`)
  ids.add(c.id)
  for (const f of COUNTRY_FIELDS) if (c[f] == null) err(`${c.id}: 缺國家欄位 ${f}`)
  if (!admins.has(c.admin) && !NO_POLYGON_OK.has(c.id)) err(`${c.id}: admin "${c.admin}" 不存在於 GeoJSON`)
  for (const f of FACT_FIELDS) if (!c.facts?.[f]) err(`${c.id}: 缺 facts.${f}`)
  if (!/^#[0-9a-fA-F]{6}$/.test(c.color)) err(`${c.id}: color 格式錯誤 ${c.color}`)

  const rids = new Set()
  for (const r of c.regions) {
    regionCount++
    if (rids.has(r.id)) err(`${c.id}/${r.id}: 重複的區域 id`)
    rids.add(r.id)
    for (const f of REGION_FIELDS) if (r[f] == null) err(`${c.id}/${r.id}: 缺區域欄位 ${f}`)
    if (!Array.isArray(r.center) || r.center.length !== 2) err(`${c.id}/${r.id}: center 格式錯誤`)
    if (typeof r.flight?.base !== 'number') err(`${c.id}/${r.id}: flight.base 非數字`)
    if (!r.airport?.sky || r.airport.sky !== r.airport.sky.toLowerCase()) err(`${c.id}/${r.id}: airport.sky 異常`)
    for (const tier of ['budget', 'mid', 'luxury'])
      if (!Array.isArray(r.hotels?.[tier]) || r.hotels[tier].length !== 2) err(`${c.id}/${r.id}: hotels.${tier} 異常`)
    for (const k of ['food', 'transport', 'activity'])
      if (!Array.isArray(r.dailyCost?.[k])) err(`${c.id}/${r.id}: dailyCost.${k} 異常`)
    for (const a of r.attractions || []) {
      if (!Array.isArray(a.coords) || a.coords.length !== 2 || typeof a.coords[0] !== 'number')
        err(`${c.id}/${r.id}/${a.name}: coords 異常`)
      if (!a.wiki) err(`${c.id}/${r.id}/${a.name}: 缺 wiki`)
      if (!['sight', 'culture', 'nature', 'shopping', 'food'].includes(a.type))
        err(`${c.id}/${r.id}/${a.name}: type 異常 ${a.type}`)
    }
    if ((r.attractions?.length || 0) < 4) err(`${c.id}/${r.id}: 景點少於 4 個`)
    if ((r.foods?.length || 0) < 3) err(`${c.id}/${r.id}: 美食少於 3 個`)
  }
}

console.log(`\n共 ${COUNTRIES.length} 國、${regionCount} 個區域`)
console.log(errors ? `共 ${errors} 個錯誤` : '✅ 全部通過')
process.exit(errors ? 1 : 0)
