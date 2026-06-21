import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { COUNTRIES } from '../data/index.js'

// 全站搜尋索引（建立一次）：所有國家 + 所有城市區域，支援中英文模糊比對。
const INDEX = (() => {
  const list = []
  for (const c of COUNTRIES) {
    list.push({
      type: 'country',
      label: c.name,
      en: c.en || '',
      icon: c.flag,
      sub: '國家',
      path: `/country/${c.id}`,
      hay: `${c.name} ${c.en || ''}`.toLowerCase(),
    })
    for (const r of c.regions) {
      list.push({
        type: 'region',
        label: r.name,
        en: r.en || '',
        icon: r.emoji || '📍',
        sub: `${c.flag} ${c.name}`,
        path: `/country/${c.id}/region/${r.id}`,
        hay: `${r.name} ${r.en || ''} ${c.name}`.toLowerCase(),
      })
    }
  }
  return list
})()

const CITY_COUNT = INDEX.filter((i) => i.type === 'region').length

function score(item, s) {
  const label = item.label.toLowerCase()
  const en = item.en.toLowerCase()
  let n = 0
  if (label === s || en === s) n += 100
  else if (label.startsWith(s) || en.startsWith(s)) n += 60
  else if (label.includes(s) || en.includes(s)) n += 30
  else n += 10 // 只在 sub（國家名）命中
  if (item.type === 'region') n += 5 // 城市略優先
  return n
}

export default function CitySearch({ open, onClose }) {
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (open) {
      setQ('')
      setActive(0)
      const t = setTimeout(() => inputRef.current?.focus(), 30)
      return () => clearTimeout(t)
    }
  }, [open])

  const results = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return []
    const out = INDEX.filter((i) => i.hay.includes(s))
    out.sort((a, b) => score(b, s) - score(a, s))
    return out.slice(0, 20)
  }, [q])

  useEffect(() => setActive(0), [q])

  if (!open) return null

  const go = (item) => {
    onClose()
    navigate(item.path)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault()
      go(results[active])
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-box" onClick={(e) => e.stopPropagation()}>
        <div className="search-input-row">
          <span className="search-ico">🔍</span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={`搜尋城市或國家…（全站 ${CITY_COUNT} 個城市）`}
            aria-label="搜尋城市或國家"
          />
          <kbd className="search-kbd">Esc</kbd>
        </div>

        <div className="search-results">
          {!q && <div className="search-hint">輸入城市或國家名稱（中英文皆可），例如「京都」「Kyoto」「冰島」。</div>}
          {q && results.length === 0 && <div className="search-empty">找不到符合「{q}」的目的地</div>}
          {results.map((r, i) => (
            <button
              key={r.path}
              className={`search-item ${i === active ? 'active' : ''}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(r)}
            >
              <span className="search-item-icon">{r.icon}</span>
              <span className="search-item-main">
                <strong>{r.label}</strong>
                {r.en && <span className="search-item-en">{r.en}</span>}
              </span>
              <span className="search-item-sub">{r.sub}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
