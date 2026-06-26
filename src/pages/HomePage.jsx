import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { COUNTRIES, ALL_STOPS, getRandomRegionPath } from '../data/index.js'
import { useLang } from '../hooks/useLang.jsx'
import ParticleField from '../components/ParticleField.jsx'
import CustomCursor from '../components/CustomCursor.jsx'

const WorldGlobe = lazy(() => import('../components/WorldGlobe.jsx'))

// 磁吸效果：.magnetic 元素在游標靠近時朝游標微移
function useMagnetic(enabled) {
  useEffect(() => {
    if (!enabled) return
    const els = Array.from(document.querySelectorAll('.magnetic'))
    const cleanups = els.map((el) => {
      const onMove = (e) => {
        const r = el.getBoundingClientRect()
        const dx = e.clientX - (r.left + r.width / 2)
        const dy = e.clientY - (r.top + r.height / 2)
        el.style.transform = `translate(${dx * 0.3}px, ${dy * 0.4}px)`
      }
      const onLeave = () => {
        el.style.transform = ''
      }
      el.addEventListener('mousemove', onMove)
      el.addEventListener('mouseleave', onLeave)
      return () => {
        el.removeEventListener('mousemove', onMove)
        el.removeEventListener('mouseleave', onLeave)
      }
    })
    return () => cleanups.forEach((c) => c())
  }, [enabled])
}

export default function HomePage() {
  const navigate = useNavigate()
  const { t } = useLang()
  const [loaded, setLoaded] = useState(false)
  const [lite, setLite] = useState(() => {
    try {
      return localStorage.getItem('wg-lite-v1') === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    document.title = '漫遊地球 WanderGlobe｜互動旅遊攻略'
    const id = setTimeout(() => setLoaded(true), 90)
    return () => clearTimeout(id)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('wg-lite-v1', lite ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [lite])

  useMagnetic(!lite && loaded)

  return (
    <div className={`home home-at ${loaded ? 'loaded' : ''} ${lite ? 'lite' : ''}`}>
      {!lite && <ParticleField />}
      {!lite && <CustomCursor />}

      <Suspense fallback={<div className="globe-loading">載入中…</div>}>
        <WorldGlobe />
      </Suspense>

      <div className="at-glow" aria-hidden="true" />

      <div className="at-hero">
        <span className="at-eyebrow reveal">
          ✦ {COUNTRIES.length} COUNTRIES · {ALL_STOPS.length} CITIES
        </span>
        <h1 className="at-title">
          <span className="at-line">
            <span className="reveal-up">{t('heroTitle1')}</span>
          </span>
          <span className="at-line">
            <span className="reveal-up">{t('heroTitle2')}</span>
          </span>
        </h1>
        <p className="at-sub reveal">{t('heroSub')}</p>
        <div className="at-actions reveal">
          <button className="at-btn at-btn-primary magnetic" onClick={() => navigate(getRandomRegionPath())}>
            <span>{t('randomCity')}</span>
          </button>
          <Link to="/destinations" className="at-btn at-btn-ghost magnetic">
            <span>瀏覽全部目的地</span>
          </Link>
        </div>
      </div>

      <button
        className="at-lite-toggle"
        onClick={() => setLite((v) => !v)}
        title="低階裝置可開啟精簡模式，關閉粒子/游標等特效"
      >
        {lite ? '✨ 開啟特效' : '⚡ 精簡模式'}
      </button>

      <div className="at-hint reveal">拖曳地球 · 滑過國家 · 點擊探索</div>
    </div>
  )
}
