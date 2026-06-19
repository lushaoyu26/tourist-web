import { lazy, Suspense, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { COUNTRIES, COUNTRY_BY_ID, FEATURED_IDS, ALL_STOPS, getRandomRegionPath } from '../data/index.js'

const WorldGlobe = lazy(() => import('../components/WorldGlobe.jsx'))

export default function HomePage() {
  const navigate = useNavigate()

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
          轉動地球，
          <br />
          找到你的下一場旅行
        </h1>
        <p>滑鼠懸停國家立即浮起預覽 · 點擊深入區域攻略、機票住宿與預算估算</p>
        <button className="home-random" onClick={() => navigate(getRandomRegionPath())}>
          🎲 隨機探索一個城市
        </button>
      </div>

      <div className="home-hint">🖱️ 拖曳旋轉 · 滾輪縮放 · 懸停預覽 · 點擊探索</div>

      <div className="home-chips">
        {FEATURED_IDS.map((id) => COUNTRY_BY_ID[id]).map((c) => (
          <Link key={c.id} to={`/country/${c.id}`} className="home-chip" style={{ '--chip': c.color }}>
            <span className="home-chip-flag">{c.flag}</span>
            <span>{c.name}</span>
            <span className="home-chip-count">{c.regions.length} 區域</span>
          </Link>
        ))}
        <Link to="/destinations" className="home-chip home-chip-more" style={{ '--chip': '#6ee7d8' }}>
          <span className="home-chip-flag">🗺️</span>
          <span>{COUNTRIES.length} 國 · {ALL_STOPS.length} 城市</span>
        </Link>
      </div>
    </div>
  )
}
