import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Globe from 'react-globe.gl'
import { MeshPhongMaterial, TextureLoader, MeshBasicMaterial, Mesh, DoubleSide, Group } from 'three'
import ConicPolygonGeometry from 'three-conic-polygon-geometry'
import { useNavigate } from 'react-router-dom'
import { COUNTRY_BY_ADMIN, ADMIN_ZH } from '../data/index.js'

// 淺藍海洋（加深一些）
const OCEAN_MATERIAL = new MeshPhongMaterial({
  color: '#8bb8dd',
  emissive: '#7aa9d2',
  emissiveIntensity: 0.22,
  shininess: 3,
})

// 幾個大洋的名稱（標籤）
const OCEANS = [
  { lat: 4, lng: 165, text: 'Pacific Ocean' },
  { lat: -22, lng: 78, text: 'Indian Ocean' },
  { lat: 14, lng: -42, text: 'Atlantic Ocean' },
  { lat: -58, lng: -130, text: 'Southern Ocean' },
  { lat: 85, lng: 0, text: 'Arctic Ocean' },
]

const NORD = {
  matched: '#4f8e8a', // 霧青湖綠（國旗載入前/載入失敗時的底色）
  matchedHover: '#3a6c68',
  land: '#cfd9e5',
  landHover: '#b9c6d7',
  side: 'rgba(70, 95, 110, 0.4)',
  stroke: 'rgba(70, 95, 120, 0.5)', // 國界線
}

// react-globe.gl 球半徑 100；國旗殼層略高於球面
const GLOBE_R = 100
const FLAG_LO = GLOBE_R * 1.005
const FLAG_HI = GLOBE_R * 1.006
const HOVER_ALT = 0.06 // 懸停浮起高度
const HOVER_SCALE = 1.06 // 懸停時國旗向外抬升（與多邊形浮起同步）

// Natural Earth 把 France / Norway 的 ISO_A2 標成 -99，手動補
const FLAG_OVERRIDE = { France: 'fr', Norway: 'no' }
const flagCode = (feat) => {
  const p = feat.properties
  const iso = p.ISO_A2 && p.ISO_A2 !== '-99' ? p.ISO_A2 : FLAG_OVERRIDE[p.ADMIN]
  return iso ? iso.toLowerCase() : null
}

const texLoader = new TextureLoader()
const texCache = {}
const flagTex = (code) => (texCache[code] ||= texLoader.load(`/flags/${code}.png`))

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

// 國家中心（取最大環的 bbox 中心）— 給標籤與「鑽入」動畫用
function featureCenter(feat) {
  let best = null
  let bestArea = -1
  for (const poly of countryPolygons(feat)) {
    const b = ringBox(poly[0])
    if (b.area > bestArea) {
      bestArea = b.area
      best = b
    }
  }
  return best ? { lat: (best.miny + best.maxy) / 2, lng: (best.minx + best.maxx) / 2 } : null
}

// 只取最大的那塊多邊形貼國旗（效能：每國 1 個 mesh，跳過小碎島）
function topPolygons(feat) {
  let best = null
  let bestArea = -1
  for (const p of countryPolygons(feat)) {
    const a = ringBox(p[0]).area
    if (a > bestArea) {
      bestArea = a
      best = p
    }
  }
  return best ? [best] : []
}

// 首頁 3D 地球：很淺藍海洋、每個國家鋪上國旗與英文名，懸停浮起並顯示景點，點擊「鑽入」該國。

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

  const matched = useCallback((feat) => (feat ? COUNTRY_BY_ADMIN[feat.properties.ADMIN] : null), [])

  const capColor = useCallback(
    (feat) => {
      const data = matched(feat)
      const isHover = hover && feat === hover
      if (data) return isHover ? NORD.matchedHover : NORD.matched
      return isHover ? NORD.landHover : NORD.land
    },
    [hover, matched]
  )

  const altitude = useCallback((feat) => (hover && feat === hover ? HOVER_ALT : 0.004), [hover])

  // 每個國家的國旗貼片資料
  const flagData = useMemo(() => {
    const out = []
    for (const f of countries) {
      const code = flagCode(f)
      if (!code) continue
      const polys = topPolygons(f)
      if (!polys.length) continue
      out.push({ admin: f.properties.ADMIN, code, matched: !!matched(f), polygons: polys })
    }
    return out
  }, [countries, matched])

  // 用 ConicPolygonGeometry 把國旗貼進國家輪廓、順著球面（UV 自動對應 bbox）
  const buildFlag = useCallback((d) => {
    const group = new Group()
    const tex = flagTex(d.code)
    const opacity = d.matched ? 0.82 : 0.5 // 收錄國家的國旗較鮮明
    for (const poly of d.polygons) {
      try {
        const geo = new ConicPolygonGeometry(poly, FLAG_LO, FLAG_HI, false, true, false, 9)
        const mat = new MeshBasicMaterial({
          map: tex,
          transparent: true,
          opacity,
          side: DoubleSide,
          depthWrite: false,
        })
        const mesh = new Mesh(geo, mat)
        mesh.raycast = () => {} // 點擊穿透，交給底下的國家多邊形
        group.add(mesh)
      } catch {
        // 個別多邊形（如跨換日線）建立失敗時略過
      }
    }
    group.userData.flagAdmin = d.admin
    group.renderOrder = 3
    return group
  }, [])

  // 懸停時把該國國旗也一起抬升（與多邊形浮起同步），做出「懸浮」效果
  useEffect(() => {
    const globe = globeRef.current
    const scene = globe && globe.scene && globe.scene()
    if (!scene) return
    const hoverAdmin = hover?.properties?.ADMIN
    scene.traverse((obj) => {
      if (obj.userData && obj.userData.flagAdmin) {
        obj.scale.setScalar(obj.userData.flagAdmin === hoverAdmin ? HOVER_SCALE : 1)
      }
    })
  }, [hover, flagData])

  // 標籤：所有國家英文名（小）+ 幾個大洋名稱（大、淡藍）
  const labelData = useMemo(() => {
    const cc = countries
      .map((f) => {
        const c = featureCenter(f)
        return c
          ? { lat: c.lat, lng: c.lng, text: f.properties.NAME || f.properties.ADMIN, size: 1.0, color: 'rgba(20, 30, 45, 0.95)' }
          : null
      })
      .filter(Boolean)
    const oc = OCEANS.map((o) => ({ ...o, size: 2.2, color: 'rgba(31, 64, 102, 0.55)' }))
    return [...cc, ...oc]
  }, [countries])

  // 點擊國家：先把鏡頭「鑽入」該國，再進入國家頁
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
        globeMaterial={OCEAN_MATERIAL}
        atmosphereColor="#bcd6ef"
        atmosphereAltitude={0.15}
        polygonsData={countries}
        polygonAltitude={altitude}
        polygonCapColor={capColor}
        polygonSideColor={() => NORD.side}
        polygonStrokeColor={() => NORD.stroke}
        polygonsTransitionDuration={250}
        customLayerData={flagData}
        customThreeObject={buildFlag}
        labelsData={labelData}
        labelLat={(d) => d.lat}
        labelLng={(d) => d.lng}
        labelText={(d) => d.text}
        labelSize={(d) => d.size}
        labelColor={(d) => d.color}
        labelResolution={2}
        labelDotRadius={0}
        labelAltitude={0.02}
        onPolygonHover={setHover}
        onPolygonClick={diveTo}
      />
    ),
    [countries, size, altitude, capColor, flagData, buildFlag, labelData, diveTo]
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
