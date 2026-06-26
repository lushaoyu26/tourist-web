import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Globe from 'react-globe.gl'
import { MeshBasicMaterial, CanvasTexture, Mesh, DoubleSide, TextureLoader } from 'three'
import ConicPolygonGeometry from 'three-conic-polygon-geometry'
import { useNavigate } from 'react-router-dom'
import { COUNTRY_BY_ADMIN, ADMIN_ZH } from '../data/index.js'

// 地球材質：不打光（避免明暗交界掃過造成「灰色閃爍」與背光面偏暗）；國旗地圖烤好後貼上 map
const OCEAN = '#0a1730' // 深色海洋（電影感）：亮色國旗在深海上發光
const GLOBE_MATERIAL = new MeshBasicMaterial({ color: OCEAN })

const OCEANS = [
  { lat: 4, lng: 165, text: 'Pacific Ocean' },
  { lat: -22, lng: 78, text: 'Indian Ocean' },
  { lat: 14, lng: -42, text: 'Atlantic Ocean' },
  { lat: -58, lng: -130, text: 'Southern Ocean' },
  { lat: 85, lng: 0, text: 'Arctic Ocean' },
]

const GLOBE_R = 100
// 懸停浮起的單面國旗殼層高度（浮在烤貼圖表面之上）
const HOVER_LO = GLOBE_R * 1.05
const HOVER_HI = GLOBE_R * 1.053

// 單面國旗貼圖（懸停時用，快取）
const flagTexLoader = new TextureLoader()
const flagTexCache = {}
const flagTex = (code) => (flagTexCache[code] ||= flagTexLoader.load(`/flags/${code}.png`))

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

const loadImg = (code) =>
  new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = `/flags/${code}.png`
  })

// 把環的經度「解纏」成連續值（處理跨換日線：相鄰點跳超過 180° 就 ±360 修正）
function ringToPts(ring) {
  const pts = []
  let prev = null
  for (const [lng, lat] of ring) {
    let L = lng
    if (prev !== null) {
      while (L - prev > 180) L -= 360
      while (L - prev < -180) L += 360
    }
    pts.push([L, lat])
    prev = L
  }
  return pts
}

// 畫單一多邊形（國旗裁切 + 深色描邊），用 -W/0/+W 三個位移涵蓋換日線兩側
function drawPoly(ctx, pts, img, W, H) {
  let minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity
  const path = new Path2D()
  pts.forEach(([L, lat], i) => {
    const x = ((L + 180) / 360) * W
    const y = ((90 - lat) / 180) * H
    if (i === 0) path.moveTo(x, y)
    else path.lineTo(x, y)
    if (x < minx) minx = x
    if (x > maxx) maxx = x
    if (y < miny) miny = y
    if (y > maxy) maxy = y
  })
  path.closePath()
  const bw = Math.max(1, maxx - minx)
  const bh = Math.max(1, maxy - miny)
  for (const shift of [-W, 0, W]) {
    ctx.save()
    ctx.translate(shift, 0)
    if (img && img.width) {
      ctx.save()
      ctx.clip(path)
      ctx.drawImage(img, minx, miny, bw, bh)
      ctx.restore()
    }
    ctx.stroke(path)
    ctx.restore()
  }
}

// 把所有國旗「烤」成一張等距圓柱(equirectangular)世界地圖（含深色國界線）。
// 分批載入國旗圖（一次少量、畫完即釋放）以控制記憶體。
async function buildFlagMap(features, W, H) {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = OCEAN
  ctx.fillRect(0, 0, W, H)
  ctx.lineJoin = 'round'
  ctx.lineWidth = Math.max(1.5, W / 1600)
  ctx.strokeStyle = 'rgba(15, 26, 42, 0.9)'

  const groups = new Map() // code -> 多邊形(pts) 陣列
  const noFlag = []
  for (const f of features) {
    const code = flagCode(f)
    for (const poly of countryPolygons(f)) {
      const pts = ringToPts(poly[0])
      if (code) {
        if (!groups.has(code)) groups.set(code, [])
        groups.get(code).push(pts)
      } else {
        noFlag.push(pts)
      }
    }
  }

  const codes = [...groups.keys()]
  const BATCH = 6
  for (let i = 0; i < codes.length; i += BATCH) {
    const slice = codes.slice(i, i + BATCH)
    const imgs = await Promise.all(slice.map(loadImg))
    slice.forEach((code, j) => {
      for (const pts of groups.get(code)) drawPoly(ctx, pts, imgs[j], W, H)
    })
  }
  for (const pts of noFlag) drawPoly(ctx, pts, null, W, H)
  return canvas
}

