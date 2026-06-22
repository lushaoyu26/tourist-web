import { useEffect, useState } from 'react'
import { getHotelTiers, bookingUrl, agodaUrl, airbnbUrl, fmtRange, fmt } from '../services/hotels.js'
import { fetchRealHotels } from '../services/hotelsApi.js'

// 住宿行情面板：三種等級的每晚行情區間（示範）+ 即時房價（有設定 API 金鑰時）+ 訂房平台連結。

export default function HotelPanel({ region }) {
  const tiers = getHotelTiers(region)
  const [real, setReal] = useState(null)

  useEffect(() => {
    let alive = true
    setReal(null)
    fetchRealHotels({ region }).then((r) => alive && setReal(r))
    return () => {
      alive = false
    }
  }, [region.id])

  const liveHotels = real?.hotels?.length ? real.hotels : null

  return (
    <div className="hotel-panel">
      {liveHotels && (
        <div className="hotel-live">
          <div className="price-source">
            <span className="price-source-live">🟢 即時房價 · 來源 {real.source === 'amadeus' ? 'Amadeus' : 'Hotellook'}（每晚起）</span>
          </div>
          <div className="hotel-live-list">
            {liveHotels.map((h, i) => (
              <div key={i} className="hotel-live-row">
                <span className="hotel-live-name">
                  {h.stars ? '⭐'.repeat(Math.min(5, Math.round(h.stars))) + ' ' : ''}
                  {h.name}
                </span>
                <strong className="hotel-live-price">
                  {!h.currency || h.currency === 'TWD' ? fmt(h.price) : `${h.currency} ${h.price.toLocaleString('en-US')}`}
                </strong>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="hotel-tiers">
        {tiers.map((tier) => (
          <div key={tier.id} className={`hotel-tier hotel-tier-${tier.id}`}>
            <span className="hotel-tier-emoji">{tier.emoji}</span>
            <h4>{tier.name}</h4>
            <p className="hotel-tier-price">{fmtRange(tier.range)}</p>
            <p className="hotel-tier-unit">每晚／雙人房</p>
            <p className="hotel-tier-desc">{tier.desc}</p>
          </div>
        ))}
      </div>

      <div className="hotel-areas">
        <h4>📍 推薦住宿區域</h4>
        <div className="hotel-areas-list">
          {region.hotels.areas.map((area) => (
            <span key={area} className="chip chip-outline">
              {area}
            </span>
          ))}
        </div>
      </div>

      <div className="panel-note">💡 行情為旺季參考區間，即時房價與空房請至訂房平台查詢：</div>
      <div className="panel-actions">
        <a className="btn btn-primary" href={bookingUrl(region)} target="_blank" rel="noreferrer">
          Booking.com 查空房 ↗
        </a>
        <a className="btn btn-ghost" href={agodaUrl(region)} target="_blank" rel="noreferrer">
          Agoda ↗
        </a>
        <a className="btn btn-ghost" href={airbnbUrl(region)} target="_blank" rel="noreferrer">
          Airbnb ↗
        </a>
      </div>
    </div>
  )
}
