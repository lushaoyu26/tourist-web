import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// 區域攻略地圖：景點以 emoji 標記呈現，側欄列表與地圖雙向連動。

const TYPE_META = {
  sight: { emoji: '📍', label: '地標' },
  culture: { emoji: '⛩️', label: '文化古蹟' },
  nature: { emoji: '🏞️', label: '自然景觀' },
  shopping: { emoji: '🛍️', label: '購物市集' },
  food: { emoji: '🍜', label: '美食' },
}

function makeIcon(attraction, active) {
  const meta = TYPE_META[attraction.type] || TYPE_META.sight
  return L.divIcon({
    className: 'poi-icon',
    html: `<div class="poi-pin ${active ? 'active' : ''} ${attraction.mustSee ? 'must' : ''}">${meta.emoji}</div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  })
}

function FlyTo({ target }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo(target, Math.max(map.getZoom(), 13), { duration: 0.8 })
  }, [target, map])
  return null
}

export default function GuideMap({ region }) {
  const [selected, setSelected] = useState(null)
  const selectedAttraction = region.attractions.find((a) => a.name === selected)

  return (
    <div className="guide-map">
      <div className="guide-map-list">
        {region.attractions.map((a, i) => {
          const meta = TYPE_META[a.type] || TYPE_META.sight
          return (
            <button
              key={a.name}
              className={`guide-map-item ${selected === a.name ? 'active' : ''}`}
              onClick={() => setSelected(a.name)}
            >
              <span className="guide-map-item-no">{i + 1}</span>
              <div className="guide-map-item-body">
                <h4>
                  {meta.emoji} {a.name}
                  {a.mustSee && <span className="badge-must">必去</span>}
                </h4>
                <p>{a.desc}</p>
                <div className="guide-map-item-meta">
                  <span className="chip chip-soft">{meta.label}</span>
                  <span className="chip chip-soft">⏱ {a.time}</span>
                  <a
                    className="guide-map-item-gmap"
                    href={`https://www.google.com/maps/search/?api=1&query=${a.coords[0]},${a.coords[1]}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Google 地圖 ↗
                  </a>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="guide-map-canvas">
        <MapContainer
          center={region.center}
          zoom={region.zoom}
          scrollWheelZoom={false}
          className="guide-map-leaflet"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          {region.attractions.map((a) => (
            <Marker
              key={a.name}
              position={a.coords}
              icon={makeIcon(a, selected === a.name)}
              eventHandlers={{ click: () => setSelected(a.name) }}
            >
              <Popup>
                <strong>{a.name}</strong>
                <br />
                {a.desc}
              </Popup>
            </Marker>
          ))}
          <FlyTo target={selectedAttraction?.coords} />
        </MapContainer>
      </div>
    </div>
  )
}
