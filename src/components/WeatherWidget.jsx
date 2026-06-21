import { useEffect, useState } from 'react'

// 城市即時天氣：用免金鑰的 Open-Meteo API，依城市座標抓現在天氣與未來 3 天預報。
// 純前端、不需後端與 API key；離線時 fetch 失敗會優雅顯示提示。

// WMO 天氣代碼 → 圖示與中文描述
const WMO = {
  0: ['☀️', '晴'],
  1: ['🌤️', '大致晴朗'],
  2: ['⛅', '局部多雲'],
  3: ['☁️', '陰'],
  45: ['🌫️', '霧'],
  48: ['🌫️', '霧凇'],
  51: ['🌦️', '毛毛雨'],
  53: ['🌦️', '毛毛雨'],
  55: ['🌦️', '毛毛雨'],
  56: ['🌧️', '凍雨'],
  57: ['🌧️', '凍雨'],
  61: ['🌧️', '小雨'],
  63: ['🌧️', '中雨'],
  65: ['🌧️', '大雨'],
  66: ['🌧️', '凍雨'],
  67: ['🌧️', '凍雨'],
  71: ['🌨️', '小雪'],
  73: ['🌨️', '中雪'],
  75: ['❄️', '大雪'],
  77: ['🌨️', '雪粒'],
  80: ['🌦️', '陣雨'],
  81: ['🌧️', '陣雨'],
  82: ['⛈️', '強陣雨'],
  85: ['🌨️', '陣雪'],
  86: ['❄️', '強陣雪'],
  95: ['⛈️', '雷雨'],
  96: ['⛈️', '雷雨冰雹'],
  99: ['⛈️', '雷雨冰雹'],
}
const wmo = (code) => WMO[code] || ['🌡️', '—']

const WEEKDAY = ['日', '一', '二', '三', '四', '五', '六']
const dayLabel = (iso, i) => (i === 0 ? '今天' : `週${WEEKDAY[new Date(iso + 'T00:00:00').getDay()]}`)

export default function WeatherWidget({ region }) {
  const [state, setState] = useState({ status: 'loading', data: null })

  useEffect(() => {
    if (!region?.center) return
    const [lat, lng] = region.center
    const ctrl = new AbortController()
    setState({ status: 'loading', data: null })
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min` +
      `&forecast_days=4&timezone=auto`
    fetch(url, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('weather'))))
      .then((d) => setState({ status: 'ok', data: d }))
      .catch((e) => {
        if (e.name !== 'AbortError') setState({ status: 'error', data: null })
      })
    return () => ctrl.abort()
  }, [region?.id])

  const { status, data } = state

  return (
    <section className="weather">
      <div className="weather-head">
        <h3>🌤️ 當地天氣</h3>
        <span className="weather-src">即時資料 · Open-Meteo</span>
      </div>

      {status === 'loading' && <p className="weather-msg">載入當地天氣中…</p>}
      {status === 'error' && <p className="weather-msg">天氣資料需要網路連線，稍後再試。</p>}

      {status === 'ok' && data?.current && (
        <div className="weather-body">
          <div className="weather-now">
            <span className="weather-now-icon">{wmo(data.current.weather_code)[0]}</span>
            <div className="weather-now-text">
              <strong>{Math.round(data.current.temperature_2m)}°C</strong>
              <span>{wmo(data.current.weather_code)[1]}</span>
            </div>
          </div>
          <div className="weather-forecast">
            {data.daily.time.slice(0, 4).map((iso, i) => (
              <div key={iso} className="weather-day">
                <span className="weather-day-name">{dayLabel(iso, i)}</span>
                <span className="weather-day-icon">{wmo(data.daily.weather_code[i])[0]}</span>
                <span className="weather-day-temp">
                  <strong>{Math.round(data.daily.temperature_2m_max[i])}°</strong>
                  <em>{Math.round(data.daily.temperature_2m_min[i])}°</em>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