// 首頁 3D 地球：國旗烤進地表貼圖（不透明、無大氣疊算）= 順；懸停浮起高亮、點擊鑽入國家頁。

export default function WorldGlobe({ focus = null }) {
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
    globe.controls().autoRotate = !hover && !diving && !focus
  }, [hover, diving, focus])

  // 捲動穿越各大洲：focus 改變時把鏡頭飛到該洲（無 focus = 總覽 + 自轉）
  const fLat = focus?.lat
  const fLng = focus?.lng
  const fAlt = focus?.altitude
  useEffect(() => {
    const globe = globeRef.current
    if (!globe) return
    if (fLat != null) {
      globe.controls().autoRotate = false
      globe.pointOfView({ lat: fLat, lng: fLng, altitude: fAlt ?? 1.6 }, 1400)
    } else {
      globe.controls().autoRotate = true
      globe.pointOfView({ lat: 18, lng: 60, altitude: 2.4 }, 1400)
    }
  }, [fLat, fLng, fAlt])

  // 烤國旗世界地圖 → 貼到地球材質（不打光，全亮、無明暗交界閃爍）
  useEffect(() => {
    if (!countries.length) return
    let alive = true
    ;(async () => {
      const canvas = await buildFlagMap(countries, 4096, 2048)
      if (!alive) return
      const tex = new CanvasTexture(canvas)
      tex.anisotropy = 4
      GLOBE_MATERIAL.map = tex
      GLOBE_MATERIAL.color.set(0xffffff)
      GLOBE_MATERIAL.needsUpdate = true
    })()
    return () => {
      alive = false
    }
  }, [countries])

  const matched = useCallback((feat) => (feat ? COUNTRY_BY_ADMIN[feat.properties.ADMIN] : null), [])

  // 多邊形層全透明、固定，僅供滑鼠偵測（國旗/國界已烤進貼圖；懸停效果用浮起國旗）
  const capColor = useCallback(() => 'rgba(0,0,0,0)', [])
  const altitude = useCallback(() => 0.004, [])

  // 懸停：在該國疊一面「浮起的國旗」（只有一面，滑到哪浮到哪）
  useEffect(() => {
    const scene = globeRef.current?.scene?.()
    if (!scene || !hover || diving) return
    const code = flagCode(hover)
    const poly = largestPolygon(hover)
    if (!code || !poly) return
    let mesh
    try {
      const geo = new ConicPolygonGeometry(poly, HOVER_LO, HOVER_HI, false, true, false, 10)
      const mat = new MeshBasicMaterial({
        map: flagTex(code),
        side: DoubleSide,
        transparent: true,
        opacity: 0.98,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -6,
        polygonOffsetUnits: -6,
      })
      mesh = new Mesh(geo, mat)
      mesh.raycast = () => {}
      mesh.renderOrder = 5
      scene.add(mesh)
    } catch {
      return
    }
    return () => {
      scene.remove(mesh)
      mesh.geometry?.dispose?.()
      mesh.material?.dispose?.() // 不 dispose map：國旗貼圖有快取共用
    }
  }, [hover, diving])

  const labelData = useMemo(() => {
    const cc = countries
      .filter((f) => (f.properties.LABELRANK ?? 9) <= 3)
      .map((f) => {
        const c = featureCenter(f)
        return c
          ? { lat: c.lat, lng: c.lng, text: f.properties.NAME || f.properties.ADMIN, size: 1.0, color: 'rgba(228, 240, 255, 0.92)' }
          : null
      })
      .filter(Boolean)
    const oc = OCEANS.map((o) => ({ ...o, size: 2.2, color: 'rgba(150, 190, 235, 0.5)' }))
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
        showAtmosphere={true}
        atmosphereColor="#3f7bff"
        atmosphereAltitude={0.26}
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
