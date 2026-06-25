import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Globe from 'react-globe.gl'
import { MeshPhongMaterial, CanvasTexture } from 'three'
import { useNavigate } from 'react-router-dom'
import { COUNTRY_BY_ADMIN, ADMIN_ZH } from '../data/index.js'

// 地球材質：先給海洋底色，國旗地圖烤好後再貼上 map（不透明、無疊算）
const OCEAN = '#8bb8dd'
const GLOBE_MATERIAL = new MeshPhongMaterial({ color: OCEAN, emissive: 0x000000, shininess: 4 })

const OCEANS = [
  { lat: 4, lng: 165, text: 'Pacific Ocean' },
  { lat: -22, lng: 78, text: 'Indian Ocean' },
  { lat: 14, lng: -42, text: 'Atlantic Ocean' },
  { lat: -58, lng: -130, text: 'Southern Ocean' },
  { lat: 85, lng: 0, text: 'Arctic Ocean' },
]

const HOVER_ALT = 0.06
const HOVER_CAP = 'rgba(255, 226, 150, 0.55)' // 懸停高亮（半透明，透出底下國旗）

const FLAG_OVERRIDE = { France: 'fr', Norway: 'no' }
const flagCode = (feat) => {
  const p = feat.properties
  const iso = p.ISO_A2 && p.ISO_A2 !== '-99' ? p.ISO_A2 : FLAG_OVERRIDE[p.ADMIN]
  return iso ? iso.toLowerCase() : null
}

function countryPolygons(feat) {
  const g = feat.geometry
  if (!g) return []
  return g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []
}
function ringBox(ring) {
  let minx = 180, maxx = -180, miny = 90, maxy = -90
  for (const [x, y] of ring) {
    if (x < minx) minx = x
    if (x > maxx) maxx = x
    if (y < miny) miny = y
    if (y > maxy) maxy = y
  }
  return { minx, maxx, miny, maxy, area: (maxx - minx) * (maxy - miny) }
}
function largestPolygon(feat) {
  let best = null
  let bestArea = -1
  for (const p of countryPolygons(feat)) {
    const a = ringBox(p[0]).area
    if (a > bestArea) {
      bestArea = a
      best = p
    }
  }
  return best
}
function featureCenter(feat) {
  const p = largestPolygon(feat)
  if (!p) return null
  const b = ringBox(p[0])
  return { lat: (b.miny + b.maxy) / 2, lng: (b.minx + b.maxx) / 2 }
}

// 把所有國旗「烤」成一張等距圓柱(equirectangular)世界地圖，含深色國界線
function buildFlagMap(features, imgs, W, H) {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = OCEAN
  ctx.fillRect(0, 0, W, H)
  ctx.lineJoin = 'round'
  ctx.lineWidth = Math.max(1.5, W / 1600)
  ctx.strokeStyle = 'rgba(15, 26, 42, 0.9)'

  for (const f of features) {
    const code = flagCode(f)
    const img = code ? imgs[code] : null
    for (const poly of countryPolygons(f)) {
      const ring = poly[0]
      let minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity
      const path = new Path2D()
      ring.forEach(([lng, lat], i) => {
        const x = ((lng + 180) / 360) * W
        const y = ((90 - lat) / 180) * H
        if (i === 0) path.moveTo(x, y)
        else path.lineTo(x, y)
        if (x < minx) minx = x
        if (x > maxx) maxx = x
        if (y < miny) miny = y
        if (y > maxy) maxy = y
      })
      path.closePath()
      // 跳過跨越換日線（橫跨幾乎整個寬度）的多邊形，避免橫向拖糊
      if (maxx - minx > W * 0.8) continue
      if (img && img.width) {
        ctx.save()
        ctx.clip(path)
        ctx.drawImage(img, minx, miny, Math.max(1, maxx - minx), Math.max(1, maxy - miny))
        ctx.restore()
      }
      ctx.stroke(path)
    }
  }
  return canvas
}

// 首頁 3D 地球：國旗烤進地表貼圖（不透明、無大氣疊算）= 順；懸停浮起高亮、點擊鑽入國家頁。

