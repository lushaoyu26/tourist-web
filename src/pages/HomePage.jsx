import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GROUPS, COUNTRIES, ALL_STOPS, getRandomRegionPath } from '../data/index.js'
import { useLang } from '../hooks/useLang.jsx'
import ParticleField from '../components/ParticleField.jsx'
import CustomCursor from '../components/CustomCursor.jsx'

const WorldGlobe = lazy(() => import('../components/WorldGlobe.jsx'))

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
const STOPS = [{ label: 'START' }, ...CONTINENTS.map((c) => ({ label: c.en }))]

export default function HomePage() {
  const navigate = useNavigate()
  const { t, lang } = useLang()
  const [active, setActive] = useState(-1) // -1 = 開場
  const [progress, setProgress] = useState(0)
  const [lite, setLite] = useState(() => {
    try {
      return localStorage.getItem('wg-lite-v1') === '1'
    } catch {
      return false
    }
  })
  const secRefs = useRef([])
  const trackRef = useRef(null)

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

  // 哪個區段在中央就聚焦該洲
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && e.intersectionRatio >= 0.55) setActive(Number(e.target.dataset.idx))
        })
      },
      { threshold: [0.55], rootMargin: '-8% 0px -8% 0px' }
    )
    secRefs.current.forEach((el) => el && obs.observe(el))
    return () => obs.disconnect()
  }, [])

  // 捲動進度（給側邊拖曳桿）
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const focus = useMemo(
    () => (active < 0 ? null : { lat: CONTINENTS[active].lat, lng: CONTINENTS[active].lng, altitude: 1.78 }),
    [active]
  )

  const goTo = (k) => secRefs.current[k]?.scrollIntoView({ behavior: 'smooth' })

  // 拖曳側邊桿子 → 捲動頁面
  const onRailDrag = (e) => {
    e.preventDefault()
    const move = (ev) => {
      const r = trackRef.current?.getBoundingClientRect()
      if (!r) return
      const p = Math.min(1, Math.max(0, (ev.clientY - r.top) / r.height))
      const max = document.documentElement.scrollHeight - window.innerHeight
      window.scrollTo({ top: p * max })
    }
    const up = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      document.body.classList.remove('rail-dragging')
    }
    document.body.classList.add('rail-dragging')
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

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
      </section>

      {/* 各洲：空白捲動區段（地球可從中拖曳） */}
      {CONTINENTS.map((c, i) => (
        <section
          key={c.id}
          className="at-sec at-continent"
          data-idx={i}
          ref={(el) => (secRefs.current[i + 1] = el)}
        />
      ))}

      {/* 各洲固定 UI：左上小標題 + 底部國家小橫列（只有聚焦的洲顯示） */}
      {CONTINENTS.map((c, i) => (
        <div key={c.id} className={`at-cont-ui ${active === i ? 'on' : ''}`} aria-hidden={active !== i}>
          <div className="at-cont-label">
            <span className="at-cont-index">
              {String(i + 1).padStart(2, '0')} <em>/ {String(CONTINENTS.length).padStart(2, '0')}</em>
            </span>
            <h2 className="at-cont-title">{c.en}</h2>
            <p className="at-cont-zh">{c.zh} · {c.countries.length} 國 · 拖曳地球轉到你要的國家</p>
          </div>
          <div className="at-cont-strip">
            {c.countries.map((country) => (
              <Link key={country.id} to={`/country/${country.id}`} className="at-chip">
                <span className="at-chip-flag">{country.flag}</span>
                <span className="at-chip-name">{lang === 'en' ? country.en : country.name}</span>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* 側邊拖曳桿 / 捲動進度 */}
      <div className="at-rail">
        <span className="at-rail-hint">SCROLL</span>
        <div className="at-rail-track" ref={trackRef}>
          <div className="at-rail-fill" style={{ height: `${progress * 100}%` }} />
          {STOPS.map((s, k) => (
            <button
              key={s.label}
              className={`at-rail-dot ${active + 1 === k ? 'on' : ''}`}
              style={{ top: `${(k / (STOPS.length - 1)) * 100}%` }}
              onClick={() => goTo(k)}
              title={s.label}
            >
              <span className="at-rail-label">{s.label}</span>
            </button>
          ))}
          <div className="at-rail-handle" style={{ top: `${progress * 100}%` }} onMouseDown={onRailDrag} title="拖曳我往下" />
        </div>
        <span className="at-rail-arrow" aria-hidden="true">↓</span>
      </div>

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
