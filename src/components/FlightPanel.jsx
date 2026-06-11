import { useState } from 'react'
import { ORIGINS, MONTHS, getFlightOptions, skyscannerUrl, googleFlightsUrl } from '../services/flights.js'
import { fmt } from '../services/hotels.js'

// 「怎麼去」面板：選出發地與月份 → 顯示航班估價，附 Skyscanner / Google Flights 即時查價連結。

export default function FlightPanel({ country, region, origin, setOrigin, month, setMonth }) {
  const options = getFlightOptions({ countryId: country.id, region, originId: origin, month })

  return (
    <div className="flight-panel">
      <div className="flight-controls">
        <label className="control">
          <span className="control-label">出發地</span>
          <select value={origin} onChange={(e) => setOrigin(e.target.value)}>
            {ORIGINS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.flag} {o.city} ({o.id})
              </option>
            ))}
          </select>
        </label>
        <label className="control">
          <span className="control-label">出發月份</span>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.map((m) => (
              <option key={m} value={m}>
                {m} 月
              </option>
            ))}
          </select>
        </label>
        <div className="flight-route">
          <span className="flight-route-code">{origin}</span>
          <span className="flight-route-arrow">✈ {region.flight.direct ? '直飛' : '轉機'} ·{' '}
            {region.flight.hours}</span>
          <span className="flight-route-code">{region.airport.code.split(' ')[0]}</span>
        </div>
      </div>

      <div className="flight-options">
        {options.map((opt, i) => (
          <div key={opt.id} className={`flight-option ${i === 0 ? 'best' : ''}`}>
            {i === 0 && <span className="flight-option-badge">最低估價</span>}
            <div className="flight-option-main">
              <strong className="flight-option-airline">{opt.airline}</strong>
              <span className="flight-option-detail">
                {opt.depart} 出發 · {opt.duration} · {opt.stops}
                {opt.isLcc && ' · 廉航'}
              </span>
            </div>
            <strong className="flight-option-price">{fmt(opt.price)}</strong>
          </div>
        ))}
      </div>

      <div className="panel-note">
        💡 以上為來回每人示範估價（依市場行情與淡旺季模擬），實際票價請點擊即時查詢：
      </div>
      <div className="panel-actions">
        <a className="btn btn-primary" href={skyscannerUrl(region, origin)} target="_blank" rel="noreferrer">
          Skyscanner 即時比價 ↗
        </a>
        <a className="btn btn-ghost" href={googleFlightsUrl(region, origin)} target="_blank" rel="noreferrer">
          Google Flights ↗
        </a>
      </div>

      <div className="airport-info">
        <h4>🛬 機場進市區</h4>
        <p>
          <strong>{region.airport.name}（{region.airport.code}）</strong> — {region.airport.toCity}
        </p>
      </div>

      <div className="local-transport">
        <h4>🚌 當地交通</h4>
        <div className="local-transport-grid">
          {region.localTransport.map((t) => (
            <div key={t.name} className="local-transport-card">
              <span className="local-transport-icon">{t.icon}</span>
              <div>
                <strong>{t.name}</strong>
                <p>{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
