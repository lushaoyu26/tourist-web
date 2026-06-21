import { lazy, Suspense, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { COUNTRIES, COUNTRY_BY_ID, FEATURED_IDS, ALL_STOPS, getRandomRegionPath } from '../data/index.js'
import { useLang } from '../hooks/useLang.jsx'

const WorldGlobe = lazy(() => import('../components/WorldGlobe.jsx'))

export default function HomePage() {
  const navigate = useNavigate()
  const { t, lang } = useLang()

  useEffect(() => {
    document.title = '漫遊地球 WanderGlobe｜互動旅遊攻略'
  }, [])

  return (
    <div className="home">
      <Suspense fallback={<div className="globe-loading">🌏 地球載入中…</div>}>
        <WorldGlobe />
      </Suspense>

      <div className="home-hero">
        <h1>
          {t('heroTitle1')}
          <br />
          {t('heroTitle2')}
        </h1>
        <p>{t('heroSub')}</p>
        <button className="home-random" onClick={() => navigate(getRandomRegionPath())}>
          {t('randomCity')}
        </button>
      </div>

      <div className="home-hint">{t('hint')}</div>

      <div className="home-chips">
        {FEATURED_IDS.map((id) => COUNTRY_BY_ID[id]).map((c) => (
          <Link key={c.id} to={`/country/${c.id}`} className="home-chip" style={{ '--chip': c.color }}>
            <span className="home-chip-flag">{c.flag}</span>
            <span>{lang === 'en' ? c.en : c.name}</span>
            <span className="home-chip-count">{c.regions.length} {lang === 'en' ? 'areas' : '區域'}</span>
          </Link>
        ))}
        <Link to="/destinations" className="home-chip home-chip-more" style={{ '--chip': '#6ee7d8' }}>
          <span className="home-chip-flag">🗺️</span>
          <span>{t('countriesCities', COUNTRIES.length, ALL_STOPS.length)}</span>
        </Link>
      </div>
    </div>
  )
}
