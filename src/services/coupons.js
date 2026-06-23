// 旅遊優惠券服務
// 提供「在地優惠」資料：景點體驗、訂房、上網卡等合作夥伴折扣。
//
// 兩種來源（與評論/廣告相同的「後端就緒 + 優雅回退」模式）：
//   1. 營運方在 Vercel 連接 KV 後，可從後台管理「即時優惠券」（見 api/coupons.js）。
//   2. 未連接時，顯示下方這組「示範優惠券」——代碼為示範，按鈕一律連到
//      合作夥伴的「官方優惠／搜尋頁」，使用者在那裡看到的才是當下真實的優惠。
//
// 連結會帶入當前城市的搜尋關鍵字，所以在東京頁就搜東京、在巴黎頁就搜巴黎。

import { bookingUrl, agodaUrl } from './hotels.js'

// 城市搜尋關鍵字（優先英文名，給國際平台用）
const qOf = (region) => encodeURIComponent(region?.en || region?.name || region?.hotels?.query || '')

const klookUrl = (region) => `https://www.klook.com/zh-TW/search/?query=${qOf(region)}`
const kkdayUrl = (region) => `https://www.kkday.com/zh-tw/product/list?keyword=${qOf(region)}`

// 示範優惠券（全站通用，連結依城市動態帶入）。code 為示範代碼，實際以合作夥伴頁面為準。
const BUNDLED = [
  {
    id: 'klook-experience',
    partner: 'Klook 客路',
    emoji: '🎟️',
    title: '景點門票・在地體驗 9 折起',
    discount: '9 折',
    desc: '主題樂園、一日遊、交通票券，新客下單再享折扣',
    code: 'KLOOKTW',
    cat: '體驗',
    cta: '去 Klook 找體驗',
    link: klookUrl,
  },
  {
    id: 'kkday-amount',
    partner: 'KKday',
    emoji: '🎫',
    title: '在地行程・滿額折抵',
    discount: '滿 NT$3,000 折 NT$300',
    desc: '在地體驗、機場接送、票券滿額現折',
    code: 'KKWANDER',
    cat: '體驗',
    cta: '去 KKday 找行程',
    link: kkdayUrl,
  },
  {
    id: 'booking-genius',
    partner: 'Booking.com',
    emoji: '🏨',
    title: 'Genius 會員訂房優惠',
    discount: '最高 -15%',
    desc: '登入 Genius 帳號，部分房源再享免費早餐／升等',
    code: '',
    cat: '住宿',
    cta: '去 Booking 查房',
    link: bookingUrl,
  },
  {
    id: 'agoda-member',
    partner: 'Agoda',
    emoji: '🛎️',
    title: '會員限定房價・閃購',
    discount: '最高 -20%',
    desc: 'App 訂房享會員專屬折扣與限時閃購',
    code: '',
    cat: '住宿',
    cta: '去 Agoda 查房',
    link: agodaUrl,
  },
  {
    id: 'airalo-esim',
    partner: 'Airalo',
    emoji: '📶',
    title: '旅遊上網 eSIM 95 折',
    discount: '95 折',
    desc: '免換卡、落地即用，200+ 國家／地區網路方案',
    code: 'WANDER5',
    cat: '上網',
    cta: '去 Airalo 買網卡',
    link: () => 'https://www.airalo.com/',
  },
  {
    id: 'tripcom-deal',
    partner: 'Trip.com',
    emoji: '✈️',
    title: '機票・訂房限時優惠',
    discount: '不定期放送',
    desc: '機＋酒、訂房不定期發放優惠碼與回饋',
    code: '',
    cat: '機票',
    cta: '去 Trip.com 看優惠',
    link: () => 'https://tw.trip.com/sale/',
  },
]

// 取得某城市的「示範」優惠券（解析動態連結）。回傳陣列，每張券皆標記 demo:true。
export function getBundledCoupons(region) {
  return BUNDLED.map((c) => ({
    id: c.id,
    partner: c.partner,
    emoji: c.emoji,
    title: c.title,
    discount: c.discount,
    desc: c.desc,
    code: c.code || '',
    cat: c.cat || '',
    cta: c.cta || `去 ${c.partner}`,
    url: typeof c.link === 'function' ? c.link(region) : c.link,
    demo: true,
  }))
}
