import { getHotelTiers, bookingUrl, agodaUrl, airbnbUrl, fmtRange } from '../services/hotels.js'

// 住宿行情面板：三種等級的每晚行情區間 + 推薦住宿區 + 訂房平台即時查價連結。

export default function HotelPanel({ region }) {
  const tiers = getHotelTiers(region)

  return (
    <div className="hotel-panel">
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