export default function WorldGlobe() {
  const globeRef = useRef()
  const wrapRef = useRef()
  const navigate = useNavigate()
  const [countries, setCountries] = useState([])
  const [hover, setHover] = useState(null)
  const [diving, setDiving] = useState(false)
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
    globe.controls().enableZoom = false
    globe.pointOfView({ lat: 23.5, lng: 121, altitude: 1.9 }, 0)
  }, [countries.length])

  useEffect(() => {
    const globe = globeRef.current
    if (!globe) return
    globe.controls().autoRotate = !hover && !diving
  }, [hover, diving])

  // 載入國旗圖 → 烤成世界地圖 → 貼到地球材質
  useEffect(() => {
    if (!countries.length) return
    let alive = true
    ;(async () => {
      const codes = [...new Set(countries.map(flagCode).filter(Boolean))]
      const imgs = {}
      await Promise.all(
        codes.map(
          (code) =>
            new Promise((resolve) => {
              const img = new Image()
              img.onload = () => {
                imgs[code] = img
                resolve()
              }
              img.onerror = () => resolve()
              img.src = `/flags/${code}.png`
            })
        )
      )
      if (!alive) return
      const canvas = buildFlagMap(countries, imgs, 4096, 2048)
      const tex = new CanvasTexture(canvas)
      tex.anisotropy = 4
      GLOBE_MATERIAL.map = tex
      GLOBE_MATERIAL.emissiveMap = tex
      GLOBE_MATERIAL.emissive.set(0xffffff)
      GLOBE_MATERIAL.emissiveIntensity = 0.5 // 讓背光面的國旗也看得清
      GLOBE_MATERIAL.color.set(0xffffff)
      GLOBE_MATERIAL.needsUpdate = true
    })()
    return () => {
      alive = false
    }
  }, [countries])

  const matched = useCallback((feat) => (feat ? COUNTRY_BY_ADMIN[feat.properties.ADMIN] : null), [])

  // 多邊形層僅供互動與懸停高亮（國旗/國界已烤進貼圖）
  const capColor = useCallback((feat) => (hover && feat === hover ? HOVER_CAP : 'rgba(0,0,0,0)'), [hover])
  const altitude = useCallback((feat) => (hover && feat === hover ? HOVER_ALT : 0.002), [hover])

  const labelData = useMemo(() => {
    const cc = countries
      .filter((f) => (f.properties.LABELRANK ?? 9) <= 3)
      .map((f) => {
        const c = featureCenter(f)
        return c
          ? { lat: c.lat, lng: c.lng, text: f.properties.NAME || f.properties.ADMIN, size: 1.0, color: 'rgba(20, 30, 45, 0.95)' }
          : null
      })
      .filter(Boolean)
    const oc = OCEANS.map((o) => ({ ...o, size: 2.2, color: 'rgba(31, 64, 102, 0.6)' }))
    return [...cc, ...oc]
  }, [countries])

  const diveTo = useCallback(
    (feat) => {
      const data = matched(feat)
      if (!data) return
      const c = featureCenter(feat)
      const globe = globeRef.current
      setDiving(true)
      if (globe && c) {
        globe.controls().autoRotate = false
        globe.pointOfView({ lat: c.lat, lng: c.lng, altitude: 0.4 }, 900)
      }
      setTimeout(() => navigate(`/country/${data.id}`), 820)
    },
    [matched, navigate]
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
        globeMaterial={GLOBE_MATERIAL}
        showAtmosphere={false}
        polygonsData={countries}
        polygonAltitude={altitude}
        polygonCapColor={capColor}
        polygonSideColor={() => 'rgba(0,0,0,0)'}
        polygonStrokeColor={() => 'rgba(0,0,0,0)'}
        polygonsTransitionDuration={0}
        labelsData={labelData}
        labelLat={(d) => d.lat}
        labelLng={(d) => d.lng}
        labelText={(d) => d.text}
        labelSize={(d) => d.size}
        labelColor={(d) => d.color}
        labelResolution={2}
        labelDotRadius={0}
        labelAltitude={0.015}
        onPolygonHover={setHover}
        onPolygonClick={diveTo}
      />
    ),
    [countries, size, altitude, capColor, labelData, diveTo]
  )

  return (
    <div
      ref={wrapRef}
      className={`globe-wrap ${diving ? 'diving' : ''}`}
      style={{ cursor: hoverData ? 'pointer' : 'grab' }}
    >
      {globeEl}
      <div className="globe-dive-flash" aria-hidden="true" />

      {hover && !diving && (
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
              <p className="globe-card-desc">{hoverData.description}</p>
              <p className="globe-card-label">✦ 經典景點</p>
              <ul className="globe-card-list">
                {hoverData.highlights.slice(0, 4).map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
              <div className="globe-card-foot">
                <span>{hoverData.regions.length} 個精選區域</span>
                <span className="globe-card-cta">點擊鑽入 →</span>
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
