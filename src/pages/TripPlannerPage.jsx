import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import WikiImage from '../components/WikiImage.jsx'
import { useTrip } from '../hooks/useTrip.jsx'
import { getRegion } from '../data/index.js'
import { ORIGINS, MONTHS } from '../services/flights.js'
import { defaultDays, stopCost, tripEstimate, serializeTrip, parseTripParam } from '../services/trip.js'
import { fmt } from '../services/hotels.js'

export default function TripPlannerPage() {
  const { items, remove, move, setDays, clear, load } = useTrip()
  const [searchParams, setSearchParams] = useSearchParams()
  const [origin, setOrigin] = useState('TPE')
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [copied, setCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  useEffect(() => {
    document.title = '我的行程規劃｜漫遊地球'
    window.scrollTo(0, 0)
  }, [])

  // 分享連結：?plan= 存在時，載入該行程並還原出發地/月份，再清掉網址參數
  useEffect(() => {
    const plan = searchParams.get('plan')
    if (!plan) return
    const parsed = parseTripParam(plan)
    if (parsed.length) load(parsed)
    const from = searchParams.get('from')
    if (from && ORIGINS.some((o) => o.id === from)) setOrigin(from)
    const mm = Number(searchParams.get('m'))
    if (mm >= 1 && mm <= 12) setMonth(mm)
    setSearchParams({}, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const shareTrip = async () => {
    const plan = serializeTrip(items)
    if (!plan) return
    const url = `${window.location.origin}/trip?plan=${encodeURIComponent(plan)}&from=${origin}&m=${month}`
    try {
      await navigator.clipboard.writeText(url)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      // 不支援剪貼簿時略過
    }
  }

  // 把 trip items 解析成完整的國家/區域資料，過濾掉找不到的
  const stops = useMemo(
    () =>
      items
        .map((it) => {
          const { country, region } = getRegion(it.countryId, it.regionId)
          if (!country || !region) return null
          return { ...it, country, region, days: it.days ?? defaultDays(region) }
        })
        .filter(Boolean),
    [items]
  )

  const est = useMemo(() => tripEstimate(stops, origin, month), [stops, origin, month])

  const copyItinerary = async () => {
    const lines = stops.map(
      (s, i) => `${i + 1}. ${s.country.flag} ${s.region.name}（${s.days} 天）— ${s.region.tagline}`
    )
    const text = [
      '🌏 我的旅遊行程 — 漫遊地球 WanderGlobe',
      ...lines,
      '',
      `共 ${stops.length} 站 · ${est.totalDays} 天 · 每人估算約 ${fmt(est.total)}`,
    ].join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 不支援剪貼簿時略過
    }
  }

  if (stops.length === 0 && !searchParams.get('plan')) {
    return (
      <div className="page trip-page">
        <section className="trip-hero">
          <h1>🧳 我的行程規劃</h1>
          <p>把喜歡的城市加進來，自由組合一趟跨國旅程</p>
        </section>
        <div className="trip-empty">
          <span className="trip-empty-icon">🗺️</span>
          <h2>行程是空的</h2>
          <p>到任何城市攻略頁，點「＋ 加入行程」就能開始組合你的旅程。</p>
          <Link to="/destinations" className="btn btn-primary">
            瀏覽全部目的地 →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page trip-page">
      <section className="trip-hero">
        <h1>🧳 我的行程規劃</h1>
        <p>
          {stops.map((s, i) => (
            <span key={`${s.countryId}-${s.regionId}`}>
              {i > 0 && <span className="trip-route-arrow"> → </span>}
              {s.country.flag} {s.region.name}
            </span>
          ))}
        </p>
      </section>

      <div className="trip-layout">
        <div className="trip-stops">
          {stops.map((s, i) => (
            <div key={`${s.countryId}-${s.regionId}`} className="trip-stop">
              <span className="trip-stop-no">{i + 1}</span>
              <div className="trip-stop-media">
                <WikiImage wiki={s.region.wiki} alt={s.region.name} emoji={s.region.emoji} />
              </div>
              <div className="trip-stop-body">
                <h3>
                  <Link to={`/country/${s.countryId}/region/${s.regionId}`}>
                    {s.country.flag} {s.region.name}
                  </Link>
                  <span className="trip-stop-en">{s.region.en}</span>
                </h3>
                <p className="trip-stop-tagline">{s.region.tagline}</p>
                <div className="trip-stop-controls">
                  <div className="trip-days">
                    <span>停留</span>
                    <button onClick={() => setDays(i, Math.max(1, s.days - 1))}>−</button>
                    <strong>{s.days} 天</strong>
                    <button onClick={() => setDays(i, Math.min(30, s.days + 1))}>＋</button>
                  </div>
                  <span className="trip-stop-cost">每人約 {fmt(stopCost(s.region, s.days))}</span>
                </div>
              </div>
              <div className="trip-stop-actions">
                <button title="上移" disabled={i === 0} onClick={() => move(i, -1)}>
                  ↑
                </button>
                <button title="下移" disabled={i === stops.length - 1} onClick={() => move(i, 1)}>
                  ↓
                </button>
                <button title="移除" className="trip-stop-remove" onClick={() => remove(s.countryId, s.regionId)}>
                  ✕
                </button>
              </div>
            </div>
          ))}

          <div className="trip-add-more">
            <Link to="/destinations">＋ 繼續加入更多城市</Link>
            <button className="trip-clear" onClick={clear}>
              清空行程
            </button>
          </div>
        </div>

        <aside className="trip-summary">
          <h3>💰 行程估算</h3>
          <div className="trip-summary-controls">
            <label className="control">
              <span className="control-label">出發地</span>
              <select value={origin} onChange={(e) => setOrigin(e.target.value)}>
                {ORIGINS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.flag} {o.city}
                  </option>
                ))}
              </select>
            </label>
            <label className="control">
              <span className="control-label">出發月份</span>
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m} 月
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="trip-summary-rows">
            <div className="trip-summary-row">
              <span>✈️ 國際機票（飛第一站來回）</span>
              <strong>{fmt(est.flight)}</strong>
            </div>
            <div className="trip-summary-row">
              <span>🏨 各站地面花費（{stops.length} 站）</span>
              <strong>{fmt(est.ground)}</strong>
            </div>
          </div>

          <div className="trip-summary-total">
            <p className="trip-summary-total-label">
              {stops.length} 站 · {est.totalDays} 天 · 每人估算
            </p>
            <p className="trip-summary-total-value">{fmt(est.total)}</p>
          </div>

          <div className="trip-share-row">
            <button className="btn btn-primary trip-copy" onClick={copyItinerary}>
              {copied ? '✓ 已複製行程' : '📋 複製行程文字'}
            </button>
            <button className="btn btn-ghost trip-share" onClick={shareTrip}>
              {linkCopied ? '✓ 連結已複製' : '🔗 複製分享連結'}
            </button>
          </div>
          <p className="panel-note panel-note-share">
            🔗 分享連結把你排好的城市、天數與出發設定編進網址，朋友點開就看到同一份行程（會覆蓋他原本的行程）。
          </p>
          <p className="panel-note">
            💡 估算含第一站來回機票 + 各站住宿（雙人房均分）、餐飲、交通、門票。跨城市交通與第二段以後的機票未計入，僅供行前抓預算參考。
          </p>
        </aside>
      </div>
    </div>
  )
}
