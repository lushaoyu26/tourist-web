import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import WikiImage from '../components/WikiImage.jsx'
import AdSlot from '../components/AdSlot.jsx'
import { GROUPS, COUNTRIES } from '../data/index.js'

export default function DestinationsPage() {
  useEffect(() => {
    document.title = '全部目的地｜漫遊地球'
    window.scrollTo(0, 0)
  }, [])

  const regionCount = COUNTRIES.reduce((sum, c) => sum + c.regions.length, 0)

  return (
    <div className="page destinations-page">
      <section className="destinations-hero">
        <h1>🗺️ 全部目的地</h1>
        <p>
          目前收錄 <strong>{COUNTRIES.length}</strong> 個目的地、<strong>{regionCount}</strong>{' '}
          個精選區域攻略，持續增加中
        </p>
      </section>

      <div className="section ad-wrap">
        <AdSlot slot="destinations-top" label="贊助" />
      </div>

      {GROUPS.map((group, gi) => (
        <section key={group.id} className="section">
          {gi === 3 && (
            <div className="ad-wrap ad-wrap-inline">
              <AdSlot slot="destinations-mid" label="贊助" />
            </div>
          )}
          <h2 className="section-title">
            <span className="section-title-icon">{group.emoji}</span>
            {group.name}
            <span className="section-title-sub">{group.countries.length} 個目的地</span>
          </h2>
          <div className="dest-grid">
            {group.countries.map((c) => (
              <Link key={c.id} to={`/country/${c.id}`} className="dest-card" style={{ '--accent': c.color }}>
                <div className="dest-card-media">
                  <WikiImage wiki={c.wiki} alt={c.name} emoji={c.flag} />
                </div>
                <div className="dest-card-body">
                  <h3>
                    <span className="dest-card-flag">{c.flag}</span>
                    {c.name}
                    <span className="dest-card-en">{c.en}</span>
                  </h3>
                  <p className="dest-card-tagline">{c.tagline}</p>
                  <div className="dest-card-meta">
                    <span>{c.regions.length} 個區域</span>
                    <span className="dest-card-cta">探索 →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
