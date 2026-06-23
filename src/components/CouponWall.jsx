import { useEffect, useState } from 'react'
import { getBundledCoupons } from '../services/coupons.js'
import { fetchLiveCoupons } from '../services/couponsApi.js'

// 在地優惠券牆：景點體驗、訂房、上網卡等合作夥伴折扣。
// 連接 Vercel KV 後顯示營運方管理的「即時優惠券」；未連接時顯示示範優惠券，
// 代碼為示範，按鈕一律連到合作夥伴官方優惠／搜尋頁（帶入本城市關鍵字）。

function CouponCard({ c }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    if (!c.code) return
    try {
      await navigator.clipboard.writeText(c.code)
    } catch {
      // 不支援剪貼簿時忽略，使用者仍可手動複製
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="coupon-card">
      <div className="coupon-card-left">
        <span className="coupon-card-emoji">{c.emoji || '🎟️'}</span>
        <span className="coupon-discount">{c.discount || '優惠'}</span>
      </div>
      <div className="coupon-card-body">
        <div className="coupon-card-head">
          <strong className="coupon-title">{c.title}</strong>
          {c.cat && <span className="coupon-cat">{c.cat}</span>}
        </div>
        <p className="coupon-partner">{c.partner}</p>
        {c.desc && <p className="coupon-desc">{c.desc}</p>}
        {c.expires && <p className="coupon-expires">⏳ {c.expires} 前</p>}
        <div className="coupon-actions">
          {c.code ? (
            <button type="button" className={`coupon-code ${copied ? 'copied' : ''}`} onClick={copy} title="點擊複製代碼">
              <span className="coupon-code-label">代碼</span>
              <span className="coupon-code-value">{c.code}</span>
              <span className="coupon-code-copy">{copied ? '已複製 ✓' : '複製'}</span>
            </button>
          ) : (
            <span className="coupon-code coupon-code-auto">
              <span className="coupon-code-value">點連結自動折扣</span>
            </span>
          )}
          <a className="btn btn-primary coupon-go" href={c.url} target="_blank" rel="noreferrer nofollow sponsored">
            {c.cta || `去 ${c.partner}`} ↗
          </a>
        </div>
      </div>
    </div>
  )
}

export default function CouponWall({ country, region }) {
  const countryId = country?.id
  const regionId = region?.id
  const [live, setLive] = useState(null) // 來自 KV 的即時優惠券

  useEffect(() => {
    let alive = true
    setLive(null)
    fetchLiveCoupons({ countryId, regionId }).then((r) => alive && setLive(r))
    return () => {
      alive = false
    }
  }, [countryId, regionId])

  const isLive = Array.isArray(live) && live.length > 0
  const coupons = isLive ? live : getBundledCoupons(region)

  return (
    <div className="coupon-wall">
      <div className="coupon-wall-head">
        {isLive ? (
          <span className="coupon-badge coupon-badge-live">🟢 合作優惠 · 即時</span>
        ) : (
          <span className="coupon-badge coupon-badge-demo">🎟️ 旅遊優惠（示範）</span>
        )}
        <span className="coupon-wall-note">
          {isLive
            ? '由站方更新，點「去使用」前往合作夥伴頁面結帳。'
            : '代碼為示範；點按鈕前往合作夥伴官方優惠頁，當下真實折扣以該頁為準。'}
        </span>
      </div>

      <div className="coupon-grid">
        {coupons.map((c) => (
          <CouponCard key={c.id} c={c} />
        ))}
      </div>

      <p className="coupon-disclaimer">
        ※ 透過上述連結前往合作平台消費，本站可能獲得分潤，不影響你的價格。優惠以合作夥伴條款為準。
      </p>
    </div>
  )
}
