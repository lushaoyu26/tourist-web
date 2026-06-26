import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GROUPS, COUNTRIES, ALL_STOPS, getRandomRegionPath } from '../data/index.js'
import { useLang } from '../hooks/useLang.jsx'
import ParticleField from '../components/ParticleField.jsx'
import CustomCursor from '../components/CustomCursor.jsx'

const WorldGlobe = lazy(() => import('../components/WorldGlobe.jsx'))

// 各大洲：中心經緯（鏡頭飛去）+ 由資料的 GROUPS 聚合出該洲國家
const CONTINENT_DEFS = [
  { id: 'asia', en: 'Asia', zh: '亞洲', lat: 30, lng: 98, groupIds: ['east-asia', 'southeast-asia', 'south-asia', 'central-asia', 'caucasus-anatolia', 'middle-east'] },
  { id: 'europe', en: 'Europe', zh: '歐洲', lat: 52, lng: 14, groupIds: ['west-europe', 'south-europe', 'north-europe', 'central-europe', 'balkans'] },
  { id: 'africa', en: 'Africa', zh: '非洲', lat: 3, lng: 21, groupIds: ['north-africa', 'west-africa', 'central-africa', 'east-africa', 'southern-africa'] },
  { id: 'americas', en: 'Americas', zh: '美洲', lat: 8, lng: -80, groupIds: ['north-america', 'central-america', 'south-america'] },
  { id: 'oceania', en: 'Oceania', zh: '大洋洲', lat: -24, lng: 140, groupIds: ['oceania'] },
]
const CONTINENTS = CONTINENT_DEFS.map((c) => ({
  ...c,
  countries: c.groupIds.flatMap((gid) => GROUPS.find((g) => g.id === gid)?.countries || []),
}))

export default function HomePage() {
  const navigate = useNavigate()
  const { t, lang } = useLang()
  const [active, setActive] = useState(-1) // -1 = 開場總覽
  const [lite, setLite] = useState(() => {
    try {
      return localStorage.getItem('wg-lite-v1') === '1'
    } catch {
      return false
    }
  })
  const secRefs = useRef([])

  useEffect(() => {
    document.title = '漫遊地球 WanderGlobe｜互動旅遊攻略'
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('wg-lite-v1', lite ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [lite])

  // 捲動偵測：哪個區段在畫面中央，就聚焦該洲
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && e.intersectionRatio >= 0.55) {
            setActive(Number(e.target.dataset.idx))
          }
        })
      },
      { threshold: [0.55], rootMargin: '-10% 0px -10% 0px' }
    )
    secRefs.current.forEach((el) => el && obs.observe(el))
    return () => obs.disconnect()
  }, [])

  const focus = useMemo(
    () => (active < 0 ? null : { lat: CONTINENTS[active].lat, lng: CONTINENTS[active].lng, altitude: 1.55 }),
    [active]
  )

  return (
    <div className={`home home-at at-journey ${lite ? 'lite' : ''}`}>
      {!lite && <ParticleField />}
      {!lite && <CustomCursor />}

      <div className="at-globe-layer">
        <Suspense fallback={<div className="globe-loading">載入中…</div>}>
          <WorldGlobe focus={focus} />
        </Suspense>
        <div className="at-glow" aria-hidden="true" />
      </div>

      {/* 開場 */}
      <section className="at-sec at-intro" data-idx="-1" ref={(el) => (secRefs.current[0] = el)}>
        <div className="at-hero">
          <span className="at-eyebrow">✦ {COUNTRIES.length} COUNTRIES · {ALL_STOPS.length} CITIES</span>
          <h1 className="at-title">
            {t('heroTitle1')}
            <br />
            {t('heroTitle2')}
          </h1>
          <p className="at-sub">{t('heroSub')}</p>
          <div className="at-actions">
            <button className="at-btn at-btn-primary magnetic" onClick={() => navigate(getRandomRegionPath())}>
              <span>{t('randomCity')}</span>
            </button>
            <Link to="/destinations" className="at-btn at-btn-ghost magnetic">
              <span>瀏覽全部目的地</span>
            </Link>
          </div>
        </div>
        <div className="at-scrollcue" aria-hidden="true">
          <span>向下捲動 · 穿越五大洲</span>
          <span className="at-scrollcue-arrow">↓</span>
        </div>
      </section>

      {/* 各大洲 */}
      {CONTINENTS.map((c, i) => (
        <section
          key={c.id}
          className={`at-sec at-continent ${active === i ? 'on' : ''}`}
          data-idx={i}
          ref={(el) => (secRefs.current[i + 1] = el)}
        >
          <div className="at-cont-panel">
            <span className="at-cont-index">
              {String(i + 1).padStart(2, '0')} <em>/ {String(CONTINENTS.length).padStart(2, '0')}</em>
            </span>
            <h2 className="at-cont-title">{c.en}</h2>
            <p className="at-cont-zh">{c.zh} · {c.countries.length} 個國家</p>
            <div className="at-cont-grid">
              {c.countries.map((country) => (
                <Link key={country.id} to={`/country/${country.id}`} className="at-cont-card">
                  <span className="at-cc-flag">{country.flag}</span>
                  <span className="at-cc-name">{lang === 'en' ? country.en : country.name}</span>
                  <span className="at-cc-count">{country.regions.length}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ))}

      <button
        className="at-lite-toggle"
        onClick={() => setLite((v) => !v)}
        title="低階裝置可開啟精簡模式，關閉粒子/游標等特效"
      >
        {lite ? '✨ 開啟特效' : '⚡ 精簡模式'}
      </button>
    </div>
  )
}
