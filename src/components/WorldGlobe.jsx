import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Globe from 'react-globe.gl'
import {
  MeshPhongMaterial,
  MeshBasicMaterial,
  Mesh,
  DoubleSide,
  BufferGeometry,
  Float32BufferAttribute,
  CanvasTexture,
  LinearFilter,
} from 'three'
import ConicPolygonGeometry from 'three-conic-polygon-geometry'
import { useNavigate } from 'react-router-dom'
import { COUNTRY_BY_ADMIN, ADMIN_ZH } from '../data/index.js'

// 淺藍海洋
const OCEAN_MATERIAL = new MeshPhongMaterial({
  color: '#8bb8dd',
  emissive: '#7aa9d2',
  emissiveIntensity: 0.22,
  shininess: 3,
})

// 幾個大洋名稱
const OCEANS = [
  { lat: 4, lng: 165, text: 'Pacific Ocean' },
  { lat: -22, lng: 78, text: 'Indian Ocean' },
  { lat: 14, lng: -42, text: 'Atlantic Ocean' },
  { lat: -58, lng: -130, text: 'Southern Ocean' },
  { lat: 85, lng: 0, text: 'Arctic Ocean' },
]

const NORD = {
  capBase: '#cdd9e6', // 國旗底下的中性底色（多被國旗蓋住）
  capHover: 'rgba(255, 221, 160, 0.92)', // 懸停浮起時的暖色高亮
  side: 'rgba(70, 95, 110, 0.4)',
  stroke: 'rgba(70, 95, 120, 0.5)',
}

const GLOBE_R = 100
const FLAG_LO = GLOBE_R * 1.007
const FLAG_HI = GLOBE_R * 1.008
const HOVER_ALT = 0.06

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

// 首頁 3D 地球：所有國家用「單一合併網格 + 國旗圖集」鋪上國旗（1 個 draw call），
// 淺藍海洋、大洋與國家英文名標籤、懸停浮起、點擊「鑽入」國家頁。

export default function WorldGlobe() {
  const globeRef = useRef()
  const wrapRef = useRef()
  const navigate = useNavigate()
  const [countries, setCountries] = useState([])
  const [hover, setHover] = useState(null)
  const [diving, setDiving] = useState(false)
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight })
  const [flagObject, setFlagObject] = useState(null)

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
    (feat) => (hover && feat === hover ? NORD.capHover : NORD.capBase),
    [hover]
  )
  const altitude = useCallback((feat) => (hover && feat === hover ? HOVER_ALT : 0.004), [hover])

  // 建立「國旗圖集 + 單一合併網格」（非同步：載入所有國旗圖、拼成一張、合併幾何）
  useEffect(() => {
    if (!countries.length) return
    let alive = true
    let built = null
    ;(async () => {
      const items = []
      for (const f of countries) {
        const code = flagCode(f)
        if (!code) continue
        const poly = largestPolygon(f)
        if (!poly) continue
        items.push({ code, opacity: matched(f) ? 0.82 : 0.5, poly })
      }
      if (!items.length) return

      const codes = [...new Set(items.map((i) => i.code))]
      const cols = Math.ceil(Math.sqrt(codes.length))
      const rows = Math.ceil(codes.length / cols)
      const cw = 96, ch = 64
      const canvas = document.createElement('canvas')
      canvas.width = cols * cw
      canvas.height = rows * ch
      const ctx = canvas.getContext('2d')
      const cell = {}
      await Promise.all(
        codes.map(
          (code, idx) =>
            new Promise((resolve) => {
              const col = idx % cols
              const row = Math.floor(idx / cols)
              cell[code] = { col, row }
              const img = new Image()
              img.onload = () => {
                try {
                  ctx.drawImage(img, col * cw + 1, row * ch + 1, cw - 2, ch - 2)
                } catch {
                  /* ignore */
                }
                resolve()
              }
              img.onerror = () => resolve()
              img.src = `/flags/${code}.png`
            })
        )
      )
      if (!alive) return

      const atlas = new CanvasTexture(canvas)
      atlas.minFilter = LinearFilter
      atlas.magFilter = LinearFilter

      const positions = []
      const uvs = []
      const colors = []
      for (const it of items) {
        let geo
        try {
          geo = new ConicPolygonGeometry(it.poly, FLAG_LO, FLAG_HI, false, true, false, 9).toNonIndexed()
        } catch {
          continue
        }
        const pos = geo.attributes.position
        const uv = geo.attributes.uv
        if (!pos || !uv) {
          geo.dispose?.()
          continue
        }
        const c = cell[it.code]
        const n = pos.count
        for (let i = 0; i < n; i++) {
          positions.push(pos.getX(i), pos.getY(i), pos.getZ(i))
          const u = Math.min(1, Math.max(0, uv.getX(i)))
          const v = Math.min(1, Math.max(0, uv.getY(i)))
          uvs.push((c.col + 0.03 + u * 0.94) / cols, (rows - c.row - 1 + 0.03 + v * 0.94) / rows)
          colors.push(1, 1, 1, it.opacity)
        }
        geo.dispose?.()
      }
      if (!alive || !positions.length) return

      const merged = new BufferGeometry()
      merged.setAttribute('position', new Float32BufferAttribute(positions, 3))
      merged.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
      merged.setAttribute('color', new Float32BufferAttribute(colors, 4))
      const mat = new MeshBasicMaterial({
        map: atlas,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        polygonOffsetUnits: -4,
      })
      const mesh = new Mesh(merged, mat)
      mesh.renderOrder = 3
      mesh.raycast = () => {}
      built = mesh
      setFlagObject(mesh)
    })()

    return () => {
      alive = false
      if (built) {
        built.geometry?.dispose?.()
        built.material?.map?.dispose?.()
        built.material?.dispose?.()
      }
    }
  }, [countries, matched])

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

  const passThrough = useCallback((d) => d, [])

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
        polygonsTransitionDuration={220}
        customLayerData={flagObject ? [flagObject] : []}
        customThreeObject={passThrough}
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
    [countries, size, altitude, capColor, flagObject, passThrough, labelData, diveTo]
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
