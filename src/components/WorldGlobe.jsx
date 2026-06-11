import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Globe from 'react-globe.gl'
import { MeshPhongMaterial } from 'three'
import { useNavigate } from 'react-router-dom'
import { COUNTRY_BY_ADMIN, ADMIN_ZH } from '../data/index.js'

const OCEAN_MATERIAL = new MeshPhongMaterial({
  color: '#0c1b3a',
  emissive: '#06122b',
  emissiveIntensity: 0.4,
  shininess: 0.9,
})

// 首頁 3D 地球：滑鼠懸停國家會「浮起」，已收錄攻略的國家以亮色標示，點擊即進入國家頁。

export default function WorldGlobe() {
  const globeRef = useRef()
  const wrapRef = useRef()
  const navigate = useNavigate()
  const [countries, setCountries] = useState([])
  const [hover, setHover] = useState(null)
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight })

  useEffect(() => {
    fetch('/data/countries.geojson')
      .then((r) => r.json())
      .then((geo) =>
        setCountries(geo.features.filter((f) => f.properties.ADMIN !== 'Antarctica'))
      )
  }, [])

  useEffect(() => {
    const onResize = () => {
      const el = wrapRef.current
      if (el) setSize({ w: el.clientWidth, h: el.clientHeight })
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const globe = globeRef.current
    if (!globe) return
    globe.controls().autoRotate = true
    globe.controls().autoRotateSpeed = 0.55
    globe.controls().minDistance = 180
    globe.controls().maxDistance = 480
    globe.pointOfView({ lat: 23.5, lng: 121, altitude: 1.9 }, 0)
  }, [countries.length])

  // 懸停時暫停自轉，移開後恢復
  useEffect(() => {
    const globe = globeRef.current
    if (!globe) return
    globe.controls().autoRotate = !hover
  }, [hover])

  const matched = useCallback((feat) => (feat ? COUNTRY_BY_ADMIN[feat.properties.ADMIN] : null), [])

  const capColor = useCallback(
    (feat) => {
      const data = matched(feat)
      const isHover = hover && feat === hover
      if (data) return isHover ? '#ffd166' : `${data.color}f0`
      return isHover ? 'rgba(160, 190, 255, 0.85)' : 'rgba(92, 110, 160, 0.42)'
    },
    [hover, matched]
  )

  const altitude = useCallback(
    (feat) => {
      if (hover && feat === hover) return 0.13
      return matched(feat) ? 0.045 : 0.012
    },
    [hover, matched]
  )

  const hoverData = matched(hover)
  const hoverNameZh = hover
    ? hoverData?.name || ADMIN_ZH[hover.properties.ADMIN] || hover.properties.ADMIN
    : null

  const globeEl = useMemo(
    () => (
      <Globe
        ref={globeRef}
        width={size.w}
        height={size.h}
        backgroundColor="rgba(0,0,0,0)"
        globeMaterial={OCEAN_MATERIAL}
        atmosphereColor="#5eead4"
        atmosphereAltitude={0.18}
        polygonsData={countries}
        polygonAltitude={altitude}
        polygonCapColor={capColor}
        polygonSideColor={() => 'rgba(20, 35, 75, 0.55)'}
        polygonStrokeColor={() => 'rgba(180, 220, 255, 0.35)'}
        polygonsTransitionDuration={250}
        onPolygonHover={setHover}
        onPolygonClick={(feat) => {
          const data = matched(feat)
          if (data) navigate(`/country/${data.id}`)
        }}
      />
    ),
    [countries, size, altitude, capColor, matched, navigate]
  )

  return (
    <div ref={wrapRef} className="globe-wrap" style={{ cursor: hoverData ? 'pointer' : 'grab' }}>
      {globeEl}

      {hover && (
        <aside className={`globe-card ${hoverData ? 'rich' : ''}`}>
          {hoverData ? (
            <>
              <div className="globe-card-head">
                <span className="globe-card-flag">{hoverData.flag}</span>
                <div>
                  <h3>{hoverData.name}</h3>
                  <p className="globe-card-en">{hoverData.en}</p>
                </div>
              </div>
              <p className="globe-card-tagline">{hoverData.tagline}</p>
              <ul className="globe-card-list">
                {hoverData.highlights.slice(0, 3).map((h) => (
                  <li key={h}>✦ {h}</li>
                ))}
              </ul>
              <div className="globe-card-foot">
                <span>{hoverData.regions.length} 個精選區域</span>
                <span className="globe-card-cta">點擊探索 →</span>
              </div>
            </>
          ) : (
            <>
              <div className="globe-card-head">
                <span className="globe-card-flag">🌐</span>
                <div>
                  <h3>{hoverNameZh}</h3>
                  <p className="globe-card-en">{hover.properties.ADMIN}</p>
                </div>
              </div>
              <p className="globe-card-tagline dim">精彩攻略即將推出，敬請期待！</p>
            </>
          )}
        </aside>
      )}
    </div>
  )
}
