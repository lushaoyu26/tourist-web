import { useMemo, useState } from 'react'
import { estimateFlightPrice } from '../services/flights.js'
import { HOTEL_TIERS, fmt } from '../services/hotels.js'

// 互動預算估算器：人數、天數、住宿等級、旅遊風格 → 即時計算總預算與每人花費。

const STYLES = [
  { id: 0.75, name: '省錢背包', emoji: '🎒', desc: '小吃為主、大眾運輸' },
  { id: 1.0, name: '標準舒適', emoji: '🧳', desc: '餐廳與小吃混搭' },
  { id: 1.5, name: '豪華享受', emoji: '🥂', desc: '名店餐廳、行程全包' },
]

const mid = ([a, b]) => (a + b) / 2

export default function BudgetEstimator({ region, origin, month }) {
  const [people, setPeople] = useState(2)
  const [days, setDays] = useState(parseInt(region.suggestedDays) || 5)
  const [tier, setTier] = useState('mid')
  const [style, setStyle] = useState(1.0)

  const breakdown = useMemo(() => {
    const nights = Math.max(days - 1, 1)
    const flight = estimateFlightPrice({ region, originId: origin, month }) * people
    const hotel = mid(region.hotels[tier]) * nights * Math.ceil(people / 2)
    const food = mid(region.dailyCost.food) * style * days * people
    const transport = mid(region.dailyCost.transport) * days * people
    const activity = mid(region.dailyCost.activity) * style * days * people
    const total = flight + hotel + food + transport + activity
    return { flight, hotel, food, transport, activity, total }
  }, [region, origin, month, people, days, tier, style])

  const items = [
    { key: 'flight', label: '機票', emoji: '✈️', color: '#5e60ce' },
    { key: 'hotel', label: '住宿', emoji: '🏨', color: '#2a9d8f' },
    { key: 'food', label: '飲食', emoji: '🍜', color: '#f4a261' },
    { key: 'transport', label: '當地交通', emoji: '🚇', color: '#118ab2' },
    { key: 'activity', label: '門票活動', emoji: '🎟️', color: '#ef476f' },
  ]

  return (
    <div className="budget">
      <div className="budget-controls">
        <label className="control">
          <span className="control-label">旅伴人數</span>
          <div className="stepper">
            <button onClick={() => setPeople(Math.max(1, people - 1))}>−</button>
            <strong>{people} 人</strong>
            <button onClick={() => setPeople(Math.min(10, people + 1))}>＋</button>
          </div>
        </label>
        <label className="control">
          <span className="control-label">旅遊天數</span>
          <div className="stepper">
            <button onClick={() => setDays(Math.max(2, days - 1))}>−</button>
            <strong>{days} 天</strong>
            <button onClick={() => setDays(Math.min(21, days + 1))}>＋</button>
          </div>
        </label>
        <label className="control control-wide">
          <span className="control-label">住宿等級</span>
          <div className="seg">
            {HOTEL_TIERS.map((t) => (
              <button
                key={t.id}
                className={tier === t.id ? 'active' : ''}
                onClick={() => setTier(t.id)}
              >
                {t.emoji} {t.name}
              </button>
            ))}
          </div>
        </label>
        <label className="control control-wide">
          <span className="control-label">旅遊風格</span>
          <div className="seg">
            {STYLES.map((s) => (
              <button
                key={s.id}
                className={style === s.id ? 'active' : ''}
                onClick={() => setStyle(s.id)}
                title={s.desc}
              >
                {s.emoji} {s.name}
              </button>
            ))}
          </div>
        </label>
      </div>

      <div className="budget-result">
        <div className="budget-total">
          <p className="budget-total-label">
            {people} 人 {days} 天總預算（{origin} 出發 · {month} 月）
          </p>
          <p className="budget-total-value">{fmt(breakdown.total)}</p>
          <p className="budget-total-pp">每人約 {fmt(breakdown.total / people)}</p>
        </div>

        <div className="budget-bars">
          {items.map((item) => {
            const value = breakdown[item.key]
            const pct = Math.round((value / breakdown.total) * 100)
            return (
              <div key={item.key} className="budget-bar-row">
                <span className="budget-bar-label">
                  {item.emoji} {item.label}
                </span>
                <div className="budget-bar-track">
                  <div
                    className="budget-bar-fill"
                    style={{ width: `${Math.max(pct, 3)}%`, background: item.color }}
                  />
                </div>
                <span className="budget-bar-value">
                  {fmt(value)} <em>{pct}%</em>
                </span>
              </div>
            )
          })}
        </div>
      </div>
      <p className="panel-note">
        💡 估算基於該區域的市場行情中位數與所選風格係數，僅供行前規劃參考。
      </p>
    </div>
  )
}
