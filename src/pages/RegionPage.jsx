import { useEffect, useState } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import WikiImage from '../components/WikiImage.jsx'
import GuideMap from '../components/GuideMap.jsx'
import FlightPanel from '../components/FlightPanel.jsx'
import HotelPanel from '../components/HotelPanel.jsx'
import BudgetEstimator from '../components/BudgetEstimator.jsx'
import PhotoWall from '../components/PhotoWall.jsx'
import { getRegion } from '../data/index.js'
import { useTrip } from '../hooks/useTrip.jsx'
import { defaultDays } from '../services/trip.js'

const SECTIONS = [
  { id: 'transport', icon: '✈️', label: '怎麼去' },
  { id: 'map', icon: '🗺️', label: '攻略地圖' },
  { id: 'food', icon: '🍜', label: '在地美食' },
  { id: 'hotel', icon: '🏨', label: '住宿行情' },
  { id: 'itinerary', icon: '📋', label: '行程攻略' },
  { id: 'budget', icon: '💰', label: '預算估算' },
  { id: 'photos', icon: '📸', label: '照片牆' },
]

export default function RegionPage() {
  const { countryId, regionId } = useParams()
  const { country, region } = getRegion(countryId, regionId)
  const [origin, setOrigin] = useState('TPE')
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const { has, toggle } = useTrip()
  const inTrip = region ? has(countryId, regionId) : false

  useEffect(() => {
    if (region) document.title = `${region.name}完整攻略｜漫遊地球`
    window.scrollTo(0, 0)
  }, [countryId, regionId])

  if (!country || !region) return <Navigate to="/" replace />

  const scrollTo = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <div className="page region-page" style={{ '--accent': country.color }}>
      <section className="region-hero">
        <WikiImage wiki={region.wiki} alt={region.name} emoji={region.emoji} className="region-hero-img" />
        <div className="region-hero-overlay" />
        <div className="region-hero-content">
          <nav className="breadcrumbs">
            <Link to="/">🌏 世界地圖</Link>
            <span>/</span>
            <Link to={`/country/${country.id}`}>
              {country.flag} {country.name}
            </Link>
            <span>/</span>
            <strong>{region.name}</strong>
          </nav>
          <h1>
            <span className="region-hero-emoji">{region.emoji}</span>
            {region.name}
            <span className="region-hero-en">{region.en}</span>
          </h1>
          <p className="region-hero-tagline">{region.tagline}</p>
          <p className="region-hero-desc">{region.description}</p>
          <div className="region-hero-facts">
            <span className="chip chip-glass">📅 建議 {region.suggestedDays}</span>
            <span className="chip chip-glass">🌸 {region.bestSeason}</span>
            <span className="chip chip-glass">🛬 {region.airport.code}</span>
          </div>
          <button
            className={`trip-add-btn region-hero-trip ${inTrip ? 'added' : ''}`}
            onClick={() => toggle(countryId, regionId, defaultDays(region))}
          >
            {inTrip ? '✓ 已加入行程' : '＋ 加入我的行程'}
          </button>
        </div>
      </section>

      {country.advisory && (
        <div className="advisory-banner" role="alert">
          {country.advisory}
        </div>
      )}

      <nav className="section-nav">
        {SECTIONS.map((s) => (
          <button key={s.id} onClick={() => scrollTo(s.id)}>
            <span>{s.icon}</span> {s.label}
          </button>
        ))}
      </nav>

      <section id="transport" className="section">
        <h2 className="section-title">
          <span className="section-title-icon">✈️</span>怎麼去{region.name}
          <span className="section-title-sub">選擇出發地與月份，比較航班估價</span>
        </h2>
        <FlightPanel
          country={country}
          region={region}
          origin={origin}
          setOrigin={setOrigin}
          month={month}
          setMonth={setMonth}
        />
      </section>

      <section id="map" className="section">
        <h2 className="section-title">
          <span className="section-title-icon">🗺️</span>攻略地圖
          <span className="section-title-sub">點擊左側景點，地圖立即飛過去</span>
        </h2>
        <GuideMap region={region} />
      </section>

      <section id="food" className="section">
        <h2 className="section-title">
          <span className="section-title-icon">🍜</span>在地必吃美食
        </h2>
        <div className="food-grid">
          {region.foods.map((f) => (
            <div key={f.name} className="food-card">
              <span className="food-card-emoji">{f.emoji}</span>
              <div className="food-card-body">
                <h4>{f.name}</h4>
                <p>{f.desc}</p>
                <span className="food-card-price">{f.price}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="hotel" className="section">
        <h2 className="section-title">
          <span className="section-title-icon">🏨</span>住宿行情
          <span className="section-title-sub">每晚雙人房參考價（新台幣）</span>
        </h2>
        <HotelPanel region={region} />
      </section>

      <section id="itinerary" className="section">
        <h2 className="section-title">
          <span className="section-title-icon">📋</span>經典行程攻略
        </h2>
        <div className="itinerary">
          {region.itinerary.map((it) => (
            <div key={it.day} className="itinerary-row">
              <span className="itinerary-day">{it.day}</span>
              <p className="itinerary-plan">{it.plan}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="budget" className="section">
        <h2 className="section-title">
          <span className="section-title-icon">💰</span>旅費預算估算器
          <span className="section-title-sub">拉一拉，立刻知道這趟要準備多少錢</span>
        </h2>
        <BudgetEstimator region={region} origin={origin} month={month} />
      </section>

      <section id="photos" className="section">
        <h2 className="section-title">
          <span className="section-title-icon">📸</span>照片牆
        </h2>
        <PhotoWall region={region} />
      </section>

      <div className="region-footer-nav">
        <Link to={`/country/${country.id}`} className="btn btn-ghost">
          ← 回{country.name}總覽
        </Link>
        <Link to="/" className="btn btn-primary">
          🌏 探索其他國家
        </Link>
      </div>
    </div>
  )
}
