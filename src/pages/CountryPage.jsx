import { useEffect } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import WikiImage from '../components/WikiImage.jsx'
import { getCountry } from '../data/index.js'

const FACT_LABELS = {
  currency: { icon: '💰', label: '貨幣匯率' },
  language: { icon: '💬', label: '語言' },
  visa: { icon: '🛂', label: '簽證' },
  timezone: { icon: '🕐', label: '時區' },
  bestSeason: { icon: '🌸', label: '最佳季節' },
  plug: { icon: '🔌', label: '電壓插座' },
}

export default function CountryPage() {
  const { countryId } = useParams()
  const country = getCountry(countryId)

  useEffect(() => {
    if (country) document.title = `${country.name}旅遊攻略｜漫遊地球`
    window.scrollTo(0, 0)
  }, [countryId])

  if (!country) return <Navigate to="/" replace />

  return (
    <div className="page country-page">
      <section className="country-hero" style={{ '--accent': country.color }}>
        <WikiImage wiki={country.wiki} alt={country.name} emoji={country.flag} className="country-hero-img" />
        <div className="country-hero-overlay" />
        <div className="country-hero-content">
          <nav className="breadcrumbs">
            <Link to="/">🌏 世界地圖</Link>
            <span>/</span>
            <strong>{country.name}</strong>
          </nav>
          <h1>
            <span className="country-hero-flag">{country.flag}</span>
            {country.name}
            <span className="country-hero-en">{country.en}</span>
          </h1>
          <p className="country-hero-tagline">{country.tagline}</p>
          <p className="country-hero-desc">{country.description}</p>
          <div className="country-hero-highlights">
            {country.highlights.map((h) => (
              <span key={h} className="chip chip-glass">
                ✦ {h}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="facts-grid">
          {Object.entries(country.facts).map(([key, value]) => (
            <div key={key} className="fact-card">
              <span className="fact-icon">{FACT_LABELS[key]?.icon}</span>
              <div>
                <p className="fact-label">{FACT_LABELS[key]?.label}</p>
                <p className="fact-value">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">
          <span className="section-title-icon">🗺️</span>
          探索{country.name}的精選區域
          <span className="section-title-sub">點擊任一區域，進入完整攻略</span>
        </h2>
        <div className="region-grid">
          {country.regions.map((region) => (
            <Link
              key={region.id}
              to={`/country/${country.id}/region/${region.id}`}
              className="region-card"
              style={{ '--accent': country.color }}
            >
              <div className="region-card-media">
                <WikiImage wiki={region.wiki} alt={region.name} emoji={region.emoji} />
                <span className="region-card-emoji">{region.emoji}</span>
              </div>
              <div className="region-card-body">
                <h3>
                  {region.name}
                  <span className="region-card-en">{region.en}</span>
                </h3>
                <p className="region-card-tagline">{region.tagline}</p>
                <p className="region-card-desc">{region.description}</p>
                <div className="region-card-meta">
                  <span>📅 {region.suggestedDays}</span>
                  <span>✈️ {region.flight.hours}</span>
                </div>
                <div className="region-card-tags">
                  {region.bestFor.map((tag) => (
                    <span key={tag} className="chip chip-soft">
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="region-card-cta">查看完整攻略 →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
